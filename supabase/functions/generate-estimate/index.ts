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

    const scenarioDescriptions = {
      eco: "économique avec des matériaux standards et des finitions simples",
      standard: "standard avec des matériaux de qualité moyenne et des finitions correctes",
      premium: "premium avec des matériaux haut de gamme et des finitions luxueuses",
    };

    const prompt = `Tu es un expert en devis de construction. Génère un devis détaillé pour le projet suivant:

Titre: ${project.title}
Description: ${project.description}
Type de devis: ${scenarioDescriptions[scenarioType]}

Génère un devis JSON avec cette structure exacte:
{
  "total_amount": nombre_total,
  "line_items": [
    {
      "description": "Description du poste",
      "quantity": nombre,
      "unit": "unité (m², pièce, ml, etc.)",
      "unit_price": prix_unitaire,
      "total": total_ligne
    }
  ]
}

Inclus tous les postes pertinents: démolition, gros œuvre, second œuvre, finitions, etc.
Les prix doivent être réalistes pour le marché français en 2025.
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
          content: "Tu es un expert en devis de construction. Tu réponds toujours en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
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

    const { data: estimate, error: insertError } = await supabase
      .from("estimates")
      .insert({
        project_id: projectId,
        scenario_type: scenarioType,
        total_amount: estimateData.total_amount,
        line_items: estimateData.line_items,
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