import { describe, expect, it } from 'vitest';
import { hasEntitlement, type Entitlement } from '../lib/entitlements';

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
});
