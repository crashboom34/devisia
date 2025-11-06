import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EstimateRequest {
  projectId: string;
  scenarioType: "eco" | "standard" | "premium";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { projectId, scenarioType }: EstimateRequest = await req.json();

    if (!projectId || !scenarioType) {
      throw new Error("Missing required fields");
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      throw new Error("Project not found or access denied");
    }

    const { data: modelConfig } = await supabase
      .from("user_preferences")
      .select("preferred_model_id, ai_models(provider, model_id)")
      .eq("user_id", user.id)
      .maybeSingle();

    let provider = "openrouter";
    let modelId = "meta-llama/llama-3.2-3b-instruct:free";

    if (modelConfig?.preferred_model_id && modelConfig.ai_models) {
      provider = (modelConfig.ai_models as any).provider;
      modelId = (modelConfig.ai_models as any).model_id;
    }

    const { data: systemConfig } = await supabase
      .from("system_config")
      .select("key, value")
      .in("key", [`${provider}_api_key`, "default_model"])
      .limit(10);

    const apiKey = systemConfig?.find((c) => c.key === `${provider}_api_key`)?.value;

    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const scenarioMultipliers = {
      eco: { base: 0.7, quality: "économique", tva: 20 },
      standard: { base: 1.0, quality: "standard", tva: 20 },
      premium: { base: 1.5, quality: "premium", tva: 20 },
    };

    const scenario = scenarioMultipliers[scenarioType];

    const prompt = `Tu es un métreur expert en devis de construction BTP. Génère un devis détaillé et professionnel pour ce projet:

Titre: ${project.title}
Description: ${project.description}
Niveau de qualité: ${scenario.quality}

INSTRUCTIONS CRITIQUES:
1. Analyse la description et identifie AUTOMATIQUEMENT tous les postes de travaux nécessaires
2. Si la description est générale (ex: "rénovation appartement 60m²"), décompose en postes standards du BTP
3. Pour CHAQUE poste, fournis des quantités réalistes basées sur la surface/contexte mentionné
4. Utilise des prix unitaires réalistes du marché français 2025
5. Tous les montants doivent être en HT, avec TVA à ${scenario.tva}%

POSTES À INCLURE (selon le type de projet):
- Préparation/Démolition: démolition cloisons, évacuation gravats
- Gros Œuvre: maçonnerie, charpente, toiture si extension/construction
- Second Œuvre: cloisons, isolation, menuiseries, fenêtres
- Électricité: mise aux normes, tableau, prises, éclairage, interrupteurs
- Plomberie: réseaux eau/évacuation, radiateurs si chauffage mentionné
- Cuisine: si mentionnée, inclure mobilier + électroménager + pose
- Salle de bain: si mentionnée, inclure faïence, sanitaires, robinetterie
- Revêtements sols: parquet, carrelage selon surfaces
- Revêtements murs: peinture, papier peint
- Finitions: plinthes, joints, nettoyage

Génère un devis JSON avec cette structure EXACTE:
{
  "estimate_number": "DEVIS-2025-001",
  "client_name": "Client",
  "validity_days": 30,
  "payment_terms": "30% à la commande, 40% en cours de chantier, 30% à la réception",
  "execution_delay": "6 à 8 semaines",
  "deposit_required": 30,
  "categories": [
    {
      "name": "Préparation et Démolition",
      "description": "Travaux préparatoires et démolitions",
      "items": [
        {
          "poste": "Nom du poste",
          "description": "Description détaillée du travail",
          "quantity": 60,
          "unit": "m²",
          "unit_price_ht": 25.00,
          "amount_ht": 1500.00,
          "tva_percent": 20,
          "tva_amount": 300.00,
          "amount_ttc": 1800.00,
          "materials_cost": 800.00,
          "labor_cost": 700.00
        }
      ],
      "subtotal_ht": 1500.00,
      "subtotal_tva": 300.00,
      "subtotal_ttc": 1800.00
    }
  ],
  "total_ht": 45000.00,
  "total_tva": 9000.00,
  "total_ttc": 54000.00,
  "discount_percent": 0,
  "discount_amount": 0
}

RÈGLES DE CALCUL (vérifie bien):
- amount_ht = quantity × unit_price_ht (arrondi à 2 décimales)
- tva_amount = amount_ht × (tva_percent / 100)
- amount_ttc = amount_ht + tva_amount
- subtotal_ht = somme des amount_ht du lot
- subtotal_tva = somme des tva_amount du lot
- subtotal_ttc = somme des amount_ttc du lot
- total_ht = somme de tous les subtotal_ht
- total_tva = somme de tous les subtotal_tva
- total_ttc = somme de tous les subtotal_ttc

IMPORTANT:
- Sois TRÈS détaillé et exhaustif dans les postes
- Si information manquante, garde le poste et mets "À valider selon visite" dans la description
- Utilise des unités appropriées: m², ml, u (unité), pièce, forfait, ensemble
- Les quantités doivent être cohérentes avec la surface totale
- Prix réalistes pour ${scenario.quality}

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

    const llmApiUrl = provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    const llmHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
      llmHeaders["HTTP-Referer"] = supabaseUrl;
      llmHeaders["X-Title"] = "Aide Devis IA";
    }

    const llmRequestBody = {
      model: modelId,
      messages: [
        {
          role: "system",
          content: "Tu es un métreur expert en BTP. Tu génères des devis détaillés et précis avec des calculs HT/TTC exacts. Tu réponds UNIQUEMENT en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    };

    const startTime = Date.now();
    const llmResponse = await fetch(llmApiUrl, {
      method: "POST",
      headers: llmHeaders,
      body: JSON.stringify(llmRequestBody),
    });

    const duration = Date.now() - startTime;

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM API error: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const content = llmData.choices[0].message.content;

    let estimateData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      estimateData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
    }

    const lineItems = estimateData.categories?.flatMap((cat: any) =>
      cat.items.map((item: any) => ({
        ...item,
        category: cat.name,
        category_description: cat.description,
      }))
    ) || [];

    const { data: estimate, error: insertError } = await supabase
      .from("estimates")
      .insert({
        project_id: projectId,
        scenario_type: scenarioType,
        total_amount: estimateData.total_ttc || estimateData.total_amount,
        line_items: lineItems,
        categories: estimateData.categories,
        estimate_number: estimateData.estimate_number,
        client_name: estimateData.client_name,
        estimate_date: new Date().toISOString(),
        validity_days: estimateData.validity_days || 30,
        payment_terms: estimateData.payment_terms,
        execution_delay: estimateData.execution_delay,
        deposit_required: estimateData.deposit_required || 0,
        special_conditions: estimateData.special_conditions,
        total_ht: estimateData.total_ht,
        total_tva: estimateData.total_tva,
        total_ttc: estimateData.total_ttc,
        discount_amount: estimateData.discount_amount || 0,
        discount_percent: estimateData.discount_percent || 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save estimate: ${insertError.message}`);
    }

    const tokensInput = llmData.usage?.prompt_tokens || 0;
    const tokensOutput = llmData.usage?.completion_tokens || 0;

    const { data: modelInfo } = await supabase
      .from("ai_models")
      .select("id, cost_per_1k_tokens_input, cost_per_1k_tokens_output")
      .eq("provider", provider)
      .eq("model_id", modelId)
      .maybeSingle();

    const cost = modelInfo
      ? (tokensInput / 1000) * Number(modelInfo.cost_per_1k_tokens_input) +
        (tokensOutput / 1000) * Number(modelInfo.cost_per_1k_tokens_output)
      : 0;

    await supabase.from("api_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      model_id: modelInfo?.id,
      provider,
      endpoint: "generate-estimate",
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      cost,
      duration_ms: duration,
      status: "success",
      request_metadata: { scenario_type: scenarioType },
    });

    await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({
        estimate,
        usage: {
          prompt_tokens: tokensInput,
          completion_tokens: tokensOutput,
          total_tokens: tokensInput + tokensOutput,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-estimate:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
