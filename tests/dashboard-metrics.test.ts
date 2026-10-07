import { describe, expect, it } from 'vitest';
import { calculateDashboardEstimateMetrics } from '../lib/dashboard-metrics';

describe('calculateDashboardEstimateMetrics', () => {
  it('counts only explicitly accepted quotes as accepted', () => {
    expect(calculateDashboardEstimateMetrics([
      { quote_status: 'draft', total_ttc: 100 },
      { quote_status: 'sent', total_ttc: 200 },
      { quote_status: 'accepted', total_ttc: 300 },
    ])).toEqual({ total: 3, drafts: 1, accepted: 1, acceptedValueCents: 30_000 });
  });

  it('sums accepted amounts in cents without producing NaN', () => {
    const result = calculateDashboardEstimateMetrics([
      { quote_status: 'accepted', total_ttc: 10.01 },
      { quote_status: 'accepted', total_ttc: 0.2 },
      { quote_status: 'accepted', total_ttc: Number.NaN },
    ]);

    expect(result.acceptedValueCents).toBe(1_021);
    expect(Number.isFinite(result.acceptedValueCents)).toBe(true);
  });

  it('uses the payable amount after discounts for accepted quotes', () => {
    const result = calculateDashboardEstimateMetrics([
      { quote_status: 'accepted', total_ttc: 1188, discount_amount: 118.8 },
      { quote_status: 'accepted', total_ttc: 60, discount_amount: 5 },
      { quote_status: 'draft', total_ttc: 120, discount_amount: 20 },
    ]);
    expect(result.acceptedValueCents).toBe(112_420);
  });
});
