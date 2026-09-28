import { describe, it, expect } from 'vitest';
import { CANONICAL_MAPPING, resolveTierModel, resolveTierModelLabel } from '../lib/tier-model';

type TestCase = { input: string; expectedModelId: string; expectedLabel: string };

const cases: TestCase[] = [
  {
    input: 'starter',
    expectedModelId: 'openai/gpt-4.1-mini',
    expectedLabel: 'GPT-4.1 Mini (OpenRouter)',
  },
  {
    input: 'business',
    expectedModelId: 'mistralai/mistral-large-2512',
    expectedLabel: 'Mistral Large 3 (OpenRouter)',
  },
  {
    input: 'pro',
    expectedModelId: 'openai/gpt-4.1',
    expectedLabel: 'GPT-4.1 (OpenRouter)',
  },
  {
    input: 'unlimited',
    expectedModelId: 'openai/gpt-4.1',
    expectedLabel: 'GPT-4.1 (OpenRouter)',
  },
  {
    input: 'PRO',
    expectedModelId: 'openai/gpt-4.1',
    expectedLabel: 'GPT-4.1 (OpenRouter)',
  },
  {
    input: 'Business',
    expectedModelId: 'mistralai/mistral-large-2512',
    expectedLabel: 'Mistral Large 3 (OpenRouter)',
  },
  {
    input: 'unknown',
    expectedModelId: 'openai/gpt-4.1-mini',
    expectedLabel: 'GPT-4.1 Mini (OpenRouter)',
  },
  {
    input: '',
    expectedModelId: 'openai/gpt-4.1-mini',
    expectedLabel: 'GPT-4.1 Mini (OpenRouter)',
  },
];

describe('resolveTierModel / resolveTierModelLabel', () => {
  it.each(cases)('resolves "$input" to $expectedModelId', ({ input, expectedModelId, expectedLabel }) => {
    expect(resolveTierModel(input)).toBe(expectedModelId);
    expect(resolveTierModelLabel(input)).toBe(expectedLabel);
  });

  it('keeps the canonical Starter and Pro mappings aligned with production', () => {
    expect(CANONICAL_MAPPING).toEqual(expect.arrayContaining([
      expect.objectContaining({ tier: 'starter', modelId: 'openai/gpt-4.1-mini' }),
      expect.objectContaining({ tier: 'pro', modelId: 'openai/gpt-4.1' }),
    ]));
  });
});
