import { describe, expect, it } from 'vitest';
import { selectAiRoute } from '../supabase/functions/_shared/ai-router';

const tiers = [
  { id: 'starter', name: 'starter', is_active: true, ai_model_id: 'luna' },
  { id: 'business', name: 'business', is_active: true, ai_model_id: 'terra' },
  { id: 'pro', name: 'pro', is_active: true, ai_model_id: 'sol' },
];
const models = [
  { id: 'luna', model_id: 'openai/gpt-5.6-luna', provider: 'openrouter', is_active: true },
  { id: 'terra', model_id: 'openai/gpt-5.6-terra', provider: 'openrouter', is_active: true },
  { id: 'sol', model_id: 'openai/gpt-5.6-sol', provider: 'openrouter', is_active: true },
];
const policies = [
  { id: 'p1', tier_id: 'pro', task_type: 'quote_generation', complexity_min: 1, complexity_max: 1, primary_model_id: 'luna', fallback_model_id: null, reasoning_effort: 'low', max_output_tokens: 6000, priority: 10, enabled: true },
  { id: 'p2', tier_id: 'pro', task_type: 'quote_generation', complexity_min: 2, complexity_max: 2, primary_model_id: 'terra', fallback_model_id: 'luna', reasoning_effort: 'medium', max_output_tokens: 8000, priority: 10, enabled: true },
  { id: 'p3', tier_id: 'pro', task_type: 'quote_generation', complexity_min: 3, complexity_max: 3, primary_model_id: 'sol', fallback_model_id: 'terra', reasoning_effort: 'high', max_output_tokens: 12000, priority: 10, enabled: true },
];

function fakeDb(tierId = 'pro') {
  const rows: Record<string, any[]> = { admin_users: [], user_subscriptions: [{ user_id: 'user', tier_id: tierId, status: 'active' }], subscription_tiers: tiers, ai_models: models, plan_ai_policies: policies };
  return { from(table: string) {
    const filters: Array<(row: any) => boolean> = [];
    let limit = Infinity;
    const query: any = {
      select() { return query; }, eq(key: string, value: unknown) { filters.push(row => row[key] === value); return query; },
      lte(key: string, value: number) { filters.push(row => row[key] <= value); return query; },
      gte(key: string, value: number) { filters.push(row => row[key] >= value); return query; },
      order() { return query; }, limit(value: number) { limit = value; return Promise.resolve({ data: rows[table].filter(row => filters.every(fn => fn(row))).slice(0, limit), error: null }); },
      async maybeSingle() { return { data: rows[table].find(row => filters.every(fn => fn(row))) ?? null, error: null }; },
    };
    return query;
  }};
}

describe('AI router', () => {
  it.each([[1,'openai/gpt-5.6-luna'],[2,'openai/gpt-5.6-terra'],[3,'openai/gpt-5.6-sol']] as const)
    ('route le Pro selon la complexité %s', async (complexity, expected) => {
      const route = await selectAiRoute(fakeDb(), 'user', { taskType: 'quote_generation', complexity });
      expect(route.models[0].model_id).toBe(expected);
    });

  it('retourne un fallback borné et distinct', async () => {
    const route = await selectAiRoute(fakeDb(), 'user', { taskType: 'quote_generation', complexity: 3 });
    expect(route.models.map(model => model.model_id)).toEqual(['openai/gpt-5.6-sol','openai/gpt-5.6-terra']);
  });

  it('se replie sur le modèle du plan quand aucune politique ne correspond', async () => {
    const route = await selectAiRoute(fakeDb('starter'), 'user', { taskType: 'cost_analysis', complexity: 1 });
    expect(route.models[0].model_id).toBe('openai/gpt-5.6-luna');
  });
});

