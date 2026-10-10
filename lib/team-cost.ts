export interface EmployerCostEstimate {
  source: 'urssaf' | 'manual';
  grossMonthlyCents: number;
  employerContributionsCents: number | null;
  employerMonthlyCostCents: number;
  extraMonthlyCostCents: number;
  totalMonthlyCostCents: number;
  hourlyCostCents: number;
  paidMonthlyHours: number;
}

const MAX_STORED_CENTS = 2_147_483_647;

export function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents <= MAX_STORED_CENTS ? cents : null;
}

export function buildEmployerCostEstimate(
  grossMonthlyCents: number,
  urssafMonthlyCostEuros: number,
  weeklyHours: number,
  extraMonthlyCostCents = 0,
): EmployerCostEstimate | null {
  if (![grossMonthlyCents, urssafMonthlyCostEuros, weeklyHours, extraMonthlyCostCents].every(Number.isFinite)
    || !Number.isSafeInteger(grossMonthlyCents) || !Number.isSafeInteger(extraMonthlyCostCents)
    || grossMonthlyCents <= 0 || grossMonthlyCents > MAX_STORED_CENTS
    || extraMonthlyCostCents < 0 || extraMonthlyCostCents > MAX_STORED_CENTS
    || weeklyHours <= 0 || weeklyHours > 35) return null;
  const employerMonthlyCostCents = Math.round(urssafMonthlyCostEuros * 100);
  if (!Number.isSafeInteger(employerMonthlyCostCents) || employerMonthlyCostCents < grossMonthlyCents) return null;
  const totalMonthlyCostCents = employerMonthlyCostCents + extraMonthlyCostCents;
  if (totalMonthlyCostCents > MAX_STORED_CENTS) return null;
  const paidMonthlyHours = weeklyHours * 52 / 12;
  return {
    source: 'urssaf',
    grossMonthlyCents,
    employerContributionsCents: employerMonthlyCostCents - grossMonthlyCents,
    employerMonthlyCostCents,
    extraMonthlyCostCents,
    totalMonthlyCostCents,
    hourlyCostCents: Math.round(totalMonthlyCostCents / paidMonthlyHours),
    paidMonthlyHours,
  };
}

/** A manual hourly rate already includes all employer costs, including extras. */
export function buildManualEmployerCostEstimate(
  grossMonthlyCents: number,
  weeklyHours: number,
  hourlyCostCents: number,
  extraMonthlyCostCents = 0,
): EmployerCostEstimate | null {
  if (![grossMonthlyCents, weeklyHours, hourlyCostCents, extraMonthlyCostCents].every(Number.isFinite)
    || ![grossMonthlyCents, hourlyCostCents, extraMonthlyCostCents].every(Number.isSafeInteger)
    || grossMonthlyCents <= 0 || grossMonthlyCents > MAX_STORED_CENTS
    || hourlyCostCents <= 0 || hourlyCostCents > MAX_STORED_CENTS
    || extraMonthlyCostCents < 0 || extraMonthlyCostCents > MAX_STORED_CENTS
    || weeklyHours <= 0 || weeklyHours > 60) return null;
  const paidMonthlyHours = weeklyHours * 52 / 12;
  const totalMonthlyCostCents = Math.round(hourlyCostCents * paidMonthlyHours);
  if (!Number.isSafeInteger(totalMonthlyCostCents) || totalMonthlyCostCents > MAX_STORED_CENTS
    || totalMonthlyCostCents < grossMonthlyCents + extraMonthlyCostCents) return null;
  return {
    source: 'manual',
    grossMonthlyCents,
    employerContributionsCents: null,
    employerMonthlyCostCents: totalMonthlyCostCents - extraMonthlyCostCents,
    extraMonthlyCostCents,
    totalMonthlyCostCents,
    hourlyCostCents,
    paidMonthlyHours,
  };
}

interface UrssafEvaluation {
  evaluate?: Array<{ nodeValue?: unknown }>;
}

/** Only the gross amount is transmitted; no employee identity leaves Devisia. */
export async function fetchUrssafEmployerCost(grossMonthlyCents: number, weeklyHours: number, signal?: AbortSignal): Promise<number> {
  if (!Number.isSafeInteger(grossMonthlyCents) || grossMonthlyCents <= 0 || grossMonthlyCents > MAX_STORED_CENTS) throw new Error('Salaire brut invalide');
  // The simulator input below models standard full-time and part-time contracts.
  // Overtime needs additional payroll inputs; never silently price it as 35 h.
  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0 || weeklyHours > 35) throw new Error('Au-delà de 35 h, saisissez un coût horaire chargé vérifié');
  if (signal?.aborted) throw new DOMException('Calculation cancelled', 'AbortError');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 10_000);
  try {
    const response = await fetch('https://mon-entreprise.urssaf.fr/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expressions: ['salarié . coût total employeur'],
        situation: {
          'salarié . contrat . salaire brut': `${grossMonthlyCents / 100} €/mois`,
          ...(weeklyHours < 35 ? {
            'salarié . contrat . temps de travail . temps partiel': 'oui',
            'salarié . contrat . temps de travail . temps partiel . heures par semaine': `${weeklyHours} heure/semaine`,
          } : {}),
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Le simulateur Urssaf est indisponible');
    const payload = await response.json() as UrssafEvaluation;
    const value = payload.evaluate?.[0]?.nodeValue;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Réponse Urssaf invalide');
    return value;
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error('Le calcul Urssaf a dépassé le délai de 10 secondes');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
