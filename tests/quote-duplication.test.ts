import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { buildClientEstimateExport } from '../lib/client-estimate-export';
import type { EstimateCategory } from '../lib/pricing/engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const migrations = [
  '20260928170413_ai_routing_job_costing_foundation',
  '20260928201500_harden_job_costing_tenant_links',
  '20260929064354_add_job_intelligence_history',
  '20260929064443_optimize_job_change_order_policies',
  '20260929072006_preserve_time_entry_hourly_snapshot',
  '20260929174152_organization_entitlements_rpc',
  '20261007060051_team_cost_catalog',
  '20261010143718_guard_quote_cost_alignment_and_totals',
  '20261122120000_p0_b_job_financial_integrity',
];
const duplication = 'supabase/migrations/20261123130000_duplicate_quote.sql';
const accessCutover = 'supabase/deferred/20261123140000_p0_b_financial_access_cutover.sql';
const firstLine = {
  id: 'ancien-id', signature_id: 'ancienne-signature', cost_line_key: 'new-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  poste: 'Fourniture et pose', description: 'Lot principal', quantity: 3, unit: 'm²', unit_price_ht: 10.335,
  amount_ht: 31.01, tva_percent: 20, tva_amount: 6.2, amount_ttc: 37.21,
  materials_cost: 7.5, labor_cost: 6, cost_price: 13.5, sell_price: 31.01,
};
const secondLine = {
  poste: 'Finition', quantity: 1, unit: 'lot', unit_price_ht: 4.5,
  amount_ht: 4.5, tva_percent: 10, tva_amount: 0.45, amount_ttc: 4.95,
  labor_cost: 3,
};
const categories = [{ id: 'ancien-lot', name: 'Travaux', description: '', items: [firstLine, secondLine],
  subtotal_ht: 35.51, subtotal_tva: 6.65, subtotal_ttc: 42.16 }];

describe('duplication transactionnelle de devis', () => {
  const db = new PGlite();
  const owner = randomUUID();
  const otherOwner = randomUUID();
  const member = randomUUID();
  const project = randomUUID();
  const draft = randomUUID();
  const accepted = randomUUID();

  beforeAll(async () => {
    await db.exec(readFileSync('tests/fixtures/p0-finance-prerequisites.sql', 'utf8'));
    await db.exec(`
      create unique index one_active_estimate on estimates(project_id, scenario_type) where is_active;
      alter table estimates enable row level security;
      alter table projects enable row level security;
      grant select on estimates to authenticated;
      grant select on projects to authenticated;
    `);
    for (const name of migrations) await db.exec(readFileSync(`supabase/migrations/${name}.sql`, 'utf8'));
    await db.query("insert into auth.users(id) values ($1), ($2), ($3)", [owner, otherOwner, member]);
    await db.query("insert into organization_members(organization_id, user_id, role) values ($1, $2, 'member')", [owner, member]);
    await db.query("insert into projects(id, user_id, title, client_name) values ($1, $2, 'Projet BTP', 'Client test')", [project, owner]);
    for (const [id, scenario] of [[draft, 'standard'], [accepted, 'premium']]) {
      await db.query(`insert into estimates(id, user_id, project_id, estimate_kind, quote_status, scenario_type,
          estimate_number, estimate_date, created_at, categories, total_ht, total_tva, total_ttc, total_amount,
          discount_percent, discount_amount, client_name, validity_days, payment_terms, execution_delay,
          deposit_required, special_conditions, estimate_data, line_items, model_used)
        values ($1, $2, $3, 'quote', 'draft', $4, 'DEVIS-source', '2024-01-01', '2024-01-01',
          $5::jsonb, 35.51, 6.65, 42.16, 42.16, 5, 2.11, 'Client test', 45,
          '30 jours', 'Deux semaines', 20, 'Accès à confirmer', '{"signature_id":"ancien"}', '[{"id":"ancien"}]', 'ancien')`,
      [id, owner, project, scenario, JSON.stringify(categories)]);
      await db.query(`update quote_cost_items set unit_cost_cents = 925, supplier = 'Négoce test'
        where estimate_id = $1 and line_key = $2`, [id, firstLine.cost_line_key + '-material']);
      // A manual one-off is separate from a generated override.
      await db.query(`insert into quote_cost_items(organization_id, estimate_id, line_key, category, description, other_cost_cents, source)
        values ($1, $2, 'manual-acces', 'equipment', 'Échafaudage', 750, 'manual')`, [owner, id]);
    }
    await db.query("update estimates set quote_status = 'accepted', accepted_at = '2024-01-02' where id = $1", [accepted]);
    await db.exec(readFileSync(duplication, 'utf8'));
    const transitionCopy = randomUUID();
    await asUser(owner, async () => {
      expect((await copy(draft, transitionCopy)).rows).toEqual([{ id: transitionCopy }]);
    });
    await db.exec(readFileSync(accessCutover, 'utf8'));
  }, 30_000);

  afterAll(async () => { await db.close(); });

  async function asUser(userId: string, fn: () => Promise<void>) {
    await db.query("select set_config('test.user_id', $1, false)", [userId]);
    await db.exec('set role authenticated');
    try { await fn(); } finally { await db.exec('reset role'); }
  }

  const copy = (source: string, id: string, title = 'Devis autonome') =>
    db.query<{ id: string }>('select public.duplicate_quote($1, $2, $3) as id', [source, title, id]);

  for (const [source, status] of [[draft, 'draft'], [accepted, 'accepted']]) {
    it(`copie un devis ${status} à l’identique sur le plan financier, avec de nouvelles identités`, async () => {
      const original = (await db.query('select * from estimates where id = $1', [source])).rows[0];
      const beforeCosts = (await db.query('select * from quote_cost_items where estimate_id = $1 order by id', [source])).rows;
      const id = randomUUID();
      await asUser(owner, async () => {
        expect((await copy(source, id)).rows).toEqual([{ id }]);
        expect((await copy(source, id)).rows).toEqual([{ id }]);
        await expect(copy(source, id, 'Autre titre')).rejects.toMatchObject({ code: '23505' });
        const { rows: [result] } = await db.query<{
          categories: EstimateCategory[]; estimate_number: string; created_at: Date; id: string;
        }>('select * from estimates where id = $1', [id]);
        expect(result).toMatchObject({
          id, quote_status: 'draft', is_active: false, quote_title: 'Devis autonome', project_id: project,
          total_ht: '35.51', total_tva: '6.65', total_ttc: '42.16', total_amount: '42.16',
          discount_percent: '5', discount_amount: '2.11', deposit_required: '20', validity_days: 45,
          payment_terms: '30 jours', execution_delay: 'Deux semaines', special_conditions: 'Accès à confirmer',
          client_name: 'Client test', estimate_data: {}, line_items: [], accepted_at: null, model_used: null,
          regenerated_from_id: null,
        });
        expect(result.estimate_number).toMatch(/^DEVIS-/);
        expect(result.estimate_number).not.toBe('DEVIS-source');
        expect(new Date(result.created_at).getTime()).toBeGreaterThan(Date.parse('2024-01-01'));
        expect(result.categories[0]).not.toHaveProperty('id');
        expect(result.categories[0].items[0]).toMatchObject({ poste: firstLine.poste, quantity: 3, unit: 'm²', cost_price: 13.5, tva_percent: 20 });
        expect(result.categories[0].items[0]).not.toHaveProperty('id');
        expect(result.categories[0].items[0]).not.toHaveProperty('signature_id');
        expect(result.categories[0].items[0].cost_line_key).not.toBe(firstLine.cost_line_key);
        expect(result.categories[0].items[1].cost_line_key).toMatch(/^new-/);
        const clientDocument = buildClientEstimateExport({
          categories: result.categories, totalHt: 35.51, totalTva: 6.65, totalTtc: 42.16, discountAmount: 2.11,
        });
        expect(clientDocument.categories[0].items[0]).toEqual({
          poste: 'Fourniture et pose', description: 'Lot principal', quantity: 3, unit: 'm²',
          unitPriceHt: 10.335, amountHt: 31.01, vatPercent: 20, vatAmount: 6.2, amountTtc: 37.21,
        });
        const costs = await db.query<{ source: string; category: string; line_key: string; id: string }>(
          'select * from quote_cost_items where estimate_id = $1 order by category, planned_minutes', [id]);
        expect(costs.rows).toHaveLength(4);
        expect(costs.rows.find((row) => row.category === 'material')).toMatchObject({
          source: 'manual', supplier: 'Négoce test', unit_cost_cents: 925, line_key: result.categories[0].items[0].cost_line_key + '-material',
        });
        expect(costs.rows.find((row) => row.category === 'equipment')).toMatchObject({
          source: 'manual', other_cost_cents: 750, line_key: expect.stringMatching(/^manual-/),
        });
        expect(costs.rows.every((row) => !beforeCosts.some((sourceRow) => (sourceRow as { id: string }).id === row.id))).toBe(true);
        await db.query("update estimates set quote_title = 'Devis modifié', categories = categories where id = $1", [id]);
        expect((await db.query('select count(*)::int as count from quote_cost_items where estimate_id = $1', [id])).rows)
          .toEqual([{ count: 4 }]);
      });
      expect((await db.query('select * from estimates where id = $1', [source])).rows[0]).toEqual(original);
      expect((await db.query('select * from quote_cost_items where estimate_id = $1 order by id', [source])).rows).toEqual(beforeCosts);
      expect((await db.query('select count(*)::int as count from jobs where source_estimate_id = $1', [id])).rows).toEqual([{ count: 0 }]);
    });
  }

  it('copie aussi les devis envoyés et refusés', async () => {
    const source = randomUUID();
    await db.query(`insert into estimates(id, user_id, organization_id, project_id, estimate_kind, quote_status,
      is_active, categories, total_ht, total_tva, total_ttc, total_amount)
      select $1, user_id, organization_id, project_id, 'quote', 'sent', false,
        categories, total_ht, total_tva, total_ttc, total_amount from estimates where id = $2`, [source, draft]);
    const sentCopy = randomUUID();
    await asUser(owner, async () => { expect((await copy(source, sentCopy)).rows).toEqual([{ id: sentCopy }]); });
    await db.query("update estimates set quote_status = 'rejected' where id = $1", [source]);
    const rejectedCopy = randomUUID();
    await asUser(owner, async () => { expect((await copy(source, rejectedCopy)).rows).toEqual([{ id: rejectedCopy }]); });
  });

  it('refuse un membre, une autre organisation et le rôle anonyme', async () => {
    const id = randomUUID();
    for (const user of [member, otherOwner]) {
      await asUser(user, async () => {
        await expect(copy(draft, id)).rejects.toMatchObject({ code: '42501' });
      });
    }
    await db.exec('set role anon');
    try { await expect(copy(draft, id)).rejects.toMatchObject({ code: '42501' }); }
    finally { await db.exec('reset role'); }
    expect((await db.query('select id from estimates where id = $1', [id])).rows).toEqual([]);
  });

  it('annule le brouillon et ses coûts générés si le rapprochement d’un coût manuel échoue', async () => {
    const id = randomUUID();
    await db.query(`insert into quote_cost_items(organization_id, estimate_id, line_key, category, description, source)
      values ($1, $2, '9-9-material', 'material', 'Poste historique manquant', 'manual')`, [owner, draft]);
    await asUser(owner, async () => {
      await expect(copy(draft, id)).rejects.toMatchObject({ code: '23514' });
    });
    expect((await db.query('select id from estimates where id = $1', [id])).rows).toEqual([]);
    expect((await db.query('select id from quote_cost_items where estimate_id = $1', [id])).rows).toEqual([]);
  });
});
