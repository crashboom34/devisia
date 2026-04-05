export const PLAN_LABELS: Record<string, { label: string; short: string }> = {
  starter:  { label: "Artisan solo", short: "Solo" },
  business: { label: "Plusieurs chantiers", short: "Business" },
  pro:      { label: "Equipe & volumes", short: "Pro" },
  unlimited:{ label: "Equipe & volumes", short: "Pro" },
};

export const PLAN_VALUE_PROPS: Record<string, string> = {
  starter:  "Ideal pour les petits chantiers",
  business: "Pour les artisans avec plusieurs projets",
  pro:      "Pour les equipes et gros volumes",
  unlimited:"Pour les equipes et gros volumes",
};

export const PLAN_TOOLTIP =
  "L'IA s'ameliore en continu pour generer des devis toujours plus precis.";

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
