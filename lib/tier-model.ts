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
    "Compréhension automatique du chantier",
    "Estimation et scénarios de devis",
    "Jusqu'à 10 dossiers par mois",
    "Export PDF du devis",
    "Support par email",
  ],
  business: [
    "Tout le plan Starter",
    "Jusqu'à 30 dossiers par mois",
    "Transformation d'un devis accepté en chantier",
    "Suivi des achats et autres coûts réels",
    "Pilotage du budget chantier",
  ],
  pro: [
    "Tout le plan Business",
    "Dossiers sans limite mensuelle annoncée",
    "Gestion des salariés et de l'équipe",
    "Pointage et coût horaire réel",
    "Rentabilité et historique des chantiers",
    "Support prioritaire",
  ],
};
