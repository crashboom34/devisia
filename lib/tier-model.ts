export const TIER_TO_MODEL_ID: Record<string, string> = {
  starter:   "mistralai/mistral-large-2512",
  business:  "mistralai/mistral-large-2512",
  pro:       "openai/gpt-4.1",
  unlimited: "openai/gpt-4.1",
};

export const TIER_TO_MODEL_LABEL: Record<string, string> = {
  starter:   "Mistral Large 3 (OpenRouter)",
  business:  "Mistral Large 3 (OpenRouter)",
  pro:       "GPT-4.1 (OpenRouter)",
  unlimited: "GPT-4.1 (OpenRouter)",
};

export function resolveTierModel(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return TIER_TO_MODEL_ID[normalized] ?? TIER_TO_MODEL_ID["starter"];
}

export function resolveTierModelLabel(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return TIER_TO_MODEL_LABEL[normalized] ?? TIER_TO_MODEL_LABEL["starter"];
}

export const CANONICAL_MAPPING = [
  { tier: "starter",  modelId: "mistralai/mistral-large-2512", label: "Mistral Large 3 (OpenRouter)" },
  { tier: "business", modelId: "mistralai/mistral-large-2512", label: "Mistral Large 3 (OpenRouter)" },
  { tier: "pro",      modelId: "openai/gpt-4.1",               label: "GPT-4.1 (OpenRouter)" },
] as const;

