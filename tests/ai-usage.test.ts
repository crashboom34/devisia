import { describe, expect, it } from 'vitest';
import { aiAttemptDurationMs, classifyAiUsageStatus, safeAiErrorMessage } from '../supabase/functions/_shared/ai-usage';

describe('AI usage observability', () => {
  it('classe les succès, limites et timeouts sans dépendre du corps fournisseur', () => {
    expect(classifyAiUsageStatus(200)).toBe('success');
    expect(classifyAiUsageStatus(429)).toBe('rate_limited');
    expect(classifyAiUsageStatus(500)).toBe('error');
    expect(classifyAiUsageStatus(undefined, true)).toBe('timeout');
  });

  it('produit une durée non négative et un message sans donnée sensible', () => {
    expect(aiAttemptDurationMs(100, 145)).toBe(45);
    expect(aiAttemptDurationMs(145, 100)).toBe(0);
    expect(safeAiErrorMessage('error', 502)).toBe('AI provider returned HTTP 502');
    expect(safeAiErrorMessage('success')).toBeNull();
  });
});
