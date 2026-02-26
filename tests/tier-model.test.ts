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

let passed = 0;
let failed = 0;

for (const { input, expectedModelId, expectedLabel } of cases) {
  const gotModelId = resolveTierModel(input);
  const gotLabel = resolveTierModelLabel(input);

  const modelOk = gotModelId === expectedModelId;
  const labelOk = gotLabel === expectedLabel;

  if (modelOk && labelOk) {
    console.log(`  PASS  resolveTierModel("${input}") → ${gotModelId}`);
    passed++;
  } else {
    if (!modelOk) {
      console.error(`  FAIL  resolveTierModel("${input}"): expected ${expectedModelId}, got ${gotModelId}`);
    }
    if (!labelOk) {
      console.error(`  FAIL  resolveTierModelLabel("${input}"): expected "${expectedLabel}", got "${gotLabel}"`);
    }
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
