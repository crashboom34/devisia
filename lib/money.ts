export type MoneyCents = number;

function assertSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} doit être un entier sûr`);
  return value;
}
export function eurosToCents(value: number): MoneyCents {
  if (!Number.isFinite(value)) throw new Error('Montant non fini');
  return assertSafeInteger(Math.round((value + Number.EPSILON) * 100), 'Montant');
}

export function centsToEuros(value: MoneyCents): number {
  return assertSafeInteger(value, 'Montant') / 100;
}

export function multiplyCents(unitCostCents: MoneyCents, quantity: number): MoneyCents {
  assertSafeInteger(unitCostCents, 'Coût unitaire');
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Quantité invalide');
  return assertSafeInteger(Math.round(unitCostCents * quantity), 'Total');
}

export function percentageCents(amountCents: MoneyCents, basisPoints: number): MoneyCents {
  assertSafeInteger(amountCents, 'Montant');
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) {
    throw new Error('Taux invalide');
  }
  return assertSafeInteger(Math.round((amountCents * basisPoints) / 10000), 'Pourcentage');
}

export function formatCents(value: MoneyCents): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(centsToEuros(value));
}

