import {
  calculateJobProfitability,
  estimatedCostAtCompletion,
  type ActualCostLine,
  type CostCategory,
  type JobProfitability,
  type PlannedCostLine,
  type TimeCostLine,
} from './job-costing';
import type { MoneyCents } from './money';

export type ChangeOrderStatus = 'draft' | 'approved' | 'rejected';

export interface JobChangeOrderFinancials {
  status: ChangeOrderStatus;
  soldDeltaCents: MoneyCents;
  plannedCostDeltaCents: MoneyCents;
  category: CostCategory;
}

export interface JobIntelligence extends JobProfitability {
  initialSoldCents: MoneyCents;
  initialPlannedCostCents: MoneyCents;
  approvedChangeOrderCount: number;
  approvedSoldDeltaCents: MoneyCents;
  approvedBudgetDeltaCents: MoneyCents;
  forecastCostCents: MoneyCents | null;
  projectedMarginCents: MoneyCents | null;
  projectedMarginVarianceCents: MoneyCents | null;
}

const categories: CostCategory[] = [
  'material',
  'labor',
  'subcontract',
  'equipment',
  'transport',
  'consumable',
  'other',
];

function budgetCategory(category: CostCategory): CostCategory {
  return category === 'transport' || category === 'consumable' ? 'other' : category;
}

function safeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} invalide`);
  return value;
}

function marginRate(soldCents: number, marginCents: number): number | null {
  if (soldCents === 0) return null;
  return (marginCents / soldCents) * 100;
}

export function calculateJobIntelligence({
  initialSoldCents,
  planned,
  actual,
  time,
  changeOrders,
  progressPercent,
}: {
  initialSoldCents: MoneyCents;
  planned: PlannedCostLine[];
  actual: ActualCostLine[];
  time: TimeCostLine[];
  changeOrders: JobChangeOrderFinancials[];
  progressPercent: number;
}): JobIntelligence {
  const initial = calculateJobProfitability(initialSoldCents, planned, actual, time);
  const byCategory = Object.fromEntries(categories.map((category) => [
    category,
    { ...initial.byCategory[category] },
  ])) as JobProfitability['byCategory'];
  // The immutable quote budget stores transport, consumables and miscellaneous
  // costs in one "other" bucket. Keep live variance and persisted snapshots on
  // that same accounting basis.
  for (const category of ['transport', 'consumable'] as const) {
    byCategory.other.actualCents = safeInteger(
      byCategory.other.actualCents + byCategory[category].actualCents,
      'Coûts réels autres',
    );
    byCategory[category].actualCents = 0;
  }

  let approvedChangeOrderCount = 0;
  let approvedSoldDeltaCents = 0;
  let approvedBudgetDeltaCents = 0;

  for (const changeOrder of changeOrders) {
    if (changeOrder.status !== 'approved') continue;
    const soldDelta = safeInteger(changeOrder.soldDeltaCents, 'Variation du vendu');
    const budgetDelta = safeInteger(changeOrder.plannedCostDeltaCents, 'Variation du budget');
    approvedChangeOrderCount += 1;
    approvedSoldDeltaCents = safeInteger(approvedSoldDeltaCents + soldDelta, 'Total des avenants');
    approvedBudgetDeltaCents = safeInteger(approvedBudgetDeltaCents + budgetDelta, 'Budget des avenants');
    const category = byCategory[budgetCategory(changeOrder.category)];
    category.plannedCents = safeInteger(category.plannedCents + budgetDelta, 'Budget révisé');
    if (category.plannedCents < 0) throw new Error('Le budget révisé d’une catégorie ne peut pas être négatif');
  }

  const soldCents = safeInteger(initialSoldCents + approvedSoldDeltaCents, 'Vendu révisé');
  if (soldCents < 0) throw new Error('Le vendu révisé ne peut pas être négatif');

  let plannedCostCents = 0;
  for (const category of categories) {
    const value = byCategory[category];
    value.varianceCents = safeInteger(value.actualCents - value.plannedCents, 'Écart de catégorie');
    plannedCostCents = safeInteger(plannedCostCents + value.plannedCents, 'Budget révisé');
  }
  if (plannedCostCents < 0) throw new Error('Le budget révisé ne peut pas être négatif');

  const plannedMarginCents = safeInteger(soldCents - plannedCostCents, 'Marge prévue');
  const currentMarginCents = safeInteger(soldCents - initial.actualCostCents, 'Marge actuelle');
  const forecastCostCents = estimatedCostAtCompletion(initial.actualCostCents, progressPercent);
  const projectedMarginCents = forecastCostCents === null
    ? null
    : safeInteger(soldCents - forecastCostCents, 'Marge projetée');
  const projectedMarginVarianceCents = projectedMarginCents === null
    ? null
    : safeInteger(projectedMarginCents - plannedMarginCents, 'Écart de marge projetée');

  return {
    ...initial,
    initialSoldCents,
    initialPlannedCostCents: initial.plannedCostCents,
    soldCents,
    plannedCostCents,
    plannedMarginCents,
    currentMarginCents,
    plannedMarginRate: marginRate(soldCents, plannedMarginCents),
    currentMarginRate: marginRate(soldCents, currentMarginCents),
    varianceCents: safeInteger(initial.actualCostCents - plannedCostCents, 'Écart global'),
    byCategory,
    approvedChangeOrderCount,
    approvedSoldDeltaCents,
    approvedBudgetDeltaCents,
    forecastCostCents,
    projectedMarginCents,
    projectedMarginVarianceCents,
  };
}
