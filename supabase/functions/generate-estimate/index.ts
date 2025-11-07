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
  temperature?: number;
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

    const { projectId, projectDescription, scenarioType, modelId, temperature }: EstimateRequest = await req.json();

    if (!projectId || !projectDescription || !scenarioType) {
      throw new Error("Missing required fields");
    }

    const apiTemperature = temperature !== undefined ? temperature : 0.5;

    // Fonction pour obtenir les modèles de fallback (gratuits ou très économiques)
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

    let selectedModelId = modelId;
    if (!selectedModelId) {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("preferred_model_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (preferences?.preferred_model_id) {
        selectedModelId = preferences.preferred_model_id;
      } else {
        const { data: defaultModel } = await supabase
          .from("ai_models")
          .select("id")
          .eq("is_default", true)
          .eq("is_active", true)
          .maybeSingle();

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
      .maybeSingle();

    if (modelError || !model) {
      throw new Error("Invalid model selected");
    }

    // Liste des modèles à essayer (modèle sélectionné + fallbacks)
    let modelsToTry = [model];
    const fallbackModels = await getFallbackModels();

    // Ajouter les fallbacks qui ne sont pas déjà le modèle sélectionné
    for (const fallback of fallbackModels) {
      if (fallback.id !== model.id) {
        modelsToTry.push(fallback);
      }
    }

    const priceMultipliers = {
      eco: 0.7,
      standard: 1.0,
      premium: 1.5,
    };

    const multiplier = priceMultipliers[scenarioType];

    const prompt = `Tu es une IA d'économie de la construction, jouant le rôle d'un économiste du bâtiment et maître d'œuvre expérimenté (15+ ans de terrain) spécialisé dans les projets résidentiels en France métropolitaine.

**PROJET À CHIFFRER:**
${projectDescription}

**SCÉNARIO DEMANDÉ:** ${scenarioType.toUpperCase()}
${scenarioType === 'eco' ? `→ ÉCONOMIQUE (coefficient qualité: 0.85) - Matériaux standards, techniques simples, finitions de base, focus fonctionnel` : ''}${scenarioType === 'standard' ? `→ STANDARD (coefficient qualité: 1.00) - Matériaux qualité moyenne, techniques éprouvées, finitions soignées, compromis optimal` : ''}${scenarioType === 'premium' ? `→ PREMIUM (coefficient qualité: 1.25) - Matériaux haut de gamme, techniques avancées, finitions luxueuses, durabilité maximale` : ''}

**RATIOS DE RÉFÉRENCE 2024-2025 (base France, avant coefficients):**
- Construction/extension parpaing/béton: 1800-2600 €/m²
- Extension ossature bois: 1500-2300 €/m²
- Surélévation: 2200-2800 €/m²
- Rénovation lourde: 1200-1800 €/m²
- Terrasse couverte: 600-1200 €/m²
- Clim bi-split posée: 3000-5000 €

**COEFFICIENTS GÉOGRAPHIQUES (à appliquer):**
- Paris intra-muros: +25 à +30%
- IDF hors Paris: +15 à +20%
- Côte d'Azur (06/83): +15 à +20%
- Grandes métropoles (Lyon, Bordeaux, Nantes): +10 à +15%
- Montpellier/Hérault/Gard/Vaucluse: +10 à +15%
- Littoral Atlantique: +8 à +12%
- Centre rural: 0 à -5%

**STRUCTURE OBLIGATOIRE DU DEVIS (5 GRANDS POSTES):**

1) GROS ŒUVRE (40-50% budget):
   - Terrassement, fondations (100-150 €/m²)
   - Dalle béton 15-20cm (65-100 €/m²)
   - Élévation murs parpaing+enduit (180-280 €/m²) ou ossature bois (150-250 €/m²)
   - Charpente industrielle (50-80 €/m² toiture)
   - Couverture et étanchéité

2) SECOND ŒUVRE (30-35%):
   - Isolation (25-40 €/m² intérieur, 80-140 €/m² ITE)
   - Cloisons/doublages BA13
   - Menuiseries extérieures PVC (350-600 €/m²) ou alu (450-800 €/m²)
   - Électricité complète (80-120 €/m² hab.)
   - Plomberie/évacuations
   - Chauffage/climatisation

3) FINITIONS (15-20%):
   - Revêtements sols: carrelage (50-80 €/m²), parquet flottant (30-50 €/m²)
   - Peinture (20-35 €/m²)
   - Salle de bain (3000-9000 €)
   - Cuisine (3000-12000 €)
   - Portes intérieures

4) AMÉNAGEMENTS EXTÉRIEURS:
   - Terrasse couverte (600-1200 €/m²)
   - Terrasse carrelée/bois (70-160 €/m²)
   - VRD/raccordements (800-5000 € selon distance)
   - Clôtures, portail

5) FRAIS ANNEXES & IMPRÉVUS (5-15%):
   - Étude de sol G2: 1500-2500 €
   - Étude thermique: 800-1500 €
   - Permis/DP: 500-3000 €
   - Assurance DO: 2-4% des travaux
   - Enveloppe sécurité: 5-10%

**TVA:** 10% pour rénovation/extension logement >2 ans, 20% pour neuf

**FORMAT DE SORTIE - STRUCTURE JSON EXACTE:**

{
  "estimate_number": "DEVIS-2024-001",
  "client_name": "Client",
  "validity_days": 30,
  "payment_terms": "30% à la commande, 70% à la livraison",
  "execution_delay": "4 semaines",
  "deposit_required": 30,
  "categories": [
    {
      "name": "Nom du lot BTP",
      "description": "Description du lot",
      "items": [
        {
          "poste": "Nom du poste",
          "description": "Détails techniques",
          "quantity": 100,
          "unit": "m²",
          "unit_price_ht": 50.00,
          "amount_ht": 5000.00,
          "tva_percent": 20,
          "tva_amount": 1000.00,
          "amount_ttc": 6000.00
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
  "scenario_justification": "Explication en 2-3 phrases: Pourquoi ce scénario ${scenarioType} coûte ce prix par rapport aux autres? Quelles sont les différences qui justifient l'écart de prix? Quel est le rapport qualité-prix?"
}

**RÈGLES OBLIGATOIRES:**
1. STRUCTURE: Organise OBLIGATOIREMENT en 5 catégories (Gros œuvre, Second œuvre, Finitions, Aménagements extérieurs, Frais annexes)
2. DÉTAIL: Chaque poste doit avoir quantité, unité, prix unitaire HT, montant HT
3. TVA: Applique 10% (rénovation/extension >2 ans) ou 20% (neuf) - précise laquelle dans special_conditions
4. GÉOGRAPHIE: Applique le coefficient régional si la localisation est mentionnée
5. QUALITÉ: Applique le coefficient ${scenarioType} (${scenarioType === 'eco' ? '0.85' : scenarioType === 'standard' ? '1.00' : '1.25'})
6. JUSTIFICATION: Ajoute OBLIGATOIREMENT "scenario_justification" avec 2-3 phrases expliquant:
   - Pourquoi ce prix (matériaux, techniques, région)
   - Ce qui différencie ce scénario des autres
   - Le rapport qualité-prix
7. RÉALISME: Vise ±10% d'un vrai chantier, base ton estimation sur les ratios de référence fournis
8. PRÉCISION: Descriptions techniques précises (matériaux exacts, dimensions, normes)
9. EXHAUSTIF: Inclus TOUJOURS les frais annexes (études, permis, DO, imprévus 5-10%)
10. CRÉDIBILITÉ: Ton devis doit pouvoir être présenté à une entreprise du bâtiment sans paraître fantaisiste

**IMPORTANT:**
- Réponds UNIQUEMENT avec du JSON valide et complet
- N'oublie JAMAIS le champ "scenario_justification"
- Adapte les prix selon la région mentionnée dans la description du projet
- Structure toujours en 5 grandes catégories, même si certaines sont petites`;

    // Essayer les modèles avec fallback automatique
    let llmData;
    let content;
    let responseTime = 0;
    let usedModel = model;
    let lastError = null;

    for (const currentModel of modelsToTry) {
      try {
        console.log(`Trying model: ${currentModel.display_name} (${currentModel.model_id})`);

        const llmApiUrl = currentModel.api_endpoint || "https://openrouter.ai/api/v1/chat/completions";
        const llmApiKey = currentModel.api_key || Deno.env.get("OPENROUTER_API_KEY");

        if (!llmApiKey) {
          console.log(`No API key for ${currentModel.display_name}, skipping...`);
          continue;
        }

        const llmHeaders: Record<string, string> = {
          "Authorization": `Bearer ${llmApiKey}`,
          "Content-Type": "application/json",
        };

        if (currentModel.provider === "openrouter") {
          llmHeaders["HTTP-Referer"] = supabaseUrl;
          llmHeaders["X-Title"] = "Aide Devis IA";
        }

        const llmRequestBody = {
          model: currentModel.model_id,
          messages: [
            {
              role: "system",
              content: "Tu es un économiste du bâtiment et maître d'œuvre expérimenté (15+ ans). Tu génères des devis BTP professionnels, détaillés, réalistes et crédibles (±10% d'un vrai chantier), en JSON valide uniquement. Tu appliques les coefficients géographiques, les ratios de référence 2024-2025, et structures TOUJOURS en 5 catégories: Gros œuvre, Second œuvre, Finitions, Aménagements extérieurs, Frais annexes.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: apiTemperature,
          max_tokens: 4000,
        };

        const startTime = Date.now();
        const llmResponse = await fetch(llmApiUrl, {
          method: "POST",
          headers: llmHeaders,
          body: JSON.stringify(llmRequestBody),
        });
        responseTime = Date.now() - startTime;

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          lastError = errorText;

          // Vérifier si c'est une erreur de rate limit (429)
          if (llmResponse.status === 429) {
            console.log(`Model ${currentModel.display_name} is rate-limited, trying next model...`);
            continue;
          }

          // Pour d'autres erreurs, essayer quand même le modèle suivant
          console.log(`Model ${currentModel.display_name} failed: ${errorText}`);
          continue;
        }

        llmData = await llmResponse.json();
        content = llmData.choices[0].message.content;
        usedModel = currentModel;
        console.log(`Successfully used model: ${currentModel.display_name}`);
        break;

      } catch (error) {
        console.error(`Error with model ${currentModel.display_name}:`, error);
        lastError = error.message;
        continue;
      }
    }

    // Si aucun modèle n'a fonctionné
    if (!content) {
      throw new Error(`All models failed. Last error: ${lastError || "Unknown error"}`);
    }

    let estimateData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      estimateData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse failed:", parseError);
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
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
          unit_price_ht: scenarioType === 'eco' ? 5000 : scenarioType === 'standard' ? 10000 : 20000,
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

        if (validItems.length === 0) return null;

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
      const defaultPrice = scenarioType === 'eco' ? 5000 : scenarioType === 'standard' ? 10000 : 20000;
      const defaultHT = defaultPrice;
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
        model_used: usedModel.display_name,
        scenario_justification: estimateData.scenario_justification || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save estimate: ${insertError.message}`);
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      model_id: usedModel.id,
      tokens_used: 0,
      cost: 0,
      response_time: responseTime,
    });

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
