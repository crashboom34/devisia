import { describe, expect, it } from 'vitest';
import {
  PRELIMINARY_ESTIMATE_RESPONSE_FORMAT,
  shouldRetryWithoutStructuredOutput,
  validatePreliminary,
} from '@/supabase/functions/_shared/estimate-validation';

function validEstimate() {
  return {
    categories: [{
      name: 'Plomberie',
      description: 'Réseaux et équipements',
      items: [{
        poste: 'Douche à l’italienne',
        description: 'Fourniture et pose',
        quantity: 1,
        unit: 'forfait',
        unit_price_ht: 2500,
        materials_cost: 1200,
        labor_cost: 700,
      }],
    }],
    assumptions: ['Support prêt à carreler'],
  };
}

describe('validatePreliminary', () => {
  it('recalculates finite totals and preserves internal costs', () => {
    const result = validatePreliminary(validEstimate());

    expect(result.totalHT).toBe(2500);
    expect(result.categories[0].items[0]).toMatchObject({
      amount_ht: 2500,
      materials_cost: 1200,
      labor_cost: 700,
    });
    expect(Number.isFinite(result.totalHT)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('NaN');
    expect(JSON.stringify(result)).not.toContain('Infinity');
  });

  it.each([
    ['poste', { poste: '' }],
    ['quantity', { quantity: 0 }],
    ['quantity', { quantity: Number.POSITIVE_INFINITY }],
    ['unit_price_ht', { unit_price_ht: Number.NaN }],
    ['unit_price_ht', { unit_price_ht: '2500' }],
  ])('rejects an invalid %s field', (field, override) => {
    const estimate = validEstimate();
    Object.assign(estimate.categories[0].items[0], override);

    expect(() => validatePreliminary(estimate)).toThrow(`champ ${field}`);
  });

  it('rejects empty lots instead of silently accepting them', () => {
    const estimate = validEstimate();
    estimate.categories[0].items = [];

    expect(() => validatePreliminary(estimate)).toThrow('champ items');
  });

  it('requires every generated item field in the structured-output schema', () => {
    const itemSchema = PRELIMINARY_ESTIMATE_RESPONSE_FORMAT.json_schema.schema
      .properties.categories.items.properties.items.items;

    expect(itemSchema.required).toEqual([
      'poste',
      'description',
      'quantity',
      'unit',
      'unit_price_ht',
      'materials_cost',
      'labor_cost',
    ]);
    expect(itemSchema.additionalProperties).toBe(false);
  });
});

describe('shouldRetryWithoutStructuredOutput', () => {
  it('downgrades only refined 400/404 responses', () => {
    expect(shouldRetryWithoutStructuredOutput(400, true)).toBe(true);
    expect(shouldRetryWithoutStructuredOutput(404, true)).toBe(true);
    expect(shouldRetryWithoutStructuredOutput(429, true)).toBe(false);
    expect(shouldRetryWithoutStructuredOutput(404, false)).toBe(false);
  });
});
