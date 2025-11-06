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
  modelId?: string;
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

    const { projectId, projectDescription, scenarioType, modelId }: EstimateRequest = await req.json();

    if (!projectId || !projectDescription || !scenarioType) {
      throw new Error("Missing required fields");
    }

    let selectedModelId = modelId;
    if (!selectedModelId) {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("default_model_id")
        .eq("user_id", user.id)
        .single();

      if (preferences?.default_model_id) {
        selectedModelId = preferences.default_model_id;
      } else {
        const { data: defaultModel } = await supabase
          .from("ai_models")
          .select("id")
          .eq("is_default", true)
          .eq("is_active", true)
          .single();

        if (defaultModel) {
          selectedModelId = defaultModel.id;
        } else {
          throw new Error("No AI model available");
        }
      }
    }

    const { data: model, error: modelError } = await supabase
      .from("ai_models")
      .select("*")
      .eq("id", selectedModelId)
      .single();

    if (modelError || !model) {
      throw new Error("Invalid model selected");
    }

    const priceMultipliers = {
      eco: 0.7,
      standard: 1.0,
      premium: 1.5,
    };

    const multiplier = priceMultipliers[scenarioType];

    const prompt = `En tant qu'expert métreur BTP, génère un devis détaillé pour le projet suivant.

Description du projet:
${projectDescription}

Type de devis: ${scenarioType.toUpperCase()}
Multiplicateur de prix: ${multiplier}x

Génère un devis professionnel structuré avec:

1. CATÉGORIES par lots BTP (Préparation, Gros Œuvre, Second Œuvre, Finitions, etc.)
2. Pour CHAQUE CATÉGORIE:
   - name: nom du lot
   - description: description courte
   - items: tableau des postes
   - subtotal_ht, subtotal_tva, subtotal_ttc: sous-totaux calculés

3. Pour CHAQUE POSTE (item):
   - poste: nom du poste (ex: "Terrassement", "Dalle béton")
   - description: détails techniques
   - quantity: quantité (nombre)
   - unit: unité (m², m³, ml, u, forfait)
   - unit_price_ht: prix unitaire HT en euros
   - amount_ht: montant HT (quantity × unit_price_ht)
   - tva_percent: 20
   - tva_amount: montant TVA
   - amount_ttc: montant TTC
   - materials_cost: coût matériaux (optionnel)
   - labor_cost: coût main d'œuvre (optionnel)

4. MÉTADONNÉES du devis:
   - estimate_number: numéro unique (ex: DEVIS-2024-001)
   - client_name: "Client"
   - validity_days: 30
   - payment_terms: conditions de paiement
   - execution_delay: délai d'exécution estimé
   - deposit_required: acompte en % (généralement 30)
   - special_conditions: conditions particulières si nécessaire

5. TOTAUX:
   - total_ht: somme de tous les amount_ht
   - total_tva: somme de tous les tva_amount
   - total_ttc: total_ht + total_tva

IMPORTANT:
- Utilise des prix ${scenarioType} (×${multiplier}) réalistes pour le marché français
- TOUS les calculs doivent être exacts
- Réponds UNIQUEMENT en JSON valide et COMPLET
- Ferme TOUS les crochets et accolades
- Structure EXACTE requise:

{
  "estimate_number": "DEVIS-2024-XXX",
  "client_name": "Client",
  "validity_days": 30,
  "payment_terms": "30% à la commande, 70% à la livraison",
  "execution_delay": "X semaines",
  "deposit_required": 30,
  "special_conditions": "...",
  "categories": [
    {
      "name": "Nom du lot",
      "description": "Description",
      "items": [
        {
          "poste": "Nom poste",
          "description": "Détails",
          "quantity": 100,
          "unit": "m²",
          "unit_price_ht": 50.00,
          "amount_ht": 5000.00,
          "tva_percent": 20,
          "tva_amount": 1000.00,
          "amount_ttc": 6000.00,
          "materials_cost": 3000.00,
          "labor_cost": 2000.00
        }
      ],
      "subtotal_ht": 5000.00,
      "subtotal_tva": 1000.00,
      "subtotal_ttc": 6000.00
    }
  ],
  "total_ht": 5000.00,
  "total_tva": 1000.00,
  "total_ttc": 6000.00,
  "discount_amount": 0,
  "discount_percent": 0
}`;

    const llmApiUrl = model.api_endpoint || "https://openrouter.ai/api/v1/chat/completions";
    const llmApiKey = model.api_key || Deno.env.get("OPENROUTER_API_KEY");

    if (!llmApiKey) {
      throw new Error("No API key configured for the selected model");
    }

    const llmHeaders: Record<string, string> = {
      "Authorization": `Bearer ${llmApiKey}`,
      "Content-Type": "application/json",
    };

    if (model.provider === "openrouter") {
      llmHeaders["HTTP-Referer"] = supabaseUrl;
      llmHeaders["X-Title"] = "Aide Devis IA";
    }

    const llmRequestBody = {
      model: model.model_id,
      messages: [
        {
          role: "system",
          content: "Tu es un métreur expert en BTP. Tu génères des devis détaillés et précis avec des calculs HT/TTC exacts. Tu réponds UNIQUEMENT en JSON valide et COMPLET. IMPORTANT: Termine toujours ton JSON correctement avec tous les crochets et accolades fermés.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    };

    const startTime = Date.now();
    const llmResponse = await fetch(llmApiUrl, {
      method: "POST",
      headers: llmHeaders,
      body: JSON.stringify(llmRequestBody),
    });
    const responseTime = Date.now() - startTime;

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      model_id: model.id,
      tokens_used: 0,
      cost: 0,
      response_time: responseTime,
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM API error: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const content = llmData.choices[0].message.content;

    let estimateData;
    try {
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      let jsonString = jsonMatch[0];

      try {
        estimateData = JSON.parse(jsonString);
      } catch (firstError) {
        console.log("First parse attempt failed, trying to repair JSON...");

        jsonString = jsonString
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([^,\s])\s*\n\s*"/g, '$1,"')
          .replace(/"\s*\n\s*}/g, '"}')          .replace(/}\s*\n\s*{/g, '},{')
          .replace(/]\s*\n\s*\[/g, '],[')

        try {
          estimateData = JSON.parse(jsonString);
        } catch (secondError) {
          console.log("Second parse attempt failed, truncating at error position...");

          const errorMatch = secondError.message.match(/position (\d+)/);
          if (errorMatch) {
            const errorPos = parseInt(errorMatch[1]);
            jsonString = jsonString.substring(0, errorPos);

            let braceCount = 0;
            let bracketCount = 0;
            for (const char of jsonString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (char === '[') bracketCount++;
              if (char === ']') bracketCount--;
            }

            while (bracketCount > 0) {
              jsonString += ']';
              bracketCount--;
            }
            while (braceCount > 0) {
              jsonString += '}';
              braceCount--;
            }

            estimateData = JSON.parse(jsonString);
          } else {
            throw secondError;
          }
        }
      }
    } catch (parseError) {
      console.error("All JSON parse attempts failed:", parseError);
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
    }

    if (!estimateData.categories || estimateData.categories.length === 0) {
      console.log("No categories found, extracting items from partial data...");

      const allItems = [];
      if (estimateData.items && Array.isArray(estimateData.items)) {
        allItems.push(...estimateData.items);
      }

      if (estimateData.line_items && Array.isArray(estimateData.line_items)) {
        allItems.push(...estimateData.line_items);
      }

      if (allItems.length > 0) {
        estimateData.categories = [{
          name: "Travaux",
          description: "Ensemble des travaux",
          items: allItems
        }];
      } else {
        estimateData.categories = [{
          name: "Travaux",
          description: `Travaux ${scenarioType}`,
          items: [{
            poste: "Travaux globaux",
            description: `Estimation globale ${scenarioType} basée sur la description du projet`,
            quantity: 1,
            unit: "forfait",
            unit_price_ht: scenarioType === 'eco' ? 5000 : scenarioType === 'standard' ? 10000 : 20000,
            tva_percent: 20
          }]
        }];
      }
    }

    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    const validatedCategories = estimateData.categories
      .map((cat: any) => {
        const validItems = (cat.items || [])
          .filter((item: any) => {
            return item && (item.poste || item.description);
          })
          .map((item: any) => {
            const quantity = Number(item.quantity) || 1;
            const unitPriceHT = Number(item.unit_price_ht) || 0;
            const tvaPercent = Number(item.tva_percent) || 20;

            const amountHT = Math.round(quantity * unitPriceHT * 100) / 100;
            const tvaAmount = Math.round(amountHT * (tvaPercent / 100) * 100) / 100;
            const amountTTC = Math.round((amountHT + tvaAmount) * 100) / 100;

            return {
              poste: item.poste || item.description || "Poste",
              description: item.description || item.poste || "",
              quantity: quantity,
              unit: item.unit || "u",
              unit_price_ht: unitPriceHT,
              amount_ht: amountHT,
              tva_percent: tvaPercent,
              tva_amount: tvaAmount,
              amount_ttc: amountTTC,
              materials_cost: Number(item.materials_cost) || 0,
              labor_cost: Number(item.labor_cost) || 0,
            };
          });

        if (validItems.length === 0) {
          return null;
        }

        const subtotalHT = validItems.reduce((sum, item) => sum + item.amount_ht, 0);
        const subtotalTVA = validItems.reduce((sum, item) => sum + item.tva_amount, 0);
        const subtotalTTC = validItems.reduce((sum, item) => sum + item.amount_ttc, 0);

        totalHT += subtotalHT;
        totalTVA += subtotalTVA;
        totalTTC += subtotalTTC;

        return {
          name: cat.name || "Catégorie",
          description: cat.description || "",
          items: validItems,
          subtotal_ht: Math.round(subtotalHT * 100) / 100,
          subtotal_tva: Math.round(subtotalTVA * 100) / 100,
          subtotal_ttc: Math.round(subtotalTTC * 100) / 100,
        };
      })
      .filter((cat: any) => cat !== null);

    if (validatedCategories.length === 0) {
      console.log("No valid categories after validation, creating default category...");
      const defaultPrice = scenarioType === 'eco' ? 5000 : scenarioType === 'standard' ? 10000 : 20000;
      const defaultHT = defaultPrice;
      const defaultTVA = Math.round(defaultHT * 0.2 * 100) / 100;
      const defaultTTC = defaultHT + defaultTVA;

      validatedCategories.push({
        name: "Travaux",
        description: `Estimation globale ${scenarioType}`,
        items: [{
          poste: "Travaux globaux",
          description: `Estimation forfaitaire ${scenarioType} basée sur la description du projet`,
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
        project_id: projectId,
        scenario_type: scenarioType,
        total_amount: totalTTC,
        line_items: lineItems,
        categories: validatedCategories,
        estimate_number: estimateData.estimate_number || `DEVIS-${Date.now()}`,
        client_name: estimateData.client_name || "Client",
        estimate_date: new Date().toISOString(),
        validity_days: estimateData.validity_days || 30,
        payment_terms: estimateData.payment_terms || "30% à la commande, 70% à la livraison",
        execution_delay: estimateData.execution_delay || "À définir",
        deposit_required: estimateData.deposit_required || 30,
        special_conditions: estimateData.special_conditions,
        total_ht: totalHT,
        total_tva: totalTVA,
        total_ttc: totalTTC,
        discount_amount: estimateData.discount_amount || 0,
        discount_percent: estimateData.discount_percent || 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save estimate: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, estimate }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating estimate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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