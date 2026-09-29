export const PRELIMINARY_ESTIMATE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'preliminary_estimate',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        categories: {
          type: 'array',
          minItems: 1,
          maxItems: 25,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 120 },
              description: { type: 'string', maxLength: 500 },
              items: {
                type: 'array',
                minItems: 1,
                maxItems: 60,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    poste: { type: 'string', minLength: 1, maxLength: 180 },
                    description: { type: 'string', maxLength: 1000 },
                    quantity: { type: 'number', exclusiveMinimum: 0, maximum: 1_000_000 },
                    unit: { type: 'string', minLength: 1, maxLength: 20 },
                    unit_price_ht: { type: 'number', minimum: 0, maximum: 10_000_000 },
                    materials_cost: { type: 'number', minimum: 0, maximum: 10_000_000 },
                    labor_cost: { type: 'number', minimum: 0, maximum: 10_000_000 },
                  },
                  required: [
                    'poste',
                    'description',
                    'quantity',
                    'unit',
                    'unit_price_ht',
                    'materials_cost',
                    'labor_cost',
                  ],
                },
              },
            },
            required: ['name', 'description', 'items'],
          },
        },
        assumptions: {
          type: 'array',
          maxItems: 12,
          items: { type: 'string', maxLength: 500 },
        },
      },
      required: ['categories', 'assumptions'],
    },
  },
} as const;

export function shouldRetryWithoutStructuredOutput(status: number, refined: boolean): boolean {
  return refined && (status === 400 || status === 404);
}

export function validateInternalCost(value: unknown): number {
  const amount = value === undefined || value === null ? 0 : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
    throw new Error('Coût interne invalide');
  }
  return Math.round(amount * 100) / 100;
}

function invalidLine(categoryIndex: number, itemIndex: number, field: string): never {
  throw new Error(`Poste d'estimation invalide (lot ${categoryIndex + 1}, ligne ${itemIndex + 1}, champ ${field})`);
}

export function validatePreliminary(data: any) {
  if (!Array.isArray(data?.categories) || !data.categories.length || data.categories.length > 25) {
    throw new Error("L'estimation ne contient aucun lot valide");
  }

  let totalCents = 0;
  let count = 0;
  const categories = data.categories.map((category: any, categoryIndex: number) => {
    if (typeof category?.name !== 'string' || !category.name.trim()) {
      throw new Error(`Lot d'estimation invalide (lot ${categoryIndex + 1}, champ name)`);
    }
    if (!Array.isArray(category.items) || !category.items.length || category.items.length > 60) {
      throw new Error(`Lot d'estimation invalide (lot ${categoryIndex + 1}, champ items)`);
    }

    let subtotal = 0;
    const items = category.items.map((item: any, itemIndex: number) => {
      if (typeof item?.poste !== 'string' || !item.poste.trim()) invalidLine(categoryIndex, itemIndex, 'poste');
      if (typeof item?.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1_000_000) {
        invalidLine(categoryIndex, itemIndex, 'quantity');
      }
      if (typeof item?.unit_price_ht !== 'number' || !Number.isFinite(item.unit_price_ht) || item.unit_price_ht < 0 || item.unit_price_ht > 10_000_000) {
        invalidLine(categoryIndex, itemIndex, 'unit_price_ht');
      }

      count++;
      const cents = Math.round(item.quantity * Math.round(item.unit_price_ht * 100));
      if (!Number.isSafeInteger(cents)) invalidLine(categoryIndex, itemIndex, 'amount_ht');
      subtotal += cents;
      if (!Number.isSafeInteger(subtotal)) throw new Error('Montant hors limites');

      return {
        poste: item.poste.trim().slice(0, 180),
        description: typeof item.description === 'string' ? item.description.slice(0, 1000) : '',
        quantity: item.quantity,
        unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim().slice(0, 20) : 'u',
        unit_price_ht: Math.round(item.unit_price_ht * 100) / 100,
        amount_ht: cents / 100,
        materials_cost: validateInternalCost(item.materials_cost),
        labor_cost: validateInternalCost(item.labor_cost),
        tva_percent: null,
        tva_amount: null,
        amount_ttc: null,
      };
    });

    totalCents += subtotal;
    if (!Number.isSafeInteger(totalCents)) throw new Error('Montant hors limites');
    return {
      name: category.name.trim().slice(0, 120),
      description: typeof category.description === 'string' ? category.description.slice(0, 500) : '',
      items,
      subtotal_ht: subtotal / 100,
      subtotal_tva: null,
      subtotal_ttc: null,
    };
  });

  if (!count || totalCents <= 0 || !Number.isSafeInteger(totalCents)) {
    throw new Error("Montant d'estimation invalide");
  }

  return {
    categories,
    lineItems: categories.flatMap((category: any) =>
      category.items.map((item: any) => ({ ...item, category: category.name }))
    ),
    totalHT: totalCents / 100,
    totalTVA: null,
    totalTTC: null,
  };
}
