import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { calculateJobIntelligence } from '../lib/job-intelligence';
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
  const member = randomUUID();
  const administrator = randomUUID();
  let job: string;
  let legacyJob: string;

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
    await db.exec('reset role');
    await db.query("insert into auth.users(id, email) values ($1, 'member@example.test'), ($2, 'admin@example.test')", [member, administrator]);
    await db.query("insert into organization_members (organization_id, user_id, role) values ($1, $2, 'member'), ($1, $3, 'admin')", [owner, member, administrator]);
    await db.query(`insert into job_budget_snapshots(organization_id, job_id, version, sold_total_ht_cents, material_cents)
      values ($1, $2, 2, 99999, 99999)`, [owner, job]);
    // A pre-existing chantier with only a later snapshot must remain visible for diagnosis.
    const legacyEstimate = randomUUID();
    await db.query(`insert into estimates(id, user_id, project_id, estimate_kind, quote_status)
      values ($1, $2, $3, 'quote', 'accepted')`, [legacyEstimate, owner, project]);
    legacyJob = (await db.query<{ id: string }>(`
      insert into jobs(organization_id, source_estimate_id, source_project_id, name, created_by)
      values ($1, $2, $3, 'Budget v1 absent', $1) returning id`, [owner, legacyEstimate, project])).rows[0].id;
    await db.query(`insert into job_budget_snapshots(organization_id, job_id, version, sold_total_ht_cents)
      values ($1, $2, 2, 0)`, [owner, legacyJob]);
    const hardening = 'supabase/migrations/20261122120000_p0_b_job_financial_integrity.sql';
    await db.exec(readFileSync(hardening, 'utf8'));
    await db.exec('set role authenticated');
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
             has_function_privilege('anon', 'public.capture_job_performance_snapshot(uuid,numeric,boolean)', 'execute') as anonymous_capture,
             has_function_privilege('anon', 'public.get_job_financial_summary(uuid)', 'execute') as anonymous_summary,
             has_function_privilege('authenticated', 'private.calculate_job_financial_summary(public.jobs)', 'execute') as direct_calculator
    `);
    expect(rights.rows).toEqual([{ read: true, write: false, anonymous_capture: false, anonymous_summary: false, direct_calculator: false }]);
  });

  it('fige une seule vente HT remisée pour un poste ventilé entre matériau et pose', async () => {
    expect((await db.query('select category, sale_price_cents from quote_cost_items where estimate_id = $1 order by category', [estimate])).rows)
      .toEqual([{ category: 'labor', sale_price_cents: 0 }, { category: 'material', sale_price_cents: 10000 }]);
    expect((await db.query('select version, material_cents, labor_cents, sold_total_ht_cents from job_budget_snapshots where job_id = $1 and version = 1', [job])).rows)
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
  it('protège directement les montants, les références et toutes les versions historiques', async () => {
    for (const assignment of ['sold_total_ht_cents = 1', 'initial_budget_cents = 1', 'source_project_id = null', 'source_estimate_id = null', "status = 'completed'", 'completed_on = current_date']) {
      await expect(db.query(`update jobs set ${assignment} where id = $1`, [job])).rejects.toMatchObject({ code: '42501' });
    }
    await expect(db.query('delete from jobs where id = $1', [job])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query('update job_budget_snapshots set labor_cents = 1 where job_id = $1', [job])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query('delete from job_budget_snapshots where job_id = $1', [job])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query(`insert into job_budget_snapshots(organization_id, job_id, version, sold_total_ht_cents)
      values ($1, $2, 3, 0)`, [owner, job])).rejects.toMatchObject({ code: '42501' });
    expect((await db.query('select version from job_budget_snapshots where job_id = $1 order by version', [job])).rows)
      .toEqual([{ version: 1 }, { version: 2 }]);
    await db.exec('reset role');
    try {
      await expect(db.query('delete from estimates where id = $1', [estimate])).rejects.toThrow('immutable');
      await expect(db.query('update quote_cost_items set hourly_cost_cents = 1 where estimate_id = $1', [estimate]))
        .rejects.toThrow('immutable');
      await expect(db.query('update job_budget_snapshots set labor_cents = 1 where job_id = $1', [job]))
        .rejects.toThrow('immutable');
    } finally {
      await db.exec('set role authenticated');
    }
  });

  it('crée une unique v1 atomiquement avec une multiplication de coût supérieure à un int32', async () => {
    const nextEstimate = randomUUID();
    await db.exec('reset role');
    try {
      await db.query(`insert into estimates(id, user_id, project_id, estimate_kind, total_ht, total_ttc)
        values ($1, $2, $3, 'quote', 100, 120)`, [nextEstimate, owner, project]);
      await db.query(`insert into quote_cost_items(organization_id, estimate_id, line_key, category, description, planned_minutes, hourly_cost_cents)
        values ($1, $2, 'manual', 'labor', 'Lot agrégé', 1000000, 3000)`, [owner, nextEstimate]);
    } finally {
      await db.exec('set role authenticated');
    }
    const accepted = (await db.query<{ id: string }>('select accept_estimate_and_create_job($1) as id', [nextEstimate])).rows[0].id;
    expect((await db.query('select labor_cents, sold_total_ht_cents, version from job_budget_snapshots where job_id = $1', [accepted])).rows)
      .toEqual([{ labor_cents: 50_000_000, sold_total_ht_cents: 10_000, version: 1 }]);
    await expect(db.query('select accept_estimate_and_create_job($1)', [nextEstimate])).rejects.toThrow('already accepted');
  });

  it('refuse une capture et une approbation lorsque la v1 manque', async () => {
    await expect(db.query('select get_job_financial_summary($1)', [legacyJob])).rejects.toThrow('Initial budget snapshot not found');
    await expect(db.query('select capture_job_performance_snapshot($1, 50)', [legacyJob]))
      .rejects.toThrow('Initial budget snapshot not found');
    await expect(db.query(`insert into job_change_orders(organization_id, job_id, title, status, sold_delta_cents, approved_on)
      values ($1, $2, 'Révision', 'approved', 1, current_date)`, [owner, legacyJob]))
      .rejects.toThrow('Initial budget snapshot not found');
  });

  it('aligne la lecture exhaustive et la capture sur v1, les centimes et les avenants approuvés', async () => {
    const employee = randomUUID();
    await db.query("insert into employees(id, organization_id, first_name, last_name) values ($1, $2, 'Grand', 'Volume')", [employee, owner]);
    await db.query(`insert into time_entries(organization_id, employee_id, job_id, work_date, minutes, hourly_cost_cents_snapshot)
      select $1, $2, $3, date '2020-01-01' + n, 1, 90 from generate_series(1, 1001) n`, [owner, employee, job]);
    await db.query(`insert into job_cost_entries(organization_id, job_id, category, description, amount_ht_cents)
      select $1, $2, 'transport', 'Écriture ' || n, 3 from generate_series(1, 1001) n`, [owner, job]);

    const insertChange = `insert into job_change_orders(organization_id, job_id, title, status, sold_delta_cents,
      planned_cost_delta_cents, cost_category, approved_on)
      values ($1, $2, 'Avenant', $3, $4, $5, $6, current_date) returning id`;
    const increase = { status: 'approved', soldDeltaCents: 100, plannedCostDeltaCents: 100, category: 'transport' } as const;
    const decrease = { status: 'approved', soldDeltaCents: -80, plannedCostDeltaCents: -80, category: 'consumable' } as const;
    const approved = await db.query<{ id: string }>(insertChange, [owner, job, 'approved', 100, 100, 'transport']);
    await db.query(insertChange, [owner, job, 'approved', -80, -80, 'consumable']);
    await db.query(insertChange, [owner, job, 'draft', 200, 200, 'other']);
    await db.query(insertChange, [owner, job, 'rejected', 300, 300, 'other']);
    await expect(db.query(insertChange, [owner, job, 'approved', -21, -21, 'other'])).rejects.toThrow('negative');
    await expect(db.query('delete from job_change_orders where id = $1', [approved.rows[0].id])).rejects.toThrow('immutable');

    const ts = calculateJobIntelligence({
      initialSoldCents: 9000, planned: [
        { category: 'material', unitCostCents: 2000 },
        { category: 'labor', plannedMinutes: 60, hourlyCostCents: 3000 },
      ],
      actual: [{ category: 'material', amountHtCents: 3400 }, { category: 'transport', amountHtCents: 3003 }],
      time: [{ minutes: 120, hourlyCostCentsSnapshot: 2400 }, ...Array.from({ length: 1001 }, () => ({ minutes: 1, hourlyCostCentsSnapshot: 90 }))],
      changeOrders: [decrease, increase], progressPercent: 33.33,
    });
    const live = (await db.query<{ summary: Record<string, unknown> }>('select get_job_financial_summary($1) as summary', [job])).rows[0].summary;
    expect(live).toMatchObject({
      initial_sold_total_ht_cents: 9000, initial_budget_cents: 5000, revised_sold_total_ht_cents: ts.soldCents,
      revised_budget_cents: ts.plannedCostCents, actual_cost_cents: 13205, planned_margin_cents: ts.plannedMarginCents,
      actual_by_category: { labor: 6802, material: 3400, other: 3003 }, planned_by_category: { other: 20 },
    });
    const capture = (await db.query<{ id: string }>('select capture_job_performance_snapshot($1, 33.33) as id', [job])).rows[0].id;
    expect((await db.query('select * from job_performance_snapshots where id = $1', [capture])).rows[0])
      .toMatchObject({ ...live, forecast_cost_cents: ts.forecastCostCents, projected_margin_cents: ts.projectedMarginCents });
    expect((await db.query('select actual_cost_cents from job_performance_snapshots where job_id = $1 and version = 1', [job])).rows[0])
      .toEqual({ actual_cost_cents: 8200 });
  }, 30_000);

  it('protège le rattachement du projet et conserve une seule clôture', async () => {
    await db.exec('reset role');
    try {
      await expect(db.query('update projects set organization_id = $1 where id = $2', [otherOwner, project]))
        .rejects.toThrow('Contractual project organization is immutable');
    } finally {
      await db.exec('set role authenticated');
    }
    await expect(db.query('select capture_job_performance_snapshot($1, 33.333)', [job]))
      .rejects.toThrow('two decimals');
    await db.query('select capture_job_performance_snapshot($1, 100, true)', [job]);
    expect((await db.query('select status from jobs where id = $1', [job])).rows).toEqual([{ status: 'completed' }]);
    await expect(db.query("update jobs set status = 'active' where id = $1", [job])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query('select capture_job_performance_snapshot($1, 100, true)', [job]))
      .rejects.toThrow('already completed');
  });

  it('sépare les durées des coûts et réserve les finances aux administrateurs du chantier', async () => {
    try {
      await expect(db.query('select hourly_cost_cents_snapshot from time_entries where job_id = $1 limit 1', [job]))
        .rejects.toMatchObject({ code: '42501' });
      await db.query("select set_config('test.user_id', $1, false)", [member]);
      expect((await db.query('select minutes from time_entries where job_id = $1 limit 1', [job])).rows).toHaveLength(1);
      await expect(db.query('select hourly_cost_cents_snapshot from time_entries where job_id = $1 limit 1', [job]))
        .rejects.toMatchObject({ code: '42501' });
      for (const table of ['employees', 'jobs', 'job_budget_snapshots', 'job_cost_entries', 'job_change_orders', 'job_performance_snapshots']) {
        expect((await db.query(`select * from ${table} where organization_id = $1`, [owner])).rows).toEqual([]);
      }
      for (const uid of [member, otherOwner]) {
        await db.query("select set_config('test.user_id', $1, false)", [uid]);
        await expect(db.query('select get_job_financial_summary($1)', [job])).rejects.toMatchObject({ code: '42501' });
        await expect(db.query('select capture_job_performance_snapshot($1, 100)', [job])).rejects.toThrow();
      }
      await db.query("select set_config('test.user_id', $1, false)", [administrator]);
      expect((await db.query('select get_job_financial_summary($1) as summary', [job])).rows[0])
        .toMatchObject({ summary: { initial_budget_cents: 5000 } });
    } finally {
      await db.query("select set_config('test.user_id', $1, false)", [owner]);
    }
  });
});
