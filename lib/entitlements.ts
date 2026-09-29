import { supabase } from './supabase';

export type FeatureKey =
  | 'auto_classification' | 'cost_engine_basic' | 'job_management'
  | 'team_management' | 'time_tracking' | 'purchase_tracking'
  | 'advanced_ai' | 'job_profitability' | 'historical_cost_learning';

export interface Entitlement { feature_key: FeatureKey; enabled: boolean; limits?: Record<string, unknown> }
export interface OrganizationEntitlementRow {
  tier: string;
  feature_key: FeatureKey;
  enabled: boolean;
  limits: Record<string, unknown> | null;
}

export function hasEntitlement(entitlements: Entitlement[], feature: FeatureKey): boolean {
  return entitlements.some((item) => item.feature_key === feature && item.enabled);
}

export function parseOrganizationEntitlements(
  rows: OrganizationEntitlementRow[],
): { tier: string; entitlements: Entitlement[] } {
  if (rows.length === 0) throw new Error("Droits de l'organisation introuvables");
  const tiers = new Set(rows.map((row) => row.tier));
  if (tiers.size !== 1) throw new Error("Réponse de plan incohérente");
  return {
    tier: rows[0].tier,
    entitlements: rows.map(({ feature_key, enabled, limits }) => ({
      feature_key,
      enabled,
      limits: limits ?? undefined,
    })),
  };
}

export async function getOrganizationEntitlements(
  organizationId: string,
): Promise<{ tier: string; entitlements: Entitlement[] }> {
  const { data, error } = await supabase.rpc('get_organization_entitlements', {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  return parseOrganizationEntitlements((data || []) as OrganizationEntitlementRow[]);
}
