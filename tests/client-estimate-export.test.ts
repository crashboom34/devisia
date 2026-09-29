import { describe, expect, it } from 'vitest';
import { buildClientEstimateExport } from '../lib/client-estimate-export';

describe('client estimate export', () => {
  it('conserve les données commerciales et supprime tous les coûts internes', () => {
    const exported = buildClientEstimateExport({
      estimateNumber: 'DEV-2026-001',
      projectTitle: 'Terrasse Dupont',
      clientName: 'Client QA',
      estimateDate: '2026-09-29',
      validityDays: 30,
      paymentTerms: '30 % à la commande',
      executionDelay: '4 semaines',
      depositRequired: 30,
      specialConditions: 'Sous réserve du support',
      totalHt: 1_000,
      totalTva: 200,
      totalTtc: 1_200,
      discountAmount: 0,
      categories: [{
        name: 'Terrasse',
        description: 'Travaux extérieurs',
        subtotal_ht: 1_000,
        subtotal_tva: 200,
        subtotal_ttc: 1_200,
        items: [{
          poste: 'Pose travertin', description: 'Fourniture et pose', quantity: 10, unit: 'm²',
          unit_price_ht: 100, amount_ht: 1_000, tva_percent: 20, tva_amount: 200, amount_ttc: 1_200,
          materials_cost: 320, labor_cost: 250, cost_price: 570, sell_price: 1_000,
        }],
      }],
    });

    expect(exported.categories[0].items[0]).toEqual({
      poste: 'Pose travertin', description: 'Fourniture et pose', quantity: 10, unit: 'm²',
      unitPriceHt: 100, amountHt: 1_000, vatPercent: 20, vatAmount: 200, amountTtc: 1_200,
    });
    expect(JSON.stringify(exported)).not.toMatch(/materials_cost|labor_cost|cost_price|sell_price/i);
  });
});
