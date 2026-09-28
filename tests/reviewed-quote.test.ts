import { describe, expect, it } from 'vitest';
import { calculateReviewedQuote } from '../supabase/functions/_shared/estimate-totals';

const categories = [
  { name: 'Structure', items: [{ poste: 'Poteaux', quantity: 6, unit: 'u', unit_price_ht: 1050 }] },
  { name: 'Finitions', items: [{ poste: 'Carrelage', quantity: 25, unit: 'm²', unit_price_ht: 110 }] },
];

describe('reviewed quote totals', () => {
  it('uses only chosen VAT rates and recalculates each line in cents', () => {
    const result = calculateReviewedQuote(categories, [20, 10]);
    expect(result.totalHT).toBe(9050);
    expect(result.totalTVA).toBe(1535);
    expect(result.totalTTC).toBe(10585);
    expect(result.lineItems.map(item => item.tva_percent)).toEqual([20, 10]);
    expect(result.categories.map(category => category.subtotal_ttc)).toEqual([7560, 3025]);
  });

  it('rejects missing VAT selection and invalid rates', () => {
    expect(() => calculateReviewedQuote(categories, [20])).toThrow();
    expect(() => calculateReviewedQuote(categories, [20, 7])).toThrow();
    expect(() => calculateReviewedQuote(categories, ['20', 10])).toThrow();
  });

  it('ignores model supplied totals and rejects nonfinite quantities', () => {
    const result = calculateReviewedQuote([{ name: 'Lot', items: [{ poste: 'Travaux', quantity: 1, unit_price_ht: 100, amount_ht: 1, tva_amount: 999 }] }], [5.5]);
    expect(result.totalTTC).toBe(105.5);
    expect(() => calculateReviewedQuote([{ name: 'Lot', items: [{ quantity: 'Infinity', unit_price_ht: 100 }] }], [20])).toThrow();
  });
});
