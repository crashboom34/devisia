import { supabase } from './supabase';

export type FeatureKey =
  | 'auto_classification' | 'cost_engine_basic' | 'job_management'
  | 'team_management' | 'time_tracking' | 'purchase_tracking'
  | 'advanced_ai' | 'job_profitability' | 'historical_cost_learning';

export interface Entitlement { feature_key: FeatureKey; enabled: boolean; limits?: Record<string, unknown> }

export function hasEntitlement(entitlements: Entitlement[], feature: FeatureKey): boolean {
  return entitlements.some((item) => item.feature_key === feature && item.enabled);
}

export async function getUserEntitlements(userId: string): Promise<{ tier: string; entitlements: Entitlement[] }> {
  const { data: subscription, error: subscriptionError } = await supabase
    .from('user_subscriptions').select('tier_id').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (subscriptionError) throw subscriptionError;

  let tierQuery = supabase.from('subscription_tiers').select('id, name').eq('is_active', true);
  tierQuery = subscription?.tier_id ? tierQuery.eq('id', subscription.tier_id) : tierQuery.eq('name', 'starter');
  const { data: tier, error: tierError } = await tierQuery.maybeSingle();
  if (tierError) throw tierError;
  if (!tier) throw new Error('Plan actif introuvable');

  const { data, error } = await supabase.from('feature_entitlements')
    .select('feature_key, enabled, limits').eq('tier_id', tier.id);
  if (error) throw error;
  return { tier: tier.name, entitlements: (data || []) as Entitlement[] };
}

