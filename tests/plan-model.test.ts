import { describe, expect, it } from 'vitest';
import { selectPlanModel } from '../supabase/functions/_shared/plan-model';

const tiers = [
  { id: 'tier-1', name: 'starter', is_active: true, ai_model_id: 'model-1' },
  { id: 'tier-2', name: 'business', is_active: true, ai_model_id: 'model-2' },
  { id: 'tier-3', name: 'pro', is_active: true, ai_model_id: 'model-3' },
];
const models = [
  { id: 'model-1', model_id: 'openai/gpt-4.1-mini', provider: 'openrouter', is_active: true },
  { id: 'model-2', model_id: 'mistralai/mistral-large-2', provider: 'openrouter', is_active: true },
  { id: 'model-3', model_id: 'openai/gpt-4.1', provider: 'openrouter', is_active: true },
];

function fakeDb(tierId?: string, isAdmin = false) {
  const rows: Record<string, any[]> = {
    admin_users: isAdmin ? [{ id: 'admin-1', user_id: 'user-1' }] : [],
    user_subscriptions: tierId ? [{ tier_id: tierId, user_id: 'user-1', status: 'active' }] : [],
    subscription_tiers: tiers.map((tier) => ({ ...tier })),
    ai_models: models.map((model) => ({ ...model })),
  };
  return {
    rows,
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters[key] = value; return query; },
        async maybeSingle() {
          return { data: rows[table].find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null, error: null };
        },
      };
      return query;
    },
  };
}

describe('modèle OpenRouter du plan', () => {
  it.each([['tier-1', 'openai/gpt-4.1-mini'], ['tier-2', 'mistralai/mistral-large-2'], ['tier-3', 'openai/gpt-4.1']])
    ('choisit le modèle du plan %s', async (tierId, expected) => {
      const { model } = await selectPlanModel(fakeDb(tierId), 'user-1');
      expect(model.model_id).toBe(expected);
    });

  it('prend effet dès que l’administrateur modifie le plan, sans redéployer', async () => {
    const db = fakeDb('tier-1');
    db.rows.subscription_tiers[0].ai_model_id = 'model-3';
    expect((await selectPlanModel(db, 'user-1')).model.model_id).toBe('openai/gpt-4.1');
  });

  it('simule le plan demandé par un admin en lisant son affectation actuelle', async () => {
    const { model } = await selectPlanModel(fakeDb('tier-1', true), 'user-1', 'business');
    expect(model.model_id).toBe('mistralai/mistral-large-2');
  });

  it('ignore la tentative de changer de plan par un non administrateur', async () => {
    const { model } = await selectPlanModel(fakeDb('tier-1'), 'user-1', 'pro');
    expect(model.model_id).toBe('openai/gpt-4.1-mini');
  });

  it('utilise Starter en l’absence d’abonnement', async () => {
    expect((await selectPlanModel(fakeDb(), 'user-1')).model.id).toBe('model-1');
  });

  it('refuse un modèle désactivé au lieu de sélectionner un modèle moins cher', async () => {
    const db = fakeDb('tier-2');
    db.rows.ai_models[1].is_active = false;
    await expect(selectPlanModel(db, 'user-1')).rejects.toThrow('indisponible');
  });
});
