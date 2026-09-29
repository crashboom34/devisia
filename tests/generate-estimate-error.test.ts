import { describe, expect, it } from 'vitest';
import { toSafeGenerateEstimateError } from '../supabase/functions/_shared/generate-estimate-error';

describe('generate-estimate public errors', () => {
  it('conserve les erreurs utilisateur actionnables', () => {
    expect(toSafeGenerateEstimateError(new Error('Limite mensuelle atteinte (10/10 devis).'))).toEqual({
      status: 429,
      publicMessage: 'Limite mensuelle atteinte (10/10 devis).',
      logMessage: 'Monthly estimate limit reached',
    });
  });

  it('masque les détails internes de base de données', () => {
    const result = toSafeGenerateEstimateError(new Error('Failed to save estimate: relation private.secret does not exist'));

    expect(result).toEqual({
      status: 500,
      publicMessage: 'Génération momentanément indisponible.',
      logMessage: 'Internal generate-estimate error',
    });
    expect(JSON.stringify(result)).not.toContain('private.secret');
  });
});
