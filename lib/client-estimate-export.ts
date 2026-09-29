import type { EstimateCategory } from './pricing/engine';

export interface ClientEstimateExportSource {
  estimateNumber?: string;
  projectTitle?: string;
  clientName?: string;
  estimateDate?: string;
  validityDays?: number;
  paymentTerms?: string;
  executionDelay?: string;
  depositRequired?: number;
  specialConditions?: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  discountAmount?: number;
  categories: EstimateCategory[];
}

export function buildClientEstimateExport(source: ClientEstimateExportSource) {
  return {
    estimateNumber: source.estimateNumber,
    projectTitle: source.projectTitle,
    clientName: source.clientName,
    estimateDate: source.estimateDate,
    validityDays: source.validityDays,
    paymentTerms: source.paymentTerms,
    executionDelay: source.executionDelay,
    depositRequired: source.depositRequired,
    specialConditions: source.specialConditions,
    totalHt: source.totalHt,
    totalTva: source.totalTva,
    totalTtc: source.totalTtc,
    discountAmount: source.discountAmount,
    categories: source.categories.map((category) => ({
      name: category.name,
      description: category.description,
      subtotalHt: category.subtotal_ht,
      subtotalTva: category.subtotal_tva,
      subtotalTtc: category.subtotal_ttc,
      items: category.items.map((item) => ({
        poste: item.poste,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceHt: item.unit_price_ht,
        amountHt: item.amount_ht,
        vatPercent: item.tva_percent,
        vatAmount: item.tva_amount,
        amountTtc: item.amount_ttc,
      })),
    })),
  };
}
