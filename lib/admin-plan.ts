export interface PlanSwitchResult {
  success: boolean;
  tier_name?: string;
  model_name?: string;
  error?: string;
}

export function isSuccessfulPlanSwitch(value: unknown): value is PlanSwitchResult & { success: true } {
  if (!value || typeof value !== 'object') return false;
  return (value as PlanSwitchResult).success === true;
}

export function getPlanSwitchError(value: unknown): string {
  if (value && typeof value === 'object') {
    const error = (value as PlanSwitchResult).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return 'Le changement de formule n\'a pas été enregistré.';
}
