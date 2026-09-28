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
    "Génération de devis rapide et fiable",
    "Jusqu'à 10 devis par mois",
    "Jusqu'à 20 clients",
    "1 utilisateur",
    "Support par email",
  ],
  business: [
    "Génération de devis précise sur chantiers variés",
    "Jusqu'à 30 devis par mois",
    "Jusqu'à 60 clients",
    "Jusqu'à 3 utilisateurs",
    "Exports PDF illimités et professionnels",
    "Transformation des devis en factures",
  ],
  pro: [
    "Génération optimale sur devis complexes multi-lots",
    "Devis illimités pour forte demande",
    "Clients et utilisateurs illimités",
    "Suivi complet du portefeuille client",
    "Collaboration d'équipe avancée",
    "Support prioritaire",
  ],
};
