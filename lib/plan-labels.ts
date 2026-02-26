export const PLAN_LABELS: Record<string, { label: string; short: string }> = {
  starter:  { label: "Mode Essentiel", short: "Essentiel" },
  business: { label: "Mode Avancé",    short: "Avancé"    },
  pro:      { label: "Mode Expert",    short: "Expert"    },
  unlimited:{ label: "Mode Expert",    short: "Expert"    },
};

export const PLAN_VALUE_PROPS: Record<string, string> = {
  starter:  "Rapide & fiable pour chantiers simples",
  business: "Meilleure cohérence sur chantiers variés",
  pro:      "Optimal sur devis complexes multi-lots",
  unlimited:"Optimal sur devis complexes multi-lots",
};

export const PLAN_TOOLTIP =
  "Le moteur peut évoluer pour améliorer la qualité, sans action de votre part.";

export function getPlanLabel(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return PLAN_LABELS[normalized]?.label ?? PLAN_LABELS["starter"].label;
}

export function getPlanShort(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return PLAN_LABELS[normalized]?.short ?? PLAN_LABELS["starter"].short;
}

export function getPlanValueProp(tierName: string): string {
  const normalized = (tierName || "").toLowerCase().trim();
  return PLAN_VALUE_PROPS[normalized] ?? PLAN_VALUE_PROPS["starter"];
}
