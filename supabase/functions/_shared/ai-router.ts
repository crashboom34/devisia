export type AiTaskType = 'classification' | 'quote_generation' | 'quote_review' | 'time_extraction' | 'cost_analysis';
export type Complexity = 1 | 2 | 3;

export interface AiRouteRequest {
  taskType: AiTaskType;
  complexity: Complexity;
  adminTier?: string;
}
export interface AiRoute {
  tier: string;
  taskType: AiTaskType;
  complexity: Complexity;
  reasoningEffort: string;
  maxOutputTokens: number;
  models: any[];
  policyId?: string;
}

async function resolveTier(supabase: any, userId: string, adminTier?: string) {
  let requestedTier: string | undefined;
  if (adminTier) {
    const normalized = adminTier.trim().toLowerCase();
    if (!['starter', 'business', 'pro', 'unlimited'].includes(normalized)) throw new Error('Plan de simulation inconnu');
    const { data: admin, error } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (admin) requestedTier = normalized === 'unlimited' ? 'pro' : normalized;
  }

  const { data: subscription, error: subscriptionError } = requestedTier
    ? { data: null, error: null }
    : await supabase.from('user_subscriptions').select('tier_id').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (subscriptionError) throw subscriptionError;

  let query = supabase.from('subscription_tiers').select('id, name, ai_model_id').eq('is_active', true);
  query = requestedTier
    ? query.eq('name', requestedTier)
    : subscription?.tier_id
      ? query.eq('id', subscription.tier_id)
      : query.eq('name', 'starter');
  const { data: tier, error: tierError } = await query.maybeSingle();
  if (tierError) throw tierError;
  if (!tier) throw new Error('Plan actif introuvable');
  return tier;
}

async function loadModel(supabase: any, id: string | null | undefined) {
  if (!id) return null;
  const { data, error } = await supabase.from('ai_models').select('*')
    .eq('id', id).eq('provider', 'openrouter').eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function selectAiRoute(supabase: any, userId: string, request: AiRouteRequest): Promise<AiRoute> {
  if (![1, 2, 3].includes(request.complexity)) throw new Error('Complexité IA invalide');
  const tier = await resolveTier(supabase, userId, request.adminTier);

  const { data: policies, error: policyError } = await supabase.from('plan_ai_policies').select('*')
    .eq('tier_id', tier.id).eq('task_type', request.taskType).eq('enabled', true)
    .lte('complexity_min', request.complexity).gte('complexity_max', request.complexity)
    .order('priority', { ascending: true }).limit(1);

  const policy = !policyError && Array.isArray(policies) ? policies[0] : null;
  if (!policy) {
    const model = await loadModel(supabase, tier.ai_model_id);
    if (!model) throw new Error(`Aucun modèle IA actif configuré pour le plan ${tier.name}`);
    return {
      tier: tier.name, taskType: request.taskType, complexity: request.complexity,
      reasoningEffort: 'low', maxOutputTokens: 6000, models: [model],
    };
  }

  const primary = await loadModel(supabase, policy.primary_model_id);
  const fallback = await loadModel(supabase, policy.fallback_model_id);
  const models = [primary, fallback].filter(Boolean).filter((model, index, all) =>
    all.findIndex((candidate) => candidate.id === model.id) === index
  );
  if (!models.length) throw new Error(`Les modèles IA de la politique ${policy.id} sont indisponibles`);
  return {
    tier: tier.name, taskType: request.taskType, complexity: request.complexity,
    reasoningEffort: policy.reasoning_effort,
    maxOutputTokens: policy.max_output_tokens,
    models,
    policyId: policy.id,
  };
}
