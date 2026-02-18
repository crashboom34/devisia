import { createClient } from 'npm:@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { estimateId, modelId, projectDescription, adminTier } = await req.json();

    // Récupérer l'ancien devis
    const { data: oldEstimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*, projects!inner(*)')
      .eq('id', estimateId)
      .eq('projects.user_id', user.id)
      .single();

    if (fetchError || !oldEstimate) {
      throw new Error('Estimate not found or unauthorized');
    }

    // Récupérer le modèle sélectionné
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .eq('is_active', true)
      .single();

    if (modelError || !model) {
      throw new Error('Model not found');
    }

    // Désactiver l'ancien devis
    await supabase
      .from('estimates')
      .update({ is_active: false })
      .eq('id', estimateId);

    // Incrémenter le compteur de régénération
    const regenerationCount = (oldEstimate.regeneration_count || 0) + 1;

    // Appeler la fonction de génération avec le nouveau modèle
    // IMPORTANT: Passer le token utilisateur, pas la clé service
    const generateUrl = `${supabaseUrl}/functions/v1/generate-estimate`;
    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: oldEstimate.project_id,
        projectDescription: projectDescription,
        scenarioType: oldEstimate.scenario_type,
        modelId: modelId,
        adminTier: adminTier || undefined,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`Failed to generate estimate: ${errorText}`);
    }

    const generateResult = await generateResponse.json();

    // Mettre à jour le nouveau devis avec les informations de régénération
    const { data: newEstimate, error: updateError } = await supabase
      .from('estimates')
      .update({
        is_active: true,
        regenerated_from_id: estimateId,
        regeneration_count: regenerationCount,
      })
      .eq('id', generateResult.estimate.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        newEstimateId: newEstimate.id,
        newTotal: parseFloat(newEstimate.total_ttc),
        oldTotal: parseFloat(oldEstimate.total_ttc),
        difference: parseFloat(newEstimate.total_ttc) - parseFloat(oldEstimate.total_ttc),
        differencePercent: ((parseFloat(newEstimate.total_ttc) - parseFloat(oldEstimate.total_ttc)) / parseFloat(oldEstimate.total_ttc)) * 100,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error regenerating estimate:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});