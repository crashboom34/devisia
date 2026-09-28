import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { calculateReviewedQuote } from '../_shared/estimate-totals.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
  'Content-Type': 'application/json',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { headers, status });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return reply({ error: 'Configuration indisponible' }, 503);
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return reply({ error: 'Authentification requise' }, 401);
    const supabase = createClient(url, serviceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
    if (authError || !user) return reply({ error: 'Authentification requise' }, 401);

    const body = await req.json();
    if (typeof body.estimateId !== 'string' || body.confirmed !== true || !Array.isArray(body.vatRates))
      return reply({ error: 'Contrôle des postes et de la TVA requis' }, 400);
    const { data: estimate, error: readError } = await supabase.from('estimates').select('*')
      .eq('id', body.estimateId).eq('user_id', user.id).eq('estimate_kind', 'preliminary').maybeSingle();
    if (readError) throw readError;
    if (!estimate) return reply({ error: 'Estimation préliminaire introuvable' }, 404);
    const { data: project } = await supabase.from('projects').select('id, description, user_id')
      .eq('id', estimate.project_id).eq('user_id', user.id).maybeSingle();
    const { data: refinement } = await supabase.from('project_refinements').select('version')
      .eq('project_id', estimate.project_id).eq('user_id', user.id).maybeSingle();
    if (!project || refinement?.version !== estimate.estimate_data?.refinement_version ||
        project.description !== estimate.estimate_data?.project_description)
      return reply({ error: 'Le dossier a changé. Recalculez l’estimation avant de préparer le devis.' }, 409);
    if (Array.isArray(estimate.estimate_data?.missing) && estimate.estimate_data.missing.length)
      return reply({ error: 'Répondez aux points encore ouverts avant de créer le devis.' }, 409);

    let calculated;
    try { calculated = calculateReviewedQuote(estimate.categories, body.vatRates); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : 'Montants invalides' }, 400); }

    const { data: finalized, error: updateError } = await supabase.from('estimates').update({
      estimate_kind: 'quote', estimate_number: `DEVIS-${Date.now()}`, estimate_date: new Date().toISOString(),
      categories: calculated.categories, line_items: calculated.lineItems,
      total_ht: calculated.totalHT, total_tva: calculated.totalTVA,
      total_ttc: calculated.totalTTC, total_amount: calculated.totalTTC,
      special_conditions: Array.isArray(estimate.estimate_data?.assumptions) && estimate.estimate_data.assumptions.length
        ? `Hypothèses et réserves à vérifier : ${estimate.estimate_data.assumptions.join(' ; ').slice(0, 3000)}` : null,
      estimate_data: { ...estimate.estimate_data, status: 'REVIEWED_QUOTE', vat_status: 'CONFIRMED_BY_USER', reviewed_at: new Date().toISOString() },
    }).eq('id', estimate.id).eq('user_id', user.id).eq('estimate_kind', 'preliminary').select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!finalized) return reply({ error: 'Estimation déjà modifiée. Actualisez la page.' }, 409);
    return reply({ success: true, estimateId: finalized.id });
  } catch (error) {
    console.error('[finalize-estimate] Error:', error);
    return reply({ error: 'Impossible de finaliser ce chiffrage. Vérifiez le dossier et réessayez.' }, 500);
  }
});
