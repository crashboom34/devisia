/**
 * Deterministic pricing engine for quote/estimate line items, categories and
 * totals — HT / TVA / TTC / marge.
 *
 * Extracted from components/EstimateTable.tsx (Phase 0 audit finding: the
 * only place this math existed was inline inside a 610-line UI component,
 * duplicated with slightly different behavior in
 * supabase/functions/generate-estimate/index.ts, with no tests). This is the
 * single source of truth for the client-side recalculation used by the quote
 * editor; the Edge Function's validateAndRecalculate() performs the
 * equivalent computation server-side at generation time (Deno, a separate
 * runtime — see docs/architecture for the follow-up needed to share this
 * module across both instead of keeping them in parity by hand+tests).
 *
 * Money values are rounded to the cent at every step (not just at display
 * time) so stored/saved totals can't drift from floating-point rounding
 * error — the previous inline version in EstimateTable.tsx did not round,
 * which is fixed here.
 */

export interface EstimateItem {
  poste: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_ht: number;
  amount_ht: number;
  tva_percent: number;
  tva_amount: number;
  amount_ttc: number;
  materials_cost?: number;
  labor_cost?: number;
  cost_price?: number | null;
  sell_price?: number | null;
}

export interface EstimateCategory {
  name: string;
  description: string;
  items: EstimateItem[];
  subtotal_ht: number;
  subtotal_tva: number;
  subtotal_ttc: number;
}

export interface EstimateTotals {
  categories: EstimateCategory[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export interface Margin {
  margin: number;
  marginPercent: number;
}

function isFinitePrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Rounds a monetary amount to the nearest cent. Guards against -0. */
export function roundCents(amount: number): number {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Computes amount_ht / tva_amount / amount_ttc for a single line item from
 * its quantity, unit price and VAT rate. Does not mutate the input.
 */
export function calculateLineAmounts(
  item: Pick<EstimateItem, 'quantity' | 'unit_price_ht' | 'tva_percent'>
): Pick<EstimateItem, 'amount_ht' | 'tva_amount' | 'amount_ttc'> {
  const amountHt = roundCents(item.quantity * item.unit_price_ht);
  const tvaAmount = roundCents(amountHt * (item.tva_percent / 100));
  const amountTtc = roundCents(amountHt + tvaAmount);

  return {
    amount_ht: amountHt,
    tva_amount: tvaAmount,
    amount_ttc: amountTtc,
  };
}

/**
 * Recomputes every line item's amounts, every category's subtotals, and the
 * estimate's grand totals from quantity × unit price × VAT rate. This is the
 * only function that should ever be used to derive totals for display or for
 * persistence — never trust a total that wasn't produced by this function
 * (or its Edge Function equivalent) from the underlying line items.
 */
export function recalculateEstimateTotals(categories: EstimateCategory[]): EstimateTotals {
  let totalHt = 0;
  let totalTva = 0;
  let totalTtc = 0;

  const updatedCategories = categories.map((category) => {
    let catSubtotalHt = 0;
    let catSubtotalTva = 0;
    let catSubtotalTtc = 0;

    const updatedItems = category.items.map((item) => {
      const amounts = calculateLineAmounts(item);

      catSubtotalHt = roundCents(catSubtotalHt + amounts.amount_ht);
      catSubtotalTva = roundCents(catSubtotalTva + amounts.tva_amount);
      catSubtotalTtc = roundCents(catSubtotalTtc + amounts.amount_ttc);

      return {
        ...item,
        ...amounts,
      };
    });

    totalHt = roundCents(totalHt + catSubtotalHt);
    totalTva = roundCents(totalTva + catSubtotalTva);
    totalTtc = roundCents(totalTtc + catSubtotalTtc);

    return {
      ...category,
      items: updatedItems,
      subtotal_ht: catSubtotalHt,
      subtotal_tva: catSubtotalTva,
      subtotal_ttc: catSubtotalTtc,
    };
  });

  return {
    categories: updatedCategories,
    total_ht: totalHt,
    total_tva: totalTva,
    total_ttc: totalTtc,
  };
}

/**
 * Margin for a single line item when cost_price and sell_price are finite
 * numbers (zero is valid). A zero sell price has no meaningful percentage,
 * so it returns null rather than NaN, Infinity or a misleading percentage.
 * Missing/non-finite prices likewise return null.
 */
export function calculateMargin(item: Pick<EstimateItem, 'cost_price' | 'sell_price'>): Margin | null {
  if (!isFinitePrice(item.cost_price) || !isFinitePrice(item.sell_price) || item.sell_price === 0) return null;

  const margin = roundCents(item.sell_price - item.cost_price);
  const marginPercent = (margin / item.sell_price) * 100;
  if (!Number.isFinite(margin) || !Number.isFinite(marginPercent)) return null;

  return { margin, marginPercent };
}

/**
 * Aggregate margin across every line item in every category that carries
 * cost/sell data. Returns null when no item in the estimate has cost data
 * (nothing to compute from, not an error).
 */
export function calculateTotalMargin(categories: EstimateCategory[]): Margin | null {
  let totalCost = 0;
  let totalSell = 0;
  let pricedItemCount = 0;

  for (const category of categories) {
    for (const item of category.items) {
      if (isFinitePrice(item.cost_price) && isFinitePrice(item.sell_price)) {
        totalCost += item.cost_price;
        totalSell += item.sell_price;
        pricedItemCount += 1;
      }
    }
  }

  if (pricedItemCount === 0 || totalSell === 0 || !Number.isFinite(totalCost) || !Number.isFinite(totalSell)) {
    return null;
  }

  const margin = roundCents(totalSell - totalCost);
  const marginPercent = (margin / totalSell) * 100;
  if (!Number.isFinite(margin) || !Number.isFinite(marginPercent)) return null;

  return { margin, marginPercent };
}

/** Formats a monetary amount as French-locale EUR, e.g. "1 234,50 €". */
export function formatCurrencyEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
