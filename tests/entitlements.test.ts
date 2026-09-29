import { describe, expect, it } from 'vitest';
import {
  hasEntitlement,
  parseOrganizationEntitlements,
  type Entitlement,
} from '../lib/entitlements';

const starter: Entitlement[] = [
  { feature_key: 'cost_engine_basic', enabled: true },
  { feature_key: 'team_management', enabled: false },
];

describe('entitlements', () => {
  it('autorise une fonction active et refuse une fonction désactivée ou absente', () => {
    expect(hasEntitlement(starter, 'cost_engine_basic')).toBe(true);
    expect(hasEntitlement(starter, 'team_management')).toBe(false);
    expect(hasEntitlement(starter, 'job_profitability')).toBe(false);
  });

  it("utilise le plan de l'organisation plutôt que celui du membre connecté", () => {
    expect(parseOrganizationEntitlements([
      { tier: 'pro', feature_key: 'team_management', enabled: true, limits: null },
      { tier: 'pro', feature_key: 'job_management', enabled: true, limits: { active_jobs: 50 } },
    ])).toEqual({
      tier: 'pro',
      entitlements: [
        { feature_key: 'team_management', enabled: true, limits: undefined },
        { feature_key: 'job_management', enabled: true, limits: { active_jobs: 50 } },
      ],
    });
  });

  it("refuse une réponse vide ou incohérente de l'organisation", () => {
    expect(() => parseOrganizationEntitlements([])).toThrow(/organisation/i);
    expect(() => parseOrganizationEntitlements([
      { tier: 'starter', feature_key: 'cost_engine_basic', enabled: true, limits: null },
      { tier: 'pro', feature_key: 'job_management', enabled: true, limits: null },
    ])).toThrow(/plan/i);
  });
});
