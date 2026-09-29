import { describe, expect, it } from 'vitest';
import { calculateJobIntelligence } from '../lib/job-intelligence';

const planned = [
  { category: 'material' as const, quantity: 1, unitCostCents: 400_000 },
  { category: 'labor' as const, plannedMinutes: 6000, hourlyCostCents: 3000 },
];

describe('job intelligence', () => {
  it('applique uniquement les avenants acceptés sans altérer le budget initial', () => {
    const result = calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned,
      actual: [{ category: 'material', amountHtCents: 450_000 }],
      time: [{ minutes: 3000, hourlyCostCentsSnapshot: 3000 }],
      changeOrders: [
        { status: 'approved', soldDeltaCents: 200_000, plannedCostDeltaCents: 50_000, category: 'material' },
        { status: 'draft', soldDeltaCents: 100_000, plannedCostDeltaCents: 20_000, category: 'labor' },
        { status: 'rejected', soldDeltaCents: 80_000, plannedCostDeltaCents: 10_000, category: 'other' },
      ],
      progressPercent: 50,
    });

    expect(result.initialSoldCents).toBe(1_000_000);
    expect(result.initialPlannedCostCents).toBe(700_000);
    expect(result.soldCents).toBe(1_200_000);
    expect(result.plannedCostCents).toBe(750_000);
    expect(result.approvedChangeOrderCount).toBe(1);
    expect(result.approvedSoldDeltaCents).toBe(200_000);
    expect(result.approvedBudgetDeltaCents).toBe(50_000);
    expect(result.byCategory.material.plannedCents).toBe(450_000);
  });

  it('projette la marge finale et son écart avec la marge prévue révisée', () => {
    const result = calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned,
      actual: [{ category: 'material', amountHtCents: 450_000 }],
      time: [{ minutes: 3000, hourlyCostCentsSnapshot: 3000 }],
      changeOrders: [
        { status: 'approved', soldDeltaCents: 200_000, plannedCostDeltaCents: 50_000, category: 'material' },
      ],
      progressPercent: 50,
    });

    expect(result.actualCostCents).toBe(600_000);
    expect(result.forecastCostCents).toBe(1_200_000);
    expect(result.projectedMarginCents).toBe(0);
    expect(result.plannedMarginCents).toBe(450_000);
    expect(result.projectedMarginVarianceCents).toBe(-450_000);
    expect(result.byCategory.material.varianceCents).toBe(0);
    expect(result.byCategory.labor.varianceCents).toBe(-150_000);
  });

  it('accepte un avenant de réduction tant que les totaux restent positifs', () => {
    const result = calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned,
      actual: [],
      time: [],
      changeOrders: [
        { status: 'approved', soldDeltaCents: -100_000, plannedCostDeltaCents: -50_000, category: 'material' },
      ],
      progressPercent: 0,
    });

    expect(result.soldCents).toBe(900_000);
    expect(result.plannedCostCents).toBe(650_000);
    expect(result.forecastCostCents).toBeNull();
    expect(result.projectedMarginCents).toBeNull();
  });

  it('regroupe transport et consommables dans le poste budgétaire autres', () => {
    const result = calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned: [{ category: 'other', otherCostCents: 100_000 }],
      actual: [
        { category: 'transport', amountHtCents: 20_000 },
        { category: 'consumable', amountHtCents: 5_000 },
      ],
      time: [],
      changeOrders: [
        { status: 'approved', soldDeltaCents: 30_000, plannedCostDeltaCents: 10_000, category: 'transport' },
      ],
      progressPercent: 50,
    });

    expect(result.byCategory.other.plannedCents).toBe(110_000);
    expect(result.byCategory.other.actualCents).toBe(25_000);
    expect(result.byCategory.other.varianceCents).toBe(-85_000);
    expect(result.byCategory.transport.actualCents).toBe(0);
    expect(result.byCategory.consumable.actualCents).toBe(0);
    expect(result.plannedCostCents).toBe(110_000);
    expect(result.actualCostCents).toBe(25_000);
  });

  it('refuse un avenant qui rend un budget ou un vendu négatif', () => {
    expect(() => calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned,
      actual: [],
      time: [],
      changeOrders: [
        { status: 'approved', soldDeltaCents: 0, plannedCostDeltaCents: -500_000, category: 'material' },
      ],
      progressPercent: 25,
    })).toThrow(/budget révisé/i);

    expect(() => calculateJobIntelligence({
      initialSoldCents: 1_000_000,
      planned,
      actual: [],
      time: [],
      changeOrders: [
        { status: 'approved', soldDeltaCents: -1_100_000, plannedCostDeltaCents: 0, category: 'other' },
      ],
      progressPercent: 25,
    })).toThrow(/vendu révisé/i);
  });

  it('ne produit aucun NaN ou Infinity', () => {
    const result = calculateJobIntelligence({
      initialSoldCents: 0,
      planned: [],
      actual: [],
      time: [],
      changeOrders: [],
      progressPercent: Number.NaN,
    });

    expect(result.plannedMarginRate).toBeNull();
    expect(result.currentMarginRate).toBeNull();
    expect(result.forecastCostCents).toBeNull();
    expect(JSON.stringify(result)).not.toContain('NaN');
    expect(JSON.stringify(result)).not.toContain('Infinity');
  });
});
