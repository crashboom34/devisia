/** The subscription mapping is the sole source of truth for OpenRouter calls. */
export async function selectPlanModel(supabase: any, userId: string, adminTier?: string): Promise<{ model: any; resolvedTier: string }> {
  let tierName: string | undefined;
  let tierId: string | undefined;
  let override = false;

  if (adminTier) {
    const requested = adminTier.trim().toLowerCase();
    if (!['starter', 'business', 'pro', 'unlimited'].includes(requested)) throw new Error('Plan de simulation inconnu');
    const { data: admin, error } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (admin) {
      tierName = requested === 'unlimited' ? 'pro' : requested;
      override = true;
    }
  }

  if (!tierName) {
    const { data: subscription, error } = await supabase.from('user_subscriptions')
      .select('tier_id').eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (error) throw error;
    tierId = subscription?.tier_id;
    if (!tierId) tierName = 'starter';
  }

  let query = supabase.from('subscription_tiers').select('name, ai_model_id').eq('is_active', true);
  query = tierId ? query.eq('id', tierId) : query.eq('name', tierName);
  const { data: tier, error: tierError } = await query.maybeSingle();
  if (tierError) throw tierError;
  if (!tier?.ai_model_id) throw new Error('Aucun modèle IA actif configuré pour ce plan');

  const { data: model, error: modelError } = await supabase.from('ai_models').select('*')
    .eq('id', tier.ai_model_id).eq('provider', 'openrouter').eq('is_active', true).maybeSingle();
  if (modelError) throw modelError;
  if (!model) throw new Error(`Le modèle OpenRouter du plan ${tier.name} est indisponible. Modifiez son affectation dans l'administration.`);
  return { model, resolvedTier: `${override ? 'admin-override' : 'subscription'}:${tier.name}` };
}
