import { describe, expect, it } from 'vitest';
import { estimateTtcAfterDiscount, isValidManualEstimate, recalculateManualEstimate, withStableCostLineKeys } from '../lib/manual-estimate';
import { roundCents, type EstimateCategory } from '../lib/pricing/engine';

const categories: EstimateCategory[] = [{
  name: 'Matériaux', description: '', subtotal_ht: 0, subtotal_tva: 0, subtotal_ttc: 0,
  items: [{ poste: 'Peinture', description: '', quantity: 2, unit: 'u', unit_price_ht: 25, amount_ht: 0, tva_percent: 20, tva_amount: 0, amount_ttc: 0 }],
}];

describe('manual estimate editing', () => {
  it('keeps an original internal-cost key when an earlier line is removed', () => {
    const withTwoItems: EstimateCategory[] = [{
      ...categories[0],
      items: [
        categories[0].items[0],
        { ...categories[0].items[0], poste: 'Pose' },
      ],
    }];
    const keyed = withStableCostLineKeys(withTwoItems);
    expect(keyed[0].items.map((item) => item.cost_line_key)).toEqual(['1-1', '1-2']);
    expect(keyed[0].items.slice(1)[0].cost_line_key).toBe('1-2');
    expect(withTwoItems[0].items[1].cost_line_key).toBeUndefined();
    expect(withStableCostLineKeys(keyed)[0].items[1].cost_line_key).toBe('1-2');
  });
  it('shows the payable TTC after a stored percentage or fixed discount', () => {
    expect(estimateTtcAfterDiscount({ total_ttc: 1188, discount_amount: 118.8 })).toBe(1069.2);
    expect(estimateTtcAfterDiscount({ total_ttc: 60, discount_amount: 5 })).toBe(55);
    expect(estimateTtcAfterDiscount({ total_ttc: 0, discount_amount: 0 })).toBe(0);
  });

  it('keeps a finite nonnegative display total for invalid legacy amounts', () => {
    expect(estimateTtcAfterDiscount({ total_ttc: Number.NaN, total_amount: 30, discount_amount: Number.POSITIVE_INFINITY })).toBe(30);
    expect(estimateTtcAfterDiscount({ total_ttc: 10, discount_amount: 20 })).toBe(0);
    expect(estimateTtcAfterDiscount({ total_ttc: Number.POSITIVE_INFINITY })).toBe(0);
  });
  it('rounds positive and negative half-cents consistently', () => {
    expect(roundCents(1.5 * 42.15)).toBe(63.23);
    expect(roundCents(-1.5 * 42.15)).toBe(-63.23);
    expect(roundCents(0)).toBe(0);
  });
  it('recalculates line, VAT, total and percentage discount without mutating the original', () => {
    const result = recalculateManualEstimate({ categories, discount_percent: 10 }, categories);
    expect(result.categories[0].items[0].amount_ht).toBe(50);
    expect(result.total_ttc).toBe(60);
    expect(result.discount_amount).toBe(6);
    expect(categories[0].items[0].amount_ht).toBe(0);
  });

  it('rejects blank lines, zero quantity and invalid VAT', () => {
    expect(isValidManualEstimate({ categories })).toBe(true);
    expect(isValidManualEstimate({ categories: [{ ...categories[0], items: [{ ...categories[0].items[0], poste: '' }] }] })).toBe(false);
    expect(isValidManualEstimate({ categories: [{ ...categories[0], items: [{ ...categories[0].items[0], quantity: 0 }] }] })).toBe(false);
    expect(isValidManualEstimate({ categories: [{ ...categories[0], items: [{ ...categories[0].items[0], tva_percent: 101 }] }] })).toBe(false);
  });

  it('preserves an existing fixed-amount discount when no percentage is set', () => {
    expect(recalculateManualEstimate({ categories, discount_percent: 0, discount_amount: 5 }, categories).discount_amount).toBe(5);
    expect(isValidManualEstimate({ categories, discount_percent: 0, discount_amount: 5, deposit_required: 30 })).toBe(true);
    expect(isValidManualEstimate({ categories, discount_percent: 0, discount_amount: 61 })).toBe(false);
    expect(isValidManualEstimate({ categories, discount_percent: 0, discount_amount: Number.NaN })).toBe(false);
    expect(isValidManualEstimate({ categories, discount_percent: 0, discount_amount: -1 })).toBe(false);
    expect(isValidManualEstimate({ categories, deposit_required: 101 })).toBe(false);
  });

  it('recalculates multiple categories and VAT rates to the cent', () => {
    const multiple = [...categories, {
      name: 'Main d’œuvre', description: '', subtotal_ht: 0, subtotal_tva: 0, subtotal_ttc: 0,
      items: [{ poste: 'Pose', description: '', quantity: 1.5, unit: 'h', unit_price_ht: 42.15, amount_ht: 0, tva_percent: 10, tva_amount: 0, amount_ttc: 0 }],
    }];
    const result = recalculateManualEstimate({ categories: multiple, discount_percent: 10, deposit_required: 30 }, multiple);
    expect(result.categories[0].subtotal_ht).toBe(50);
    expect(result.categories[1].subtotal_ht).toBe(63.23);
    expect(result.total_ht).toBe(113.23);
    expect(result.total_tva).toBe(16.32);
    expect(result.total_ttc).toBe(129.55);
    expect(result.discount_amount).toBe(12.96);
    expect(isValidManualEstimate(result)).toBe(true);
  });
});
