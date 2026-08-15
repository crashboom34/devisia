import { describe, it, expect } from 'vitest';
import { resolveTierModel, resolveTierModelLabel } from '../lib/tier-model';

type TestCase = { input: string; expectedModelId: string; expectedLabel: string };

const cases: TestCase[] = [
  {
    input: 'starter',
    expectedModelId: 'mistralai/mistral-large-2512',
    expectedLabel: 'Mistral Large 3 (OpenRouter)',
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
    expectedModelId: 'mistralai/mistral-large-2512',
    expectedLabel: 'Mistral Large 3 (OpenRouter)',
  },
  {
    input: '',
    expectedModelId: 'mistralai/mistral-large-2512',
    expectedLabel: 'Mistral Large 3 (OpenRouter)',
  },
];

describe('resolveTierModel / resolveTierModelLabel', () => {
  it.each(cases)('resolves "$input" to $expectedModelId', ({ input, expectedModelId, expectedLabel }) => {
    expect(resolveTierModel(input)).toBe(expectedModelId);
    expect(resolveTierModelLabel(input)).toBe(expectedLabel);
  });
});
