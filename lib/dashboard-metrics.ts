import { estimateTtcAfterDiscount } from './manual-estimate';

export interface DashboardEstimateRow {
  quote_status?: string | null;
  total_ttc?: number | null;
  discount_amount?: number | null;
}

export interface DashboardEstimateMetrics {
  total: number;
  drafts: number;
  accepted: number;
  acceptedValueCents: number;
}

function eurosToCents(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function calculateDashboardEstimateMetrics(
  estimates: DashboardEstimateRow[],
): DashboardEstimateMetrics {
  return estimates.reduce<DashboardEstimateMetrics>(
    (metrics, estimate) => {
      metrics.total += 1;
      if (estimate.quote_status === 'draft') metrics.drafts += 1;
      if (estimate.quote_status === 'accepted') {
        metrics.accepted += 1;
        metrics.acceptedValueCents += eurosToCents(estimateTtcAfterDiscount(estimate));
      }
      return metrics;
    },
    { total: 0, drafts: 0, accepted: 0, acceptedValueCents: 0 },
  );
}
