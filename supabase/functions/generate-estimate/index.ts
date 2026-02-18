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

function validateTvaRate(rate: number): number {
  const closest = ALLOWED_TVA_RATES.reduce((prev, curr) =>
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  );
  return closest;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

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

    const apiTemperature = temperature !== undefined ? temperature : 0.5;
    const coefficient = PRICING_COEFFICIENTS[scenarioType];

    let templateData = null;
    if (templateId && templateId !== 'none') {
      const { data: template } = await supabase
        .from("estimate_templates")
        .select("*")
        .eq("template_id", templateId)
        .eq("is_active", true)
        .maybeSingle();

      if (template) {
        templateData = template;
      }
    }

    const getFallbackModels = async () => {
      const { data: fallbackModels } = await supabase
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .lte("cost_per_1k_tokens_input", 0.001)
        .order("cost_per_1k_tokens_input", { ascending: true })
        .limit(5);
      return fallbackModels || [];
    };

    let selectedModelId = null;

    const tierMap: Record<string, string> = { 'unlimited': 'pro', 'pro': 'pro', 'business': 'business', 'starter': 'starter' };
    const resolvedTierName = adminTier ? tierMap[adminTier] : null;

    if (resolvedTierName) {
      const { data: adminData } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminData) {
        const { data: tier } = await supabase
          .from("subscription_tiers")
          .select("ai_model_id")
          .eq("name", resolvedTierName)
          .eq("is_active", true)
          .maybeSingle();

        if (tier?.ai_model_id) {
          selectedModelId = tier.ai_model_id;
        }
      }
    }

    if (!selectedModelId) {
      const { data: modelData, error: modelLookupError } = await supabase.rpc(
        'get_user_ai_model',
        { p_user_id: user.id }
      );

      if (!modelLookupError && modelData && modelData.length > 0) {
        selectedModelId = modelData[0].model_id;
      }
    }

    if (!selectedModelId) {
      const { data: starterTier } = await supabase
        .from("subscription_tiers")
        .select("ai_model_id")
        .eq("name", "starter")
        .eq("is_active", true)
        .maybeSingle();

      if (starterTier?.ai_model_id) {
        selectedModelId = starterTier.ai_model_id;
      } else {
        const { data: fallbackModel } = await supabase
          .from("ai_models")
          .select("id")
          .eq("is_active", true)
          .order("cost_per_1k_tokens_input", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fallbackModel) {
          selectedModelId = fallbackModel.id;
        } else {
          throw new Error("No AI model available");
        }
      }
    }

    const { data: model, error: modelError } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", selectedModelId)
      .maybeSingle();

    if (modelError || !model) {
      throw new Error(`Invalid model selected: ${modelError?.message || 'Model not found'}`);
    }

    const { data: configData } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "openrouter_api_key")
      .maybeSingle();

    let openrouterApiKey: string | undefined;
    if (configData?.value) {
      const raw = configData.value;
      openrouterApiKey = typeof raw === "string" ? raw : (raw as any)?.toString();
    }
    if (!openrouterApiKey) {
      openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    }

    if (!openrouterApiKey) {
      throw new Error("Cle API OpenRouter non configuree. Allez dans Admin > Configuration pour ajouter votre cle API OpenRouter.");
    }

    let modelsToTry = [model];
    const fallbackModels = await getFallbackModels();
    for (const fallback of fallbackModels) {
      if (fallback.id !== model.id) {
        modelsToTry.push(fallback);
      }
    }

    let templateContext = '';
    if (templateData) {
      templateContext = `\n**TEMPLATE DE REFERENCE: ${templateData.name}**
**Categorie:** ${templateData.category}

**LOTS ET POSTES RECOMMANDES:**
${JSON.stringify(templateData.lots, null, 2)}

UTILISE CE TEMPLATE comme structure de base. Adapte les lots et postes a la description du projet, mais garde la logique et l'organisation du template.
Pour le scenario ${scenarioType.toUpperCase()}, utilise les specifications de "gamme_${scenarioType}" de chaque poste.

`;
    }

    const prompt = `Tu es un economiste du batiment experimente. Genere un devis BTP professionnel et realiste pour ce projet.

**PROJET:**
${projectDescription}
${templateContext}
**SCENARIO:** ${scenarioType.toUpperCase()}
${scenarioType === 'eco' ? '- Coef 0.85: Materiaux standards, finitions base' : ''}${scenarioType === 'standard' ? '- Coef 1.00: Materiaux qualite moyenne, finitions soignees' : ''}${scenarioType === 'premium' ? '- Coef 1.25: Materiaux premium, finitions luxueuses' : ''}

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

**REPONDS UNIQUEMENT EN JSON (pas de texte avant/apres):**

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

**REGLES:**
1. 5 categories obligatoires (Gros oeuvre, Second oeuvre, Finitions, Amenagements ext, Frais annexes)
2. Quantite, unite, prix unitaire HT pour chaque poste
3. TVA 10% (reno >2ans) ou 20% (neuf)
4. Applique coefficient regional si localisation mentionnee
5. OBLIGATOIRE "scenario_justification" (2-3 phrases)
6. Realisme +/-10% marche reel, base-toi sur ratios fournis
7. Frais annexes toujours inclus (5-15%)

REPONDS UNIQUEMENT EN JSON VALIDE (sans texte avant ou apres).`;

    let llmData: any = null;
    let content: string = '';
    let responseTime = 0;
    let usedModel = model;
    let lastError: string | null = null;
    let estimateData: any = null;
    let tokensInput = 0;
    let tokensOutput = 0;

    for (const currentModel of modelsToTry) {
      try {
        const llmApiUrl = currentModel.api_endpoint || "https://openrouter.ai/api/v1/chat/completions";

        let llmApiKey = currentModel.api_key;
        if (!llmApiKey && currentModel.provider === "openrouter") {
          llmApiKey = openrouterApiKey;
        }
        if (!llmApiKey) {
          llmApiKey = Deno.env.get("OPENROUTER_API_KEY");
        }

        if (!llmApiKey) {
          lastError = `No API key available for ${currentModel.display_name}`;
          continue;
        }

        const llmHeaders: Record<string, string> = {
          "Authorization": `Bearer ${llmApiKey}`,
          "Content-Type": "application/json",
        };

        if (currentModel.provider === "openrouter") {
          llmHeaders["HTTP-Referer"] = Deno.env.get("SUPABASE_URL")!;
          llmHeaders["X-Title"] = "Aide Devis IA";
        }

        const llmRequestBody = {
          model: currentModel.model_id,
          messages: [
            {
              role: "system",
              content: "Tu es un economiste du batiment et maitre d'oeuvre experimente (15+ ans). Tu generes des devis BTP professionnels, detailles, realistes et credibles (+/-10% d'un vrai chantier), en JSON valide uniquement. Tu structures TOUJOURS en 5 categories: Gros oeuvre, Second oeuvre, Finitions, Amenagements exterieurs, Frais annexes.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: apiTemperature,
          max_tokens: 6000,
        };

        const callStart = Date.now();
        const llmResponse = await fetch(llmApiUrl, {
          method: "POST",
          headers: llmHeaders,
          body: JSON.stringify(llmRequestBody),
        });
        responseTime = Date.now() - callStart;

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          lastError = `HTTP ${llmResponse.status}: ${errorText}`;

          if (llmResponse.status === 429) {
            continue;
          }
          continue;
        }

        llmData = await llmResponse.json();
        content = llmData.choices?.[0]?.message?.content || '';

        const usage = llmData.usage || {};
        tokensInput = usage.prompt_tokens || usage.input_tokens || 0;
        tokensOutput = usage.completion_tokens || usage.output_tokens || 0;

        if (!content || (!content.includes('{') && !content.includes('}'))) {
          lastError = "Model returned text without JSON";
          continue;
        }

        try {
          let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            estimateData = JSON.parse(jsonMatch[1]);
          } else {
            jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              lastError = "No JSON pattern found in response";
              continue;
            }
            estimateData = JSON.parse(jsonMatch[0]);
          }

          usedModel = currentModel;
          usedModelName = currentModel.display_name;
          break;

        } catch (parseError: any) {
          lastError = `JSON parse error: ${parseError.message}`;
          continue;
        }

      } catch (error: any) {
        lastError = error instanceof Error ? error.message : String(error);
        continue;
      }
    }

    if (!estimateData) {
      const durationMs = Date.now() - startTime;
      await logUsage(supabase, {
        userId: user.id,
        projectId,
        provider: usedModel?.provider || "openrouter",
        modelUsed: usedModelName,
        modelId: usedModel?.id || null,
        endpoint: "generate-estimate",
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
        durationMs,
        status: "error",
        errorMessage: lastError || "All models failed",
      });
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    if (!estimateData.categories || estimateData.categories.length === 0) {
      estimateData.categories = [{
        name: "Travaux",
        description: `Travaux ${scenarioType}`,
        items: [{
          poste: "Travaux globaux",
          description: `Estimation globale ${scenarioType}`,
          quantity: 1,
          unit: "forfait",
          unit_price_ht: 10000,
          tva_percent: 20
        }]
      }];
    }

    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    const validatedCategories = estimateData.categories
      .map((cat: any) => {
        const validItems = (cat.items || [])
          .filter((item: any) => item && (item.poste || item.description))
          .map((item: any) => {
            const quantity = Math.max(0, Number(item.quantity) || 1);
            const baseUnitPrice = Math.max(0, Number(item.unit_price_ht) || 0);
            const unitPriceHT = Math.round(baseUnitPrice * coefficient * 100) / 100;
            const tvaPercent = validateTvaRate(Number(item.tva_percent) || 20);

            const amountHT = Math.round(quantity * unitPriceHT * 100) / 100;
            const tvaAmount = Math.round(amountHT * (tvaPercent / 100) * 100) / 100;
            const amountTTC = Math.round((amountHT + tvaAmount) * 100) / 100;

            return {
              poste: item.poste || item.description || "Poste",
              description: item.description || item.poste || "",
              quantity,
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

        if (validItems.length === 0) return null;

        const subtotalHT = validItems.reduce((sum: number, item: any) => sum + item.amount_ht, 0);
        const subtotalTVA = validItems.reduce((sum: number, item: any) => sum + item.tva_amount, 0);
        const subtotalTTC = validItems.reduce((sum: number, item: any) => sum + item.amount_ttc, 0);

        totalHT += subtotalHT;
        totalTVA += subtotalTVA;
        totalTTC += subtotalTTC;

        return {
          name: cat.name || "Categorie",
          description: cat.description || "",
          items: validItems,
          subtotal_ht: Math.round(subtotalHT * 100) / 100,
          subtotal_tva: Math.round(subtotalTVA * 100) / 100,
          subtotal_ttc: Math.round(subtotalTTC * 100) / 100,
        };
      })
      .filter((cat: any) => cat !== null);

    if (validatedCategories.length === 0) {
      const defaultHT = 10000 * coefficient;
      const defaultTVA = Math.round(defaultHT * 0.2 * 100) / 100;
      const defaultTTC = defaultHT + defaultTVA;

      validatedCategories.push({
        name: "Travaux",
        description: `Estimation globale ${scenarioType}`,
        items: [{
          poste: "Travaux globaux",
          description: `Estimation forfaitaire ${scenarioType}`,
          quantity: 1,
          unit: "forfait",
          unit_price_ht: defaultHT,
          amount_ht: defaultHT,
          tva_percent: 20,
          tva_amount: defaultTVA,
          amount_ttc: defaultTTC,
          materials_cost: 0,
          labor_cost: 0,
        }],
        subtotal_ht: defaultHT,
        subtotal_tva: defaultTVA,
        subtotal_ttc: defaultTTC,
      });

      totalHT = defaultHT;
      totalTVA = defaultTVA;
      totalTTC = defaultTTC;
    }

    totalHT = Math.round(totalHT * 100) / 100;
    totalTVA = Math.round(totalTVA * 100) / 100;
    totalTTC = Math.round(totalTTC * 100) / 100;

    const lineItems = validatedCategories.flatMap((cat: any) =>
      cat.items.map((item: any) => ({
        ...item,
        category: cat.name,
        category_description: cat.description,
      }))
    );

    const { data: estimate, error: insertError } = await supabase
      .from("estimates")
      .insert({
        user_id: user.id,
        project_id: projectId,
        scenario_type: scenarioType,
        total_amount: totalTTC,
        line_items: lineItems,
        categories: validatedCategories,
        estimate_number: estimateData.estimate_number || `DEVIS-${Date.now()}`,
        client_name: estimateData.client_name || "Client",
        estimate_date: new Date().toISOString(),
        validity_days: estimateData.validity_days || 30,
        payment_terms: estimateData.payment_terms || "30% a la commande, 70% a la livraison",
        execution_delay: estimateData.execution_delay || "A definir",
        deposit_required: estimateData.deposit_required || 30,
        special_conditions: estimateData.special_conditions,
        total_ht: totalHT,
        total_tva: totalTVA,
        total_ttc: totalTTC,
        discount_amount: estimateData.discount_amount || 0,
        discount_percent: estimateData.discount_percent || 0,
        model_used: usedModel.display_name,
        scenario_justification: estimateData.scenario_justification || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save estimate: ${insertError.message}`);
    }

    const durationMs = Date.now() - startTime;
    const cost = (
      (tokensInput / 1000) * (usedModel.cost_per_1k_tokens_input || 0) +
      (tokensOutput / 1000) * (usedModel.cost_per_1k_tokens_output || 0)
    );

    await logUsage(supabase, {
      userId: user.id,
      projectId,
      provider: usedModel.provider || "openrouter",
      modelUsed: usedModel.display_name,
      modelId: usedModel.id,
      endpoint: "generate-estimate",
      tokensInput,
      tokensOutput,
      cost: Math.round(cost * 1000000) / 1000000,
      durationMs,
      status: "success",
      errorMessage: null,
    });

    const usedFallback = usedModel.id !== model.id;
    return new Response(
      JSON.stringify({
        success: true,
        estimate,
        ...(usedFallback && {
          warning: `Le modele ${model.display_name} n'a pas pu etre utilise. Modele de remplacement: ${usedModel.display_name}`,
        }),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating estimate:", errorMessage);

    if (supabase && userId) {
      const durationMs = Date.now() - startTime;
      await logUsage(supabase, {
        userId,
        projectId,
        provider: "openrouter",
        modelUsed: usedModelName,
        modelId: null,
        endpoint: "generate-estimate",
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
        durationMs,
        status: "error",
        errorMessage,
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

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
    console.error("Failed to log usage:", e);
  }
}
