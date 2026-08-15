import { describe, it, expect } from 'vitest';
import {
  roundCents,
  calculateLineAmounts,
  recalculateEstimateTotals,
  calculateMargin,
  calculateTotalMargin,
  formatCurrencyEUR,
  type EstimateCategory,
  type EstimateItem,
} from '../lib/pricing/engine';

function makeItem(overrides: Partial<EstimateItem> = {}): EstimateItem {
  return {
    poste: 'Test',
    description: 'Test item',
    quantity: 1,
    unit: 'u',
    unit_price_ht: 0,
    amount_ht: 0,
    tva_percent: 20,
    tva_amount: 0,
    amount_ttc: 0,
    ...overrides,
  };
}

function makeCategory(items: EstimateItem[], overrides: Partial<EstimateCategory> = {}): EstimateCategory {
  return {
    name: 'Catégorie',
    description: '',
    items,
    subtotal_ht: 0,
    subtotal_tva: 0,
    subtotal_ttc: 0,
    ...overrides,
  };
}

describe('roundCents', () => {
  it('rounds to the nearest cent', () => {
    expect(roundCents(19.999999999998)).toBe(20);
    expect(roundCents(10.005)).toBe(10.01);
    expect(roundCents(10.004)).toBe(10);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundCents(-0), -0)).toBe(false);
    expect(roundCents(0)).toBe(0);
  });
});

describe('calculateLineAmounts', () => {
  it('computes HT/TVA/TTC for a simple line at 20%', () => {
    const result = calculateLineAmounts({ quantity: 2, unit_price_ht: 100, tva_percent: 20 });
    expect(result.amount_ht).toBe(200);
    expect(result.tva_amount).toBe(40);
    expect(result.amount_ttc).toBe(240);
  });

  it('supports the legal French VAT rates (0 / 5.5 / 10 / 20)', () => {
    expect(calculateLineAmounts({ quantity: 1, unit_price_ht: 100, tva_percent: 0 }).tva_amount).toBe(0);
    expect(calculateLineAmounts({ quantity: 1, unit_price_ht: 100, tva_percent: 5.5 }).tva_amount).toBe(5.5);
    expect(calculateLineAmounts({ quantity: 1, unit_price_ht: 100, tva_percent: 10 }).tva_amount).toBe(10);
    expect(calculateLineAmounts({ quantity: 1, unit_price_ht: 100, tva_percent: 20 }).tva_amount).toBe(20);
  });

  it('rounds fractional cent results instead of leaking float error', () => {
    // 3 * 0.1 famously isn't exactly 0.3 in floating point.
    const result = calculateLineAmounts({ quantity: 3, unit_price_ht: 0.1, tva_percent: 20 });
    expect(result.amount_ht).toBe(0.3);
  });

  it('handles a zero quantity line (should not throw, totals are zero)', () => {
    const result = calculateLineAmounts({ quantity: 0, unit_price_ht: 150, tva_percent: 20 });
    expect(result.amount_ht).toBe(0);
    expect(result.tva_amount).toBe(0);
    expect(result.amount_ttc).toBe(0);
  });
});

describe('recalculateEstimateTotals', () => {
  it('sums multiple items across multiple categories', () => {
    const categories = [
      makeCategory([
        makeItem({ quantity: 2, unit_price_ht: 50, tva_percent: 20 }), // 100 HT, 20 TVA
        makeItem({ quantity: 1, unit_price_ht: 30, tva_percent: 10 }), // 30 HT, 3 TVA
      ]),
      makeCategory([
        makeItem({ quantity: 5, unit_price_ht: 10, tva_percent: 5.5 }), // 50 HT, 2.75 TVA
      ]),
    ];

    const result = recalculateEstimateTotals(categories);

    expect(result.categories[0].subtotal_ht).toBe(130);
    expect(result.categories[0].subtotal_tva).toBe(23);
    expect(result.categories[0].subtotal_ttc).toBe(153);

    expect(result.categories[1].subtotal_ht).toBe(50);
    expect(result.categories[1].subtotal_tva).toBe(2.75);
    expect(result.categories[1].subtotal_ttc).toBe(52.75);

    expect(result.total_ht).toBe(180);
    expect(result.total_tva).toBe(25.75);
    expect(result.total_ttc).toBe(205.75);
  });

  it('returns zeroed totals for an empty category list', () => {
    const result = recalculateEstimateTotals([]);
    expect(result.categories).toEqual([]);
    expect(result.total_ht).toBe(0);
    expect(result.total_tva).toBe(0);
    expect(result.total_ttc).toBe(0);
  });

  it('handles a category with no items', () => {
    const result = recalculateEstimateTotals([makeCategory([])]);
    expect(result.categories[0].subtotal_ht).toBe(0);
    expect(result.total_ht).toBe(0);
  });

  it('does not mutate the input categories', () => {
    const original = makeCategory([makeItem({ quantity: 2, unit_price_ht: 10, tva_percent: 20 })]);
    const originalItemRef = original.items[0];
    recalculateEstimateTotals([original]);
    expect(original.items[0]).toBe(originalItemRef);
    expect(original.subtotal_ht).toBe(0); // untouched
  });

  it('is stable across many small lines (no cumulative float drift)', () => {
    const items = Array.from({ length: 37 }, () => makeItem({ quantity: 1, unit_price_ht: 33.33, tva_percent: 20 }));
    const result = recalculateEstimateTotals([makeCategory(items)]);
    // 37 * 33.33 = 1233.21 exactly; every intermediate step is rounded to
    // the cent so this must land exactly, not 1233.2099999999996.
    expect(result.total_ht).toBe(1233.21);
  });
});

describe('calculateMargin', () => {
  it('computes margin € and % when cost and sell price are present', () => {
    const result = calculateMargin({ cost_price: 70, sell_price: 100 });
    expect(result).not.toBeNull();
    expect(result!.margin).toBe(30);
    expect(result!.marginPercent).toBeCloseTo(30, 5);
  });

  it('returns null when cost_price is missing', () => {
    expect(calculateMargin({ sell_price: 100 })).toBeNull();
  });

  it('returns null when sell_price is missing', () => {
    expect(calculateMargin({ cost_price: 70 })).toBeNull();
  });

  it('returns null when both are missing', () => {
    expect(calculateMargin({})).toBeNull();
  });
});

describe('calculateTotalMargin', () => {
  it('aggregates margin only across items that carry cost/sell data', () => {
    const categories = [
      makeCategory([
        makeItem({ cost_price: 60, sell_price: 100 }),
        makeItem({ cost_price: 40, sell_price: 50 }),
        makeItem(), // no cost/sell data — must be ignored, not treated as zero margin
      ]),
    ];

    const result = calculateTotalMargin(categories);
    expect(result).not.toBeNull();
    expect(result!.margin).toBe(50); // (100-60) + (50-40)
    expect(result!.marginPercent).toBeCloseTo((50 / 150) * 100, 5);
  });

  it('returns null when no item anywhere has cost/sell data', () => {
    const categories = [makeCategory([makeItem(), makeItem()])];
    expect(calculateTotalMargin(categories)).toBeNull();
  });

  it('returns null for an empty estimate', () => {
    expect(calculateTotalMargin([])).toBeNull();
  });
});

describe('formatCurrencyEUR', () => {
  it('formats using French locale conventions (comma decimal, EUR suffix)', () => {
    const formatted = formatCurrencyEUR(1234.5);
    expect(formatted).toContain('234,50');
    expect(formatted).toContain('\u20ac');
  });

  it('formats zero and negative amounts without throwing', () => {
    expect(() => formatCurrencyEUR(0)).not.toThrow();
    expect(() => formatCurrencyEUR(-50)).not.toThrow();
  });
});
