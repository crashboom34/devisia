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

export interface PlanLimits {
  maxEstimatesPerMonth: number;
  maxClients: number;
  maxUsers: number;
  fairUseLimit: number;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    maxEstimatesPerMonth: 10,
    maxClients:           20,
    maxUsers:             1,
    fairUseLimit:         50,
    prioritySupport:      false,
  },
  business: {
    maxEstimatesPerMonth: 30,
    maxClients:           60,
    maxUsers:             3,
    fairUseLimit:         150,
    prioritySupport:      false,
  },
  pro: {
    maxEstimatesPerMonth: 999999,
    maxClients:           999999,
    maxUsers:             999999,
    fairUseLimit:         400,
    prioritySupport:      true,
  },
  unlimited: {
    maxEstimatesPerMonth: 999999,
    maxClients:           999999,
    maxUsers:             999999,
    fairUseLimit:         400,
    prioritySupport:      true,
  },
};

export const PLAN_PRICES = {
  starter:  { monthly: 9.99,  yearly: 99,  monthlyEquiv: 8.25  },
  business: { monthly: 19.99, yearly: 199, monthlyEquiv: 16.6  },
  pro:      { monthly: 29.99, yearly: 299, monthlyEquiv: 24.92 },
} as const;

export const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "IA Mistral Large 3 pour des devis précis",
    "Jusqu'à 10 devis par mois",
    "Jusqu'à 20 clients",
    "1 utilisateur",
    "Support par email",
  ],
  business: [
    "IA Mistral Large 3 pour devis complexes",
    "Jusqu'à 30 devis par mois",
    "Jusqu'à 60 clients",
    "Jusqu'à 3 utilisateurs",
    "Exports PDF illimités et professionnels",
    "Transformation des devis en factures",
  ],
  pro: [
    "IA GPT-4.1 pour l'excellence maximale",
    "Devis illimités pour forte demande",
    "Clients et utilisateurs illimités",
    "Suivi complet du portefeuille client",
    "Collaboration d'équipe avancée",
    "Support prioritaire",
  ],
};
