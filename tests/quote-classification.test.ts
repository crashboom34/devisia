import { describe, expect, it } from 'vitest';
import { validateQuoteClassification } from '../supabase/functions/_shared/quote-classification';

describe('quote classification', () => {
  it('valide un chantier multi-lots structuré', () => {
    const result = validateQuoteClassification({
      projectType: 'Rénovation maison', trades: ['Démolition','Plomberie','Électricité','Peinture'],
      lots: ['Dépose','Réseaux','Courants forts','Finitions'], complexity: 3,
      detectedMeasurements: [{ label: 'Surface', value: 120, unit: 'm²' }],
      missingCriticalInputs: ['Plans des réseaux'], recommendedQuoteStructure: ['Installation','Dépose','Second œuvre','Finitions'],
      vatContext: 'renovation_over_2_years', confidence: 0.88,
    });
    expect(result.complexity).toBe(3);
    expect(result.trades).toHaveLength(4);
  });

  it.each([
    [{ projectType: '', complexity: 1, confidence: 1 }],
    [{ projectType: 'Maçonnerie', complexity: 4, confidence: 1 }],
    [{ projectType: 'Ambigu', complexity: 1, confidence: Number.NaN }],
  ])('refuse une classification incomplète ou ambiguë non typée', (value) => {
    expect(() => validateQuoteClassification(value)).toThrow();
  });
});

