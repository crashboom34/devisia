import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EstimateRequest {
  projectId: string;
  projectDescription: string;
  scenarioType: "eco" | "standard" | "premium";
  temperature?: number;
  templateId?: string;
  adminTier?: string;
}

const PRICING_COEFFICIENTS: Record<string, number> = {
  eco: 0.85,
  standard: 1.00,
  premium: 1.25,
};

const ALLOWED_TVA_RATES = [0, 5.5, 10, 20];

const TIER_TO_MODEL_ID: Record<string, string> = {
  starter:  "mistralai/mistral-large-2512",
  business: "mistralai/mistral-large-2512",
  pro:      "openai/gpt-4.1",
  unlimited: "openai/gpt-4.1",
};

export function resolveTierModel(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return TIER_TO_MODEL_ID[normalized] ?? TIER_TO_MODEL_ID["starter"];
}

function validateTvaRate(rate: number): number {
  return ALLOWED_TVA_RATES.reduce((prev, curr) =>
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  let supabase: any;
  let userId: string | null = null;
  let projectId: string | null = null;
  let usedModelName = "unknown";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    userId = user.id;

    const body: EstimateRequest = await req.json();
    const { projectDescription, scenarioType, temperature, templateId, adminTier } = body;
    projectId = body.projectId;

    if (!projectId || !projectDescription || !scenarioType) {
      throw new Error("Missing required fields");
    }
    if (!PRICING_COEFFICIENTS[scenarioType]) {
      throw new Error("Invalid scenario type");
    }

    if (projectDescription === "__TEST_MODEL__") {
      const isDev = !Deno.env.get("DENO_DEPLOYMENT_ID");
      if (isDev) {
        const testTier = adminTier || "starter";
        const testModelId = resolveTierModel(testTier);
        return new Response(
          JSON.stringify({ test: true, tier: testTier, model_id: testModelId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const apiTemperature = temperature !== undefined ? temperature : 0.5;
    const coefficient = PRICING_COEFFICIENTS[scenarioType];

    let templateData = null;
    if (templateId && templateId !== "none") {
      const { data: template } = await supabase
        .from("estimate_templates")
        .select("*")
        .eq("template_id", templateId)
        .eq("is_active", true)
        .maybeSingle();
      if (template) templateData = template;
    }

    const { data: configData } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "openrouter_api_key")
      .maybeSingle();

    let openrouterApiKey: string | undefined;
    if (configData?.value) {
      const raw = configData.value;
      openrouterApiKey = typeof raw === "string" ? raw : String(raw);
    }
    if (!openrouterApiKey) {
      openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    }
    if (!openrouterApiKey) {
      throw new Error(
        "Cle API OpenRouter non configuree. Allez dans Admin > Configuration pour ajouter votre cle API OpenRouter."
      );
    }

    await enforceMonthlyLimit(supabase, user.id);

    const { model, resolvedTier } = await selectModel(supabase, user.id, adminTier);

    console.log(`[generate-estimate] Tier resolved: ${resolvedTier}`);
    console.log(`[generate-estimate] Model selected: ${model.display_name} (${model.model_id})`);

    const fallbackModels = await getFallbackModels(supabase, model.id);
    const modelsToTry = [model, ...fallbackModels];

    let templateContext = "";
    if (templateData) {
      templateContext = `\n**TEMPLATE DE REFERENCE: ${templateData.name}**\n**Categorie:** ${templateData.category}\n\n**LOTS ET POSTES RECOMMANDES:**\n${JSON.stringify(templateData.lots, null, 2)}\n\nUTILISE CE TEMPLATE comme structure de base. Adapte les lots et postes a la description du projet.\nPour le scenario ${scenarioType.toUpperCase()}, utilise les specifications de "gamme_${scenarioType}" de chaque poste.\n\n`;
    }

    const prompt = buildPrompt(projectDescription, scenarioType, coefficient, templateContext);

    let estimateData: any = null;
    let usedModel = model;
    let tokensInput = 0;
    let tokensOutput = 0;
    let lastError: string | null = null;

    for (const currentModel of modelsToTry) {
      const result = await callOpenRouter(currentModel, openrouterApiKey, supabaseUrl, prompt, apiTemperature);
      if (result.error) {
        lastError = result.error;
        if (result.isRateLimit) continue;
        continue;
      }

      tokensInput = result.tokensInput;
      tokensOutput = result.tokensOutput;

      const parsed = parseEstimateJson(result.content);
      if (parsed.error) {
        lastError = parsed.error;
        continue;
      }

      estimateData = parsed.data;
      usedModel = currentModel;
      usedModelName = currentModel.display_name;
      break;
    }

    if (!estimateData) {
      const durationMs = Date.now() - startTime;
      await logUsage(supabase, {
        userId: user.id, projectId,
        provider: usedModel?.provider || "openrouter",
        modelUsed: usedModelName, modelId: usedModel?.id || null,
        endpoint: "generate-estimate",
        tokensInput: 0, tokensOutput: 0, cost: 0, durationMs,
        status: "error", errorMessage: lastError || "All models failed",
      });
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    const validated = validateAndRecalculate(estimateData, scenarioType, coefficient);

    const { data: estimate, error: insertError } = await supabase
      .from("estimates")
      .insert({
        user_id: user.id,
        project_id: projectId,
        scenario_type: scenarioType,
        total_amount: validated.totalTTC,
        line_items: validated.lineItems,
        categories: validated.categories,
        estimate_number: estimateData.estimate_number || `DEVIS-${Date.now()}`,
        client_name: estimateData.client_name || "Client",
        estimate_date: new Date().toISOString(),
        validity_days: estimateData.validity_days || 30,
        payment_terms: estimateData.payment_terms || "30% a la commande, 70% a la livraison",
        execution_delay: estimateData.execution_delay || "A definir",
        deposit_required: estimateData.deposit_required || 30,
        special_conditions: estimateData.special_conditions || null,
        total_ht: validated.totalHT,
        total_tva: validated.totalTVA,
        total_ttc: validated.totalTTC,
        discount_amount: estimateData.discount_amount || 0,
        discount_percent: estimateData.discount_percent || 0,
        model_used: usedModel.display_name,
        scenario_justification: estimateData.scenario_justification || null,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to save estimate: ${insertError.message}`);

    const durationMs = Date.now() - startTime;
    const cost = Number(
      (tokensInput / 1000) * (usedModel.cost_per_1k_tokens_input || 0) +
      (tokensOutput / 1000) * (usedModel.cost_per_1k_tokens_output || 0)
    );

    await logUsage(supabase, {
      userId: user.id, projectId,
      provider: usedModel.provider || "openrouter",
      modelUsed: usedModel.display_name, modelId: usedModel.id,
      endpoint: "generate-estimate",
      tokensInput, tokensOutput,
      cost: Math.round(cost * 1000000) / 1000000,
      durationMs, status: "success", errorMessage: null,
    });

    console.log(`[generate-estimate] Done. Tokens: ${tokensInput}→${tokensOutput}, cost: $${cost.toFixed(6)}, duration: ${durationMs}ms`);

    const usedFallback = usedModel.id !== model.id;
    return new Response(
      JSON.stringify({
        success: true,
        estimate,
        ...(usedFallback && {
          warning: `Modele de remplacement: ${usedModel.display_name} (prefere: ${model.display_name})`,
        }),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[generate-estimate] Error:", errorMessage);

    if (supabase && userId) {
      const durationMs = Date.now() - startTime;
      await logUsage(supabase, {
        userId, projectId,
        provider: "openrouter", modelUsed: usedModelName, modelId: null,
        endpoint: "generate-estimate",
        tokensInput: 0, tokensOutput: 0, cost: 0, durationMs,
        status: "error", errorMessage,
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function enforceMonthlyLimit(supabase: any, userId: string) {
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("tier_id, subscription_tiers(name, max_projects_per_month, fair_use_limit)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const tierName: string = sub?.subscription_tiers?.name ?? "starter";
  const maxPerMonth: number = sub?.subscription_tiers?.max_projects_per_month ?? 10;
  const fairUse: number = sub?.subscription_tiers?.fair_use_limit ?? 50;

  if (maxPerMonth >= 999999) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from("estimates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart);

    const used = count ?? 0;
    if (used >= fairUse) {
      console.warn(`[generate-estimate] Fair-use cap reached for plan ${tierName}: ${used}/${fairUse}`);
      throw new Error(
        `Limite d'utilisation équitable atteinte (${used}/${fairUse} devis ce mois). Contactez-nous pour un plan Entreprise sur mesure.`
      );
    }
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("estimates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart);

  const used = count ?? 0;
  console.log(`[generate-estimate] Monthly usage: ${used}/${maxPerMonth} (plan: ${tierName})`);

  if (used >= maxPerMonth) {
    throw new Error(
      `Limite mensuelle atteinte (${used}/${maxPerMonth} devis). Passez au plan supérieur pour continuer.`
    );
  }
}

async function selectModel(supabase: any, userId: string, adminTier?: string): Promise<{ model: any; resolvedTier: string }> {
  const tierMap: Record<string, string> = {
    unlimited: "pro", pro: "pro", business: "business", starter: "starter",
  };

  if (adminTier) {
    const { data: adminData } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminData) {
      const tierName = tierMap[adminTier] ?? "starter";
      const targetModelId = resolveTierModel(tierName);

      const { data: model } = await supabase
        .from("ai_models")
        .select("*")
        .eq("model_id", targetModelId)
        .eq("is_active", true)
        .maybeSingle();

      if (model) {
        return { model, resolvedTier: `admin-override:${tierName}` };
      }
    }
  }

  const { data: rpcResult } = await supabase.rpc("get_user_ai_model", { p_user_id: userId });
  if (rpcResult && rpcResult.length > 0) {
    const { data: model } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", rpcResult[0].model_id)
      .maybeSingle();

    if (model) {
      return { model, resolvedTier: "subscription" };
    }
  }

  const { data: starterTier } = await supabase
    .from("subscription_tiers")
    .select("ai_model_id, name")
    .eq("name", "starter")
    .eq("is_active", true)
    .maybeSingle();

  if (starterTier?.ai_model_id) {
    const { data: model } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", starterTier.ai_model_id)
      .maybeSingle();

    if (model) return { model, resolvedTier: "fallback:starter-tier" };
  }

  const { data: cheapestModel } = await supabase
    .from("ai_models")
    .select("*")
    .eq("is_active", true)
    .order("cost_per_1k_tokens_input", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!cheapestModel) throw new Error("No active AI models configured");
  return { model: cheapestModel, resolvedTier: "fallback:cheapest" };
}

async function getFallbackModels(supabase: any, excludeId: string) {
  const { data } = await supabase
    .from("ai_models")
    .select("*")
    .eq("is_active", true)
    .lte("cost_per_1k_tokens_input", 0.001)
    .neq("id", excludeId)
    .order("cost_per_1k_tokens_input", { ascending: true })
    .limit(5);
  return data || [];
}

async function callOpenRouter(
  model: any,
  apiKey: string,
  supabaseUrl: string,
  prompt: string,
  temperature: number
): Promise<{ content: string; tokensInput: number; tokensOutput: number; error?: string; isRateLimit?: boolean }> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": supabaseUrl,
        "X-Title": "Aide Devis IA",
      },
      body: JSON.stringify({
        model: model.model_id,
        messages: [
          {
            role: "system",
            content: "Tu es un economiste du batiment et maitre d'oeuvre experimente (15+ ans). Tu generes des devis BTP professionnels, detailles, realistes et credibles (+/-10% d'un vrai chantier), en JSON valide uniquement. Tu structures TOUJOURS en 5 categories: Gros oeuvre, Second oeuvre, Finitions, Amenagements exterieurs, Frais annexes.",
          },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        content: "", tokensInput: 0, tokensOutput: 0,
        error: `HTTP ${response.status}: ${text}`,
        isRateLimit: response.status === 429,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || {};
    return {
      content,
      tokensInput: usage.prompt_tokens || usage.input_tokens || 0,
      tokensOutput: usage.completion_tokens || usage.output_tokens || 0,
    };
  } catch (e: any) {
    return { content: "", tokensInput: 0, tokensOutput: 0, error: e.message };
  }
}

function parseEstimateJson(content: string): { data?: any; error?: string } {
  if (!content || (!content.includes("{") && !content.includes("}"))) {
    return { error: "Model returned no JSON" };
  }
  try {
    const jsonBlock = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlock) return { data: JSON.parse(jsonBlock[1]) };
    const jsonRaw = content.match(/\{[\s\S]*\}/);
    if (!jsonRaw) return { error: "No JSON pattern found" };
    return { data: JSON.parse(jsonRaw[0]) };
  } catch (e: any) {
    return { error: `JSON parse error: ${e.message}` };
  }
}

function validateAndRecalculate(estimateData: any, scenarioType: string, coefficient: number) {
  const rawCategories = estimateData.categories?.length
    ? estimateData.categories
    : [{ name: "Travaux", description: "", items: [{ poste: "Travaux globaux", quantity: 1, unit: "forfait", unit_price_ht: 10000, tva_percent: 20 }] }];

  let totalHT = 0, totalTVA = 0, totalTTC = 0;

  const categories = rawCategories
    .map((cat: any) => {
      const items = (cat.items || [])
        .filter((i: any) => i && (i.poste || i.description))
        .map((item: any) => {
          const qty = Math.max(0, Number(item.quantity) || 1);
          const unitPriceHT = Math.round(Math.max(0, Number(item.unit_price_ht) || 0) * coefficient * 100) / 100;
          const tvaPercent = validateTvaRate(Number(item.tva_percent) || 20);
          const amountHT = Math.round(qty * unitPriceHT * 100) / 100;
          const tvaAmount = Math.round(amountHT * (tvaPercent / 100) * 100) / 100;
          const amountTTC = Math.round((amountHT + tvaAmount) * 100) / 100;
          return {
            poste: item.poste || item.description || "Poste",
            description: item.description || item.poste || "",
            quantity: qty,
            unit: item.unit || "u",
            unit_price_ht: unitPriceHT,
            amount_ht: amountHT,
            tva_percent: tvaPercent,
            tva_amount: tvaAmount,
            amount_ttc: amountTTC,
            materials_cost: Math.max(0, Number(item.materials_cost) || 0),
            labor_cost: Math.max(0, Number(item.labor_cost) || 0),
          };
        });

      if (!items.length) return null;

      const subHT = items.reduce((s: number, i: any) => s + i.amount_ht, 0);
      const subTVA = items.reduce((s: number, i: any) => s + i.tva_amount, 0);
      const subTTC = items.reduce((s: number, i: any) => s + i.amount_ttc, 0);

      totalHT += subHT;
      totalTVA += subTVA;
      totalTTC += subTTC;

      return {
        name: cat.name || "Categorie",
        description: cat.description || "",
        items,
        subtotal_ht: Math.round(subHT * 100) / 100,
        subtotal_tva: Math.round(subTVA * 100) / 100,
        subtotal_ttc: Math.round(subTTC * 100) / 100,
      };
    })
    .filter(Boolean);

  const lineItems = categories.flatMap((cat: any) =>
    cat.items.map((item: any) => ({
      ...item,
      category: cat.name,
      category_description: cat.description,
    }))
  );

  return {
    categories,
    lineItems,
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
  };
}

function buildPrompt(projectDescription: string, scenarioType: string, coefficient: number, templateContext: string): string {
  return `Tu es un economiste du batiment experimente. Genere un devis BTP professionnel et realiste pour ce projet.

**PROJET:**
${projectDescription}
${templateContext}
**SCENARIO:** ${scenarioType.toUpperCase()}
${scenarioType === "eco" ? "- Coef 0.85: Materiaux standards, finitions base" : ""}${scenarioType === "standard" ? "- Coef 1.00: Materiaux qualite moyenne, finitions soignees" : ""}${scenarioType === "premium" ? "- Coef 1.25: Materiaux premium, finitions luxueuses" : ""}

**RATIOS 2024-2025:**
Construction: 1800-2600EUR/m2 | Ossature bois: 1500-2300EUR/m2 | Surelevation: 2200-2800EUR/m2
Terrasse couverte: 600-1200EUR/m2 | Clim bi-split: 3000-5000EUR

**COEFFICIENTS REGIONAUX:**
Paris: +25-30% | IDF: +15-20% | Metropoles: +10-15% | Montpellier/Herault: +10-15% | Rural: 0 a -5%

**STRUCTURE OBLIGATOIRE (5 categories):**

1. GROS OEUVRE (40-50%): Fondations 100-150EUR/m2, Dalle 65-100EUR/m2, Murs 180-280EUR/m2, Charpente 50-80EUR/m2
2. SECOND OEUVRE (30-35%): Isolation 25-140EUR/m2, Menuiseries PVC 350-600EUR/m2, Electricite 80-120EUR/m2, Plomberie
3. FINITIONS (15-20%): Carrelage 50-80EUR/m2, Peinture 20-35EUR/m2, SDB 3k-9kEUR, Cuisine 3k-12kEUR
4. AMENAGEMENTS EXT: Terrasse, VRD 800-5kEUR, Clotures
5. FRAIS ANNEXES (5-15%): Etude sol 1.5-2.5kEUR, Thermique 800-1500EUR, Permis 500-3kEUR, DO 2-4%, Imprevus 5-10%

**TVA:** 10% reno/extension >2ans, 20% neuf

**IMPORTANT: Genere un devis pour le scenario STANDARD (coef 1.00). Le coefficient ${scenarioType} (${coefficient}) sera applique automatiquement cote serveur.**

Reponds UNIQUEMENT en JSON valide:
{
  "estimate_number": "DEVIS-2024-001",
  "client_name": "Client",
  "validity_days": 30,
  "payment_terms": "30% a la commande, 70% a la livraison",
  "execution_delay": "4 semaines",
  "deposit_required": 30,
  "categories": [
    {
      "name": "Nom du lot BTP",
      "description": "Description du lot",
      "items": [
        {
          "poste": "Nom du poste",
          "description": "Details techniques",
          "quantity": 100,
          "unit": "m2",
          "unit_price_ht": 50.00,
          "tva_percent": 20
        }
      ]
    }
  ],
  "scenario_justification": "Explication en 2-3 phrases"
}

REGLES: 5 categories obligatoires | TVA 10% (reno >2ans) ou 20% (neuf) | scenario_justification obligatoire | frais annexes inclus (5-15%).
REPONDS UNIQUEMENT EN JSON VALIDE.`;
}

interface UsageLogParams {
  userId: string;
  projectId: string | null;
  provider: string;
  modelUsed: string;
  modelId: string | null;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  durationMs: number;
  status: string;
  errorMessage: string | null;
}

async function logUsage(supabase: any, params: UsageLogParams) {
  try {
    await supabase.from("api_usage_logs").insert({
      user_id: params.userId,
      project_id: params.projectId,
      provider: params.provider,
      model_used: params.modelUsed,
      model_id: params.modelId,
      endpoint: params.endpoint,
      tokens_input: params.tokensInput,
      tokens_output: params.tokensOutput,
      cost: params.cost,
      duration_ms: params.durationMs,
      status: params.status,
      error_message: params.errorMessage,
    });
  } catch (e) {
    console.error("[generate-estimate] Failed to log usage:", e);
  }
}
