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

    const { projectId, projectDescription, scenarioType, temperature, templateId, adminTier }: EstimateRequest = await req.json();

    if (!projectId || !projectDescription || !scenarioType) {
      throw new Error("Missing required fields");
    }

    const apiTemperature = temperature !== undefined ? temperature : 0.5;

    // Charger le template si fourni
    let templateData = null;
    if (templateId && templateId !== 'none') {
      const { data: template, error: templateError } = await supabase
        .from("estimate_templates")
        .select("*")
        .eq("template_id", templateId)
        .eq("is_active", true)
        .maybeSingle();

      if (!templateError && template) {
        templateData = template;
        console.log(`Using template: ${template.name} (${template.category})`);
      } else {
        console.log(`Template ${templateId} not found or inactive, proceeding without template`);
      }
    }

    // Fonction pour obtenir les modèles de fallback (gratuits ou très économiques)
    const getFallbackModels = async () => {
      const { data: fallbackModels, error: fallbackError } = await supabase
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .lte("cost_per_1k_tokens_input", 0.001)
        .order("cost_per_1k_tokens_input", { ascending: true })
        .limit(5);

      if (fallbackError) {
        console.error("Error fetching fallback models:", fallbackError);
      }
      console.log(`Found ${fallbackModels?.length || 0} fallback models`);
      return fallbackModels || [];
    };

    // MODEL SELECTION: admin tier override > subscription > fallback
    console.log("Determining AI model...");

    let selectedModelId = null;

    // 1) Admin tier override: admin sends their simulated plan from frontend
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
          console.log(`Admin override - using ${resolvedTierName} tier model`);
        }
      } else {
        console.warn("adminTier sent but user is not admin, ignoring");
      }
    }

    // 2) Normal subscription lookup
    if (!selectedModelId) {
      const { data: modelData, error: modelLookupError } = await supabase.rpc(
        'get_user_ai_model',
        { p_user_id: user.id }
      );

      if (!modelLookupError && modelData && modelData.length > 0) {
        selectedModelId = modelData[0].model_id;
        console.log(`Subscription-assigned model: ${modelData[0].model_identifier}`);
      }
    }

    // 3) Fallback: starter tier model, then cheapest active model
    if (!selectedModelId) {
      console.warn("No subscription model found, using fallback");
      const { data: starterTier } = await supabase
        .from("subscription_tiers")
        .select("ai_model_id")
        .eq("name", "starter")
        .eq("is_active", true)
        .maybeSingle();

      if (starterTier?.ai_model_id) {
        selectedModelId = starterTier.ai_model_id;
        console.log("Using Starter tier default model");
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
      console.error("Model selection error:", modelError);
      console.error("Selected model ID:", selectedModelId);
      throw new Error(`Invalid model selected: ${modelError?.message || 'Model not found'}`);
    }

    console.log(`Starting generation with model: ${model.display_name} (${model.model_id})`);
    console.log(`Temperature: ${apiTemperature}`);

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
      console.error("No OpenRouter API key found in system_config or environment");
      throw new Error("Clé API OpenRouter non configurée. Allez dans Admin > Configuration pour ajouter votre clé API OpenRouter.");
    }

    console.log("OpenRouter API key found: Yes");

    // Liste des modèles à essayer (modèle sélectionné + fallbacks)
    let modelsToTry = [model];
    const fallbackModels = await getFallbackModels();

    // Ajouter les fallbacks qui ne sont pas déjà le modèle sélectionné
    for (const fallback of fallbackModels) {
      if (fallback.id !== model.id) {
        modelsToTry.push(fallback);
      }
    }

    console.log(`Will try ${modelsToTry.length} models:`, modelsToTry.map(m => m.display_name).join(", "));

    const priceMultipliers = {
      eco: 0.7,
      standard: 1.0,
      premium: 1.5,
    };

    const multiplier = priceMultipliers[scenarioType];

    // Construire le contexte du template si disponible
    let templateContext = '';
    if (templateData) {
      templateContext = `\n**TEMPLATE DE RÉFÉRENCE: ${templateData.name}**
**Catégorie:** ${templateData.category}

**LOTS ET POSTES RECOMMANDÉS:**
${JSON.stringify(templateData.lots, null, 2)}

UTILISE CE TEMPLATE comme structure de base. Adapte les lots et postes à la description du projet, mais garde la logique et l'organisation du template.
Pour le scénario ${scenarioType.toUpperCase()}, utilise les spécifications de "gamme_${scenarioType}" de chaque poste.

`;
    }

    const prompt = `Tu es un économiste du bâtiment expérimenté. Génère un devis BTP professionnel et réaliste pour ce projet.

**PROJET:**
${projectDescription}
${templateContext}
**SCÉNARIO:** ${scenarioType.toUpperCase()}
${scenarioType === 'eco' ? '- Coef 0.85: Matériaux standards, finitions base' : ''}${scenarioType === 'standard' ? '- Coef 1.00: Matériaux qualité moyenne, finitions soignées' : ''}${scenarioType === 'premium' ? '- Coef 1.25: Matériaux premium, finitions luxueuses' : ''}

**RATIOS 2024-2025:**
Construction: 1800-2600€/m² | Ossature bois: 1500-2300€/m² | Surélévation: 2200-2800€/m²
Terrasse couverte: 600-1200€/m² | Clim bi-split: 3000-5000€

**COEFFICIENTS RÉGIONAUX:**
Paris: +25-30% | IDF: +15-20% | Métropoles: +10-15% | Montpellier/Hérault: +10-15% | Rural: 0 à -5%

**STRUCTURE OBLIGATOIRE (5 catégories):**

1. GROS ŒUVRE (40-50%): Fondations 100-150€/m², Dalle 65-100€/m², Murs 180-280€/m², Charpente 50-80€/m²

2. SECOND ŒUVRE (30-35%): Isolation 25-140€/m², Menuiseries PVC 350-600€/m², Électricité 80-120€/m², Plomberie

3. FINITIONS (15-20%): Carrelage 50-80€/m², Peinture 20-35€/m², SDB 3k-9k€, Cuisine 3k-12k€

4. AMÉNAGEMENTS EXT: Terrasse, VRD 800-5k€, Clôtures

5. FRAIS ANNEXES (5-15%): Étude sol 1.5-2.5k€, Thermique 800-1500€, Permis 500-3k€, DO 2-4%, Imprévus 5-10%

**TVA:** 10% réno/extension >2ans, 20% neuf

**RÉPONDS UNIQUEMENT EN JSON (pas de texte avant/après):**

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

**RÈGLES:**
1. 5 catégories obligatoires (Gros œuvre, Second œuvre, Finitions, Aménagements ext, Frais annexes)
2. Quantité, unité, prix unitaire HT pour chaque poste
3. TVA 10% (réno >2ans) ou 20% (neuf) - précise dans special_conditions
4. Applique coefficient régional si localisation mentionnée
5. Applique coefficient qualité ${scenarioType} (${scenarioType === 'eco' ? '0.85' : scenarioType === 'standard' ? '1.00' : '1.25'})
6. OBLIGATOIRE "scenario_justification" (2-3 phrases): matériaux/techniques/région, différences avec autres scénarios, rapport qualité-prix
7. Réalisme ±10% marché réel, base-toi sur ratios fournis
8. Frais annexes toujours inclus (5-15%)

RÉPONDS UNIQUEMENT EN JSON VALIDE (sans texte avant ou après).`;

    // Essayer les modèles avec fallback automatique
    let llmData;
    let content;
    let responseTime = 0;
    let usedModel = model;
    let lastError = null;
    let estimateData = null;

    for (const currentModel of modelsToTry) {
      try {
        console.log(`Trying model: ${currentModel.display_name} (${currentModel.model_id})`);

        const llmApiUrl = currentModel.api_endpoint || "https://openrouter.ai/api/v1/chat/completions";

        // Utiliser la clé du modèle, ou la clé OpenRouter pour les modèles OpenRouter, ou l'env var
        let llmApiKey = currentModel.api_key;
        if (!llmApiKey && currentModel.provider === "openrouter") {
          llmApiKey = openrouterApiKey;
        }
        if (!llmApiKey) {
          llmApiKey = Deno.env.get("OPENROUTER_API_KEY");
        }

        if (!llmApiKey) {
          console.log(`No API key for ${currentModel.display_name} (provider: ${currentModel.provider}), skipping...`);
          lastError = `No API key available for ${currentModel.display_name}`;
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
          max_tokens: 6000,
        };

        console.log(`Sending request to: ${llmApiUrl}`);

        const startTime = Date.now();
        const llmResponse = await fetch(llmApiUrl, {
          method: "POST",
          headers: llmHeaders,
          body: JSON.stringify(llmRequestBody),
        });
        responseTime = Date.now() - startTime;

        console.log(`Response status: ${llmResponse.status}, Time: ${responseTime}ms`);

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          lastError = `HTTP ${llmResponse.status}: ${errorText}`;
          console.error(`Error response:`, lastError);

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

        // Vérifier que la réponse contient du JSON
        if (!content || (!content.includes('{') && !content.includes('}'))) {
          console.error(`Model ${currentModel.display_name} returned non-JSON response`);
          console.error("Content:", content?.substring(0, 500));
          lastError = "Model returned text without JSON";
          continue;
        }

        console.log("Raw LLM response length:", content.length);
        console.log("First 500 chars:", content.substring(0, 500));

        // Essayer de parser le JSON
        try {
          // Essayer plusieurs patterns de détection JSON
          let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            console.log("Found JSON in code block");
            estimateData = JSON.parse(jsonMatch[1]);
          } else {
            // Chercher un objet JSON brut
            jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.error("No JSON pattern found in response from", currentModel.display_name);
              lastError = "No JSON pattern found in response";
              continue;
            }
            console.log("Found raw JSON object");
            estimateData = JSON.parse(jsonMatch[0]);
          }

          // Si on arrive ici, le parsing a réussi
          usedModel = currentModel;
          console.log(`Successfully parsed JSON from model: ${currentModel.display_name}`);
          break;

        } catch (parseError) {
          console.error(`JSON parse failed for model ${currentModel.display_name}:`, parseError);
          console.error("Content that failed:", content.substring(0, 1000));
          lastError = `JSON parse error: ${parseError.message}`;
          continue;
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error with model ${currentModel.display_name}:`, errorMsg);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        lastError = errorMsg || "Fetch error";
        continue;
      }
    }

    // Si aucun modèle n'a réussi à générer un devis valide
    if (!estimateData) {
      const errorDetails = lastError || "No models available or all models failed to generate valid JSON";
      console.error("All models failed. Details:", errorDetails);
      throw new Error(`All models failed. Last error: ${errorDetails}`);
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

    const usedFallback = usedModel.id !== model.id;
    return new Response(
      JSON.stringify({
        success: true,
        estimate,
        ...(usedFallback && {
          warning: `Le modèle ${model.display_name} n'a pas pu être utilisé. Modèle de remplacement: ${usedModel.display_name}`,
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
