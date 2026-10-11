/** Calculate reviewed quote amounts from the stored HT lines and user selected VAT rates. */
export function calculateReviewedQuote(rawCategories: unknown, selectedRates: unknown) {
  if (!Array.isArray(rawCategories) || !rawCategories.length || !Array.isArray(selectedRates))
    throw new Error('Estimation ou taux manquants');
  const count = rawCategories.reduce((sum: number, category: any) => sum + (Array.isArray(category.items) ? category.items.length : 0), 0);
  if (count < 1 || count > 500 || selectedRates.length !== count ||
      !selectedRates.every((rate: unknown) => [0, 5.5, 10, 20].includes(rate as number)))
    throw new Error('Choisissez un taux de TVA valide pour chaque poste.');

  let position = 0, totalHT = 0, totalTVA = 0;
  const categories = rawCategories.map((category: any) => {
    if (!Array.isArray(category.items)) throw new Error('Lot invalide');
    let subHT = 0, subTVA = 0;
    const items = category.items.map((item: any) => {
      const qty = Number(item.quantity), price = Number(item.unit_price_ht);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0 || price > 10000000 || qty > 1000000)
        throw new Error('Montant de poste invalide');
      const amountCents = Math.round(qty * Math.round(price * 100));
      const rate = selectedRates[position++];
      const vatCents = Math.round(amountCents * rate / 100);
      if (!Number.isSafeInteger(amountCents) || !Number.isSafeInteger(vatCents))
        throw new Error('Montant hors limites');
      subHT += amountCents; subTVA += vatCents;
      return { ...item, amount_ht: amountCents / 100, tva_percent: rate,
        tva_amount: vatCents / 100, amount_ttc: (amountCents + vatCents) / 100 };
    });
    totalHT += subHT; totalTVA += subTVA;
    return { ...category, items, subtotal_ht: subHT / 100, subtotal_tva: subTVA / 100,
      subtotal_ttc: (subHT + subTVA) / 100 };
  });
  if (!Number.isSafeInteger(totalHT + totalTVA)) throw new Error('Montant total hors limites');
  return { categories, totalHT: totalHT / 100, totalTVA: totalTVA / 100,
    totalTTC: (totalHT + totalTVA) / 100,
    lineItems: categories.flatMap((category: any) => category.items.map((item: any) => ({ ...item, category: category.name }))) };
}

/** Do not copy preliminary-only tax caveats into a quote with selected VAT rates. */
export function buildReviewedQuoteConditions(rawAssumptions: unknown): string {
  const prefix = 'Hypothèses et réserves à vérifier : ';
  const taxNote = 'TVA : taux choisis pour ce devis ; vérifier leur applicabilité avant remise.';
  const assumptions = Array.isArray(rawAssumptions) ? rawAssumptions : [];
  const details = assumptions.slice(0, 50)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value && !/\b(?:TVA|TTC)\b/i.test(value))
    .join(' ; ')
    .slice(0, 3000 - prefix.length - taxNote.length - 3);
  return `${prefix}${details ? `${details} ; ` : ''}${taxNote}`;
}
