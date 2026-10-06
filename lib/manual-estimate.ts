import { recalculateEstimateTotals, roundCents, type EstimateCategory } from './pricing/engine';

export interface EditableTotals {
  categories: EstimateCategory[];
  discount_percent?: number;
  discount_amount?: number;
}

export function recalculateManualEstimate<T extends EditableTotals>(current: T, categories: EstimateCategory[]): T & ReturnType<typeof recalculateEstimateTotals> & { discount_amount: number } {
  const totals = recalculateEstimateTotals(categories);
  const discountPercent = current.discount_percent ?? 0;
  return { ...current, ...totals, discount_amount: discountPercent > 0 ? roundCents(totals.total_ttc * discountPercent / 100) : (current.discount_amount ?? 0) };
}

export function isValidManualEstimate(estimate: EditableTotals & { deposit_required?: number }): boolean {
  const discount = estimate.discount_percent ?? 0;
  const deposit = estimate.deposit_required ?? 0;
  const linesValid = Number.isFinite(discount) && discount >= 0 && discount <= 100
    && Number.isFinite(deposit) && deposit >= 0 && deposit <= 100
    && estimate.categories.length > 0
    && estimate.categories.every((category) => category.name.trim() && category.items.length > 0
      && category.items.every((item) => item.poste.trim() && item.unit.trim()
        && [item.quantity, item.unit_price_ht, item.tva_percent].every(Number.isFinite)
        && item.quantity > 0 && item.unit_price_ht >= 0 && item.tva_percent >= 0 && item.tva_percent <= 100));
  if (!linesValid) return false;
  const total = recalculateEstimateTotals(estimate.categories).total_ttc;
  const discountAmount = discount > 0 ? roundCents(total * discount / 100) : (estimate.discount_amount ?? 0);
  return Number.isFinite(total) && total >= 0 && Number.isFinite(discountAmount)
    && discountAmount >= 0 && discountAmount <= total;
}
