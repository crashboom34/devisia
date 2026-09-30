import { describe, expect, it } from 'vitest';
import { getPlanSwitchError, isSuccessfulPlanSwitch } from '../lib/admin-plan';

describe('admin plan switch result', () => {
  it('accepts only an explicit success response', () => {
    expect(isSuccessfulPlanSwitch({ success: true, tier_name: 'pro' })).toBe(true);
    expect(isSuccessfulPlanSwitch({ success: false })).toBe(false);
    expect(isSuccessfulPlanSwitch(null)).toBe(false);
    expect(isSuccessfulPlanSwitch(undefined)).toBe(false);
  });

  it('keeps the server error when it is safe to show to an administrator', () => {
    expect(getPlanSwitchError({ success: false, error: 'Tier not found' })).toBe('Tier not found');
  });

  it('uses a neutral fallback for malformed responses', () => {
    expect(getPlanSwitchError({})).toBe('Le changement de formule n\'a pas été enregistré.');
  });
});
