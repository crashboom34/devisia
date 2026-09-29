import { multiplyCents, type MoneyCents } from './money';

export type CostCategory = 'material' | 'labor' | 'subcontract' | 'equipment' | 'transport' | 'consumable' | 'other';

export interface PlannedCostLine {
  category: CostCategory;
  quantity?: number;
  unitCostCents?: MoneyCents;
  plannedMinutes?: number;
  hourlyCostCents?: MoneyCents;
  otherCostCents?: MoneyCents;
}
export interface ActualCostLine {
  category: Exclude<CostCategory, 'labor'>;
  amountHtCents: MoneyCents;
}

export interface TimeCostLine {
  minutes: number;
  hourlyCostCentsSnapshot: MoneyCents;
}

export interface JobProfitability {
  soldCents: MoneyCents;
  plannedCostCents: MoneyCents;
  actualCostCents: MoneyCents;
  plannedMarginCents: MoneyCents;
  currentMarginCents: MoneyCents;
  plannedMarginRate: number | null;
  currentMarginRate: number | null;
  varianceCents: MoneyCents;
  byCategory: Record<CostCategory, { plannedCents: MoneyCents; actualCents: MoneyCents; varianceCents: MoneyCents }>;
}

const categories: CostCategory[] = ['material', 'labor', 'subcontract', 'equipment', 'transport', 'consumable', 'other'];

function validCents(value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Coût invalide');
  return value;
}

function safeResult(value: number): MoneyCents {
  if (!Number.isSafeInteger(value)) throw new Error('Le résultat doit être un entier sûr');
  return value;
}

export function laborCostCents(minutes: number, hourlyCostCents: MoneyCents): MoneyCents {
  // This helper also prices an entire planned job, so its duration can exceed
  // one day. The database keeps the 24-hour limit on each daily time entry.
  if (!Number.isSafeInteger(minutes) || minutes < 0) throw new Error('Durée invalide');
  const cents = validCents(hourlyCostCents);
  const rounded = (BigInt(minutes) * BigInt(cents) + BigInt(30)) / BigInt(60);
  return safeResult(Number(rounded));
}

export function resolveHourlyCostSnapshot(
  existingHourlyCostCents: MoneyCents | null | undefined,
  currentHourlyCostCents: MoneyCents,
): MoneyCents {
  if (existingHourlyCostCents !== null && existingHourlyCostCents !== undefined) {
    return validCents(existingHourlyCostCents);
  }
  return validCents(currentHourlyCostCents);
}

export function prepareTimeEntryWrite(
  existing: { id: string; hourlyCostCentsSnapshot: MoneyCents } | null | undefined,
  currentHourlyCostCents: MoneyCents,
): { existingId: string | null; hourlyCostCentsSnapshot: MoneyCents } {
  return {
    existingId: existing?.id ?? null,
    hourlyCostCentsSnapshot: resolveHourlyCostSnapshot(
      existing?.hourlyCostCentsSnapshot,
      currentHourlyCostCents,
    ),
  };
}

export function validateDailyMinutes(existingMinutes: number, nextMinutes: number): number {
  if (!Number.isSafeInteger(existingMinutes) || existingMinutes < 0 || existingMinutes > 1440) {
    throw new Error('Durée existante invalide');
  }
  if (!Number.isSafeInteger(nextMinutes) || nextMinutes < 1 || nextMinutes > 1440) {
    throw new Error('Durée saisie invalide');
  }
  const total = existingMinutes + nextMinutes;
  if (total > 1440) throw new Error('Une journée ne peut pas dépasser 24 heures');
  return total;
}

export function plannedLineCostCents(line: PlannedCostLine): MoneyCents {
  if (line.category === 'material') return multiplyCents(validCents(line.unitCostCents), line.quantity ?? 1);
  if (line.category === 'labor') return laborCostCents(line.plannedMinutes ?? 0, validCents(line.hourlyCostCents));
  return validCents(line.otherCostCents);
}

function marginRate(soldCents: number, marginCents: number): number | null {
  if (soldCents === 0) return null;
  return (marginCents / soldCents) * 100;
}

export function calculateJobProfitability(
  soldCents: MoneyCents,
  planned: PlannedCostLine[],
  actual: ActualCostLine[],
  time: TimeCostLine[],
): JobProfitability {
  validCents(soldCents);
  const byCategory = Object.fromEntries(categories.map((category) => [category, { plannedCents: 0, actualCents: 0, varianceCents: 0 }])) as JobProfitability['byCategory'];

  for (const line of planned) {
    const category = byCategory[line.category];
    category.plannedCents = safeResult(category.plannedCents + plannedLineCostCents(line));
  }
  for (const line of actual) {
    const category = byCategory[line.category];
    category.actualCents = safeResult(category.actualCents + validCents(line.amountHtCents));
  }
  for (const entry of time) {
    byCategory.labor.actualCents = safeResult(
      byCategory.labor.actualCents + laborCostCents(entry.minutes, entry.hourlyCostCentsSnapshot),
    );
  }

  let plannedCostCents = 0;
  let actualCostCents = 0;
  for (const category of categories) {
    const value = byCategory[category];
    value.varianceCents = safeResult(value.actualCents - value.plannedCents);
    plannedCostCents = safeResult(plannedCostCents + value.plannedCents);
    actualCostCents = safeResult(actualCostCents + value.actualCents);
  }
  const plannedMarginCents = safeResult(soldCents - plannedCostCents);
  const currentMarginCents = safeResult(soldCents - actualCostCents);
  return {
    soldCents, plannedCostCents, actualCostCents,
    plannedMarginCents, currentMarginCents,
    plannedMarginRate: marginRate(soldCents, plannedMarginCents),
    currentMarginRate: marginRate(soldCents, currentMarginCents),
    varianceCents: safeResult(actualCostCents - plannedCostCents),
    byCategory,
  };
}

export function estimatedCostAtCompletion(actualCostCents: MoneyCents, progressPercent: number): MoneyCents | null {
  validCents(actualCostCents);
  if (!Number.isFinite(progressPercent) || progressPercent <= 0 || progressPercent > 100) return null;
  return safeResult(Math.round(actualCostCents / (progressPercent / 100)));
}
