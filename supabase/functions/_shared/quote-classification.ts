export type QuoteComplexity = 1 | 2 | 3;

export interface QuoteClassification {
  projectType: string;
  trades: string[];
  lots: string[];
  complexity: QuoteComplexity;
  detectedMeasurements: Array<{ label: string; value: number; unit: string }>;
  missingCriticalInputs: string[];
  recommendedQuoteStructure: string[];
  vatContext: 'new_build' | 'renovation_over_2_years' | 'mixed' | 'to_verify';
  confidence: number;
}

const cleanStrings = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, max).map((item) => item.trim().slice(0, 120))
  : [];

export function validateQuoteClassification(value: unknown): QuoteClassification {
  if (!value || typeof value !== 'object') throw new Error('Classification absente');
  const input = value as Record<string, unknown>;
  const projectType = typeof input.projectType === 'string' ? input.projectType.trim().slice(0, 120) : '';
  const complexity = Number(input.complexity);
  const confidence = Number(input.confidence);
  const vat = input.vatContext;
  if (!projectType || ![1, 2, 3].includes(complexity) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Classification invalide');
  }
  const detectedMeasurements = Array.isArray(input.detectedMeasurements)
    ? input.detectedMeasurements.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const measurement = item as Record<string, unknown>;
        const number = Number(measurement.value);
        if (typeof measurement.label !== 'string' || typeof measurement.unit !== 'string' || !Number.isFinite(number) || number < 0) return [];
        return [{ label: measurement.label.slice(0, 120), value: number, unit: measurement.unit.slice(0, 20) }];
      })
    : [];
  return {
    projectType,
    trades: cleanStrings(input.trades, 20),
    lots: cleanStrings(input.lots, 30),
    complexity: complexity as QuoteComplexity,
    detectedMeasurements,
    missingCriticalInputs: cleanStrings(input.missingCriticalInputs, 20),
    recommendedQuoteStructure: cleanStrings(input.recommendedQuoteStructure, 30),
    vatContext: vat === 'new_build' || vat === 'renovation_over_2_years' || vat === 'mixed' ? vat : 'to_verify',
    confidence,
  };
}

export const QUOTE_CLASSIFICATION_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'quote_classification', strict: true,
    schema: {
      type: 'object', additionalProperties: false,
      required: ['projectType','trades','lots','complexity','detectedMeasurements','missingCriticalInputs','recommendedQuoteStructure','vatContext','confidence'],
      properties: {
        projectType: { type: 'string' },
        trades: { type: 'array', items: { type: 'string' } },
        lots: { type: 'array', items: { type: 'string' } },
        complexity: { type: 'integer', enum: [1,2,3] },
        detectedMeasurements: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label','value','unit'], properties: { label: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' } } } },
        missingCriticalInputs: { type: 'array', items: { type: 'string' } },
        recommendedQuoteStructure: { type: 'array', items: { type: 'string' } },
        vatContext: { type: 'string', enum: ['new_build','renovation_over_2_years','mixed','to_verify'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
  },
} as const;

