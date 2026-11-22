import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
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
];

describe('contrats financiers du chantier (PostgreSQL local)', () => {
  const db = new PGlite();
  const owner = randomUUID();
  const otherOwner = randomUUID();
  const project = randomUUID();
  const estimate = randomUUID();
  let job: string;

  beforeAll(async () => {
    await db.exec(readFileSync('tests/fixtures/p0-finance-prerequisites.sql', 'utf8'));
    for (const name of migrations) {
      await db.exec(readFileSync(`supabase/migrations/${name}.sql`, 'utf8'));
    }
    await db.query("insert into auth.users(id, email) values ($1, 'a@example.test'), ($2, 'b@example.test')", [owner, otherOwner]);
    await db.exec("insert into user_subscriptions select u.id, t.id, 'active', now(), now() from auth.users u cross join subscription_tiers t");
    await db.query("insert into projects(id, user_id, title) values ($1, $2, 'Chantier test')", [project, owner]);
    const categories = [{ items: [{ poste: 'Fourniture et pose', cost_line_key: 'pose', amount_ht: 100, materials_cost: 20, labor_cost: 30 }] }];
    await db.query(`insert into estimates(id, user_id, project_id, estimate_kind, categories, total_ht, total_ttc, discount_amount)
      values ($1, $2, $3, 'quote', $4, 100, 120, 12)`, [estimate, owner, project, JSON.stringify(categories)]);
    await db.query("select set_config('test.user_id', $1, false)", [owner]);
    await db.exec('set role authenticated');
    job = (await db.query<{ id: string }>('select accept_estimate_and_create_job($1) as id', [estimate])).rows[0].id;
  }, 30_000);

  afterAll(async () => { await db.close(); });

  it('retrouve la RLS des tables financières et la lecture seule des captures historiques', async () => {
    const tables = ['jobs', 'time_entries', 'job_cost_entries', 'job_budget_snapshots',
      'quote_cost_items', 'job_performance_snapshots', 'job_change_orders', 'employees'];
    const result = await db.query<{ table_name: string }>(
      `select tablename as table_name from pg_tables
       where schemaname = 'public' and tablename = any($1::text[]) and rowsecurity`, [tables],
    );
    expect(result.rows.map(row => row.table_name).sort()).toEqual([...tables].sort());
    const rights = await db.query(`
      select has_table_privilege('authenticated', 'job_performance_snapshots', 'select') as read,
             has_table_privilege('authenticated', 'job_performance_snapshots', 'insert') as write,
             has_function_privilege('anon', 'public.capture_job_performance_snapshot(uuid,numeric,boolean)', 'execute') as anonymous_capture
    `);
    expect(rights.rows).toEqual([{ read: true, write: false, anonymous_capture: false }]);
  });

  it('fige une seule vente HT remisée pour un poste ventilé entre matériau et pose', async () => {
    expect((await db.query('select category, sale_price_cents from quote_cost_items where estimate_id = $1 order by category', [estimate])).rows)
      .toEqual([{ category: 'labor', sale_price_cents: 0 }, { category: 'material', sale_price_cents: 10000 }]);
    expect((await db.query('select version, material_cents, labor_cents, sold_total_ht_cents from job_budget_snapshots where job_id = $1', [job])).rows)
      .toEqual([{ version: 1, material_cents: 2000, labor_cents: 3000, sold_total_ht_cents: 9000 }]);
    await expect(db.query('select accept_estimate_and_create_job($1)', [estimate])).rejects.toThrow('already accepted');
  });

  it('valorise une fois chaque pointage et dépense à chaque capture, même à montants égaux', async () => {
    for (const firstName of ['Alice', 'Bob']) {
      const employee = randomUUID();
      await db.query("insert into employees(id, organization_id, first_name, last_name) values ($1, $2, $3, 'Test')", [employee, owner, firstName]);
      const insertTime = `insert into time_entries(organization_id, employee_id, job_id, work_date, minutes, hourly_cost_cents_snapshot)
        values ($1, $2, $3, date '2026-11-02', 45, 2400)`;
      await db.query(insertTime, [owner, employee, job]);
      await expect(db.query(insertTime, [owner, employee, job])).rejects.toMatchObject({ code: '23505' });
      await db.query('update time_entries set minutes = 60, hourly_cost_cents_snapshot = 3100 where employee_id = $1', [employee]);
    }
    await db.query(`insert into job_cost_entries(organization_id, job_id, category, description, quantity, amount_ht_cents)
      values ($1, $2, 'material', 'Livraison A', 2, 1700), ($1, $2, 'material', 'Livraison B', 3, 1700)`, [owner, job]);
    for (const progress of [40, 60]) {
      const capture = await db.query<{ id: string }>('select capture_job_performance_snapshot($1, $2) as id', [job, progress]);
      expect((await db.query('select actual_cost_cents, actual_by_category, revised_sold_total_ht_cents from job_performance_snapshots where id = $1', [capture.rows[0].id])).rows[0])
        .toMatchObject({ actual_cost_cents: 8200, actual_by_category: { material: 3400, labor: 4800 }, revised_sold_total_ht_cents: 9000 });
    }
  });

  it('limite la lecture du chantier au membre de son organisation', async () => {
    expect((await db.query('select id from jobs where id = $1', [job])).rows).toEqual([{ id: job }]);
    await db.query("select set_config('test.user_id', $1, false)", [otherOwner]);
    try {
      expect((await db.query('select id from jobs where id = $1', [job])).rows).toEqual([]);
      expect((await db.query('select version from job_budget_snapshots where job_id = $1', [job])).rows).toEqual([]);
    } finally {
      await db.query("select set_config('test.user_id', $1, false)", [owner]);
    }
  });
});
