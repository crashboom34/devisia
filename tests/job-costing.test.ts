import { describe, expect, it } from 'vitest';
import { calculateJobProfitability, estimatedCostAtCompletion, laborCostCents } from '../lib/job-costing';

describe('job costing', () => {
  it('agrège prévision et réel par catégorie', () => {
    const result = calculateJobProfitability(2_850_000, [
      { category: 'material', quantity: 1, unitCostCents: 820_000 },
      { category: 'labor', plannedMinutes: 14_000, hourlyCostCents: 2400 },
      { category: 'subcontract', otherCostCents: 150_000 },
      { category: 'equipment', otherCostCents: 90_000 },
      { category: 'other', otherCostCents: 30_000 },
    ], [
      { category: 'material', amountHtCents: 852_000 },
      { category: 'subcontract', amountHtCents: 160_000 },
    ], [{ minutes: 2400, hourlyCostCentsSnapshot: 2700 }]);

    expect(result.plannedCostCents).toBe(1_650_000);
    expect(result.plannedMarginCents).toBe(1_200_000);
    expect(result.actualCostCents).toBe(1_120_000);
    expect(result.byCategory.material.varianceCents).toBe(32_000);
    expect(result.plannedMarginRate).toBeCloseTo(42.105, 3);
  });

  it('snapshotte le coût horaire et répartit une journée', () => {
    expect(laborCostCents(180, 2400)).toBe(7200);
    expect(laborCostCents(240, 2400)).toBe(9600);
    expect(laborCostCents(420, 2400)).toBe(16800);
  });

  it('ne produit aucun pourcentage trompeur lorsque la vente vaut zéro', () => {
    const result = calculateJobProfitability(0, [], [], []);
    expect(result.plannedMarginRate).toBeNull();
    expect(result.currentMarginRate).toBeNull();
  });

  it('projette explicitement à partir de l’avancement', () => {
    expect(estimatedCostAtCompletion(1_485_000, 70)).toBe(2_121_429);
    expect(estimatedCostAtCompletion(1_485_000, 0)).toBeNull();
  });
});

