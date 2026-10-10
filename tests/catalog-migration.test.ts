import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261007060051_team_cost_catalog.sql'), 'utf8');
const backfill = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261007060100_job_cost_catalog_backfill.sql'), 'utf8');
const guardMigration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261010143718_guard_quote_cost_alignment_and_totals.sql'), 'utf8');
const orgA = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const projectA = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
const projectB = 'ffffffff-ffff-4fff-ffff-ffffffffffff';

describe('cost catalog and accepted quote migrations', () => {
  it('applies locally, backfills once, isolates tenants and preserves accepted quotes', async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        create role authenticated;
        create role anon;
        create schema auth;
        create schema private;
        create table public.organizations (id uuid primary key);
        create table public.employees (id uuid primary key, organization_id uuid references public.organizations(id));
        create table public.job_cost_entries (
          id uuid primary key default gen_random_uuid(),
          organization_id uuid not null references public.organizations(id),
          category text not null, description text not null,
          amount_ht_cents bigint not null, created_at timestamptz not null default now()
        );
        create table public.projects (
          id uuid primary key, organization_id uuid not null references public.organizations(id),
          title text default 'QA', client_name text, client_address text
        );
        create table public.estimates (
          id uuid primary key, organization_id uuid not null references public.organizations(id),
          project_id uuid not null references public.projects(id), quote_status text not null,
          estimate_kind text not null default 'quote',
          categories jsonb, total_ht numeric, total_tva numeric, total_ttc numeric, total_amount numeric,
          discount_percent numeric, discount_amount numeric, client_name text, payment_terms text,
          execution_delay text, deposit_required numeric, special_conditions text, content text
        );
        create table public.quote_cost_items (
          id uuid primary key default gen_random_uuid(), organization_id uuid not null,
          estimate_id uuid not null references public.estimates(id),
          line_key text not null, category text not null, description text not null,
          quantity numeric not null default 1, unit text not null default 'forfait',
          unit_cost_cents bigint not null default 0, planned_minutes integer not null default 0,
          hourly_cost_cents integer not null default 0, other_cost_cents bigint not null default 0,
          sale_price_cents bigint not null default 0, source text,
          updated_at timestamptz default now(), unique (estimate_id, line_key)
        );
        create table public.jobs (
          id uuid primary key default gen_random_uuid(), organization_id uuid not null,
          source_estimate_id uuid not null unique, source_project_id uuid not null,
          name text, client_name text, address text, sold_total_ht_cents bigint,
          initial_budget_cents bigint, created_by uuid, updated_at timestamptz default now()
        );
        create table public.job_budget_snapshots (
          id uuid primary key default gen_random_uuid(), organization_id uuid not null,
          job_id uuid not null, version integer not null, sold_total_ht_cents bigint,
          material_cents bigint, labor_cents bigint, subcontract_cents bigint,
          equipment_cents bigint, other_cents bigint, source_payload jsonb,
          unique (job_id, version)
        );
        create function auth.uid() returns uuid language sql stable set search_path = '' as $$
          select nullif(current_setting('qa.user_id', true), '')::uuid
        $$;
        create function private.is_org_admin(org_id uuid) returns boolean language sql stable security definer
          set search_path = '' as $$
          select current_setting('qa.org_id', true) = org_id::text
            and current_setting('qa.admin', true) = 'true'
          $$;
        create function private.has_entitlement(org_id uuid, feature text) returns boolean language sql stable security definer
          set search_path = '' as $$
          select current_setting('qa.org_id', true) = org_id::text
            and current_setting('qa.entitled', true) = 'true' and feature in ('purchase_tracking', 'job_management')
          $$;
        grant usage on schema private to authenticated;
        grant execute on function private.is_org_admin(uuid), private.has_entitlement(uuid, text) to authenticated;
        alter table public.estimates enable row level security;
        grant select, insert on public.estimates to authenticated;
        grant select on public.projects to authenticated;
        create policy "Admins read own estimates" on public.estimates for select to authenticated
          using (private.is_org_admin(organization_id));
        create policy "Users can update own estimates" on public.estimates for update to authenticated
          using (true) with check (true);
        create policy "Users can insert estimates for own projects" on public.estimates for insert to authenticated
          with check (private.is_org_admin(organization_id));
      `);
      await db.query('insert into public.organizations (id) values ($1), ($2)', [orgA, orgB]);
      await db.query('insert into public.projects (id, organization_id) values ($1, $2), ($3, $4)', [projectA, orgA, projectB, orgB]);
      await db.query("insert into public.job_cost_entries (organization_id, category, description, amount_ht_cents) values ($1, 'material', 'Sac ciment 25 kg', 1200), ($2, 'material', 'Ciment 25kg', 999)", [orgA, orgB]);

      await db.exec(migration);
      await db.exec(`
        create trigger sync_quote_cost_items_from_estimate
          after insert or update of categories on public.estimates
          for each row execute function private.sync_quote_cost_items_from_estimate();
      `);
      await db.exec(guardMigration);
      await db.exec(backfill);
      await db.exec(backfill);
      expect((await db.query('select count(*)::int as count from public.job_cost_catalog')).rows[0]).toEqual({ count: 2 });

      await db.query("insert into public.job_cost_entries (organization_id, category, description, amount_ht_cents) values ($1, 'material', 'Sac de ciment 25kg', 1500)", [orgA]);
      const catalogA = await db.query<{ description_key: string; amount_ht_cents: number; use_count: number }>(
        'select description_key, amount_ht_cents, use_count from public.job_cost_catalog where organization_id = $1', [orgA],
      );
      expect(catalogA.rows).toHaveLength(1);
      expect(catalogA.rows[0]).toMatchObject({ description_key: 'sac ciment 25kg', use_count: 2 });
      expect(Number(catalogA.rows[0].amount_ht_cents)).toBe(1500);

      await db.query("delete from public.job_cost_entries where organization_id = $1 and description = 'Sac de ciment 25kg'", [orgA]);
      expect((await db.query('select count(*)::int as count from public.job_cost_catalog where organization_id = $1', [orgA])).rows[0]).toEqual({ count: 1 });

      await db.query("select set_config('qa.org_id', $1, false)", [orgA]);
      await db.exec("select set_config('qa.admin', 'true', false); select set_config('qa.entitled', 'true', false);");
      await db.exec('set role authenticated');
      expect((await db.query('select count(*)::int as count from public.job_cost_catalog')).rows[0]).toEqual({ count: 1 });
      await db.exec('reset role');

      await db.query("select set_config('qa.org_id', $1, false)", [orgB]);
      await db.exec('set role authenticated');
      const visibleB = await db.query<{ description: string }>('select description from public.job_cost_catalog');
      expect(visibleB.rows.map((row) => row.description)).toEqual(['Ciment 25kg']);
      await db.exec('reset role');

      await db.exec("select set_config('qa.admin', 'false', false);");
      await db.exec('set role authenticated');
      expect((await db.query('select count(*)::int as count from public.job_cost_catalog')).rows[0]).toEqual({ count: 0 });
      await db.exec('reset role');
      await db.exec('set role anon');
      await expect(db.query('select * from public.job_cost_catalog')).rejects.toThrow();
      await db.exec('reset role');

      await db.exec(`
        insert into public.estimates (id, organization_id, project_id, quote_status, content) values
          ('cccccccc-cccc-4ccc-cccc-cccccccccccc', '${orgA}', '${projectA}', 'draft', 'before'),
          ('dddddddd-dddd-4ddd-dddd-dddddddddddd', '${orgA}', '${projectA}', 'accepted', 'before'),
          ('11111111-1111-4111-8111-111111111111', '${orgA}', '${projectA}', 'sent', 'before');
        update public.estimates set content = 'after' where quote_status = 'draft';
      `);
      await db.exec(`
        update public.estimates set categories =
          '[{"name":"Matériaux","items":[{"poste":"Ciment","materials_cost":10,"amount_ht":20}]}]'::jsonb
          where quote_status = 'draft';
        update public.quote_cost_items set unit_cost_cents = 1250
          where estimate_id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
        update public.estimates set categories =
          '[{"name":"Matériaux","items":[{"cost_line_key":"1-1","poste":"Ciment","materials_cost":15,"amount_ht":25}]}]'::jsonb
          where quote_status = 'draft';
      `);
      expect((await db.query("select source, unit_cost_cents from public.quote_cost_items where estimate_id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'")).rows)
        .toEqual([{ source: 'manual', unit_cost_cents: 1250 }]);
      await db.query("select set_config('qa.org_id', $1, false)", [orgA]);
      await db.exec("select set_config('qa.admin', 'true', false); set role authenticated;");
      await expect(db.query("update public.estimates set total_ht = 42 where quote_status = 'draft' returning id"))
        .rejects.toThrow('Quote line amounts are incomplete');
      expect((await db.query("update public.estimates set total_ht = 42 where quote_status = 'accepted' returning id")).rows).toHaveLength(0);
      expect((await db.query("update public.estimates set total_ht = 42 where quote_status = 'sent' returning id")).rows).toHaveLength(0);
      await expect(db.query("update public.estimates set quote_status = 'sent' where quote_status = 'draft'")).rejects.toThrow();
      await db.exec('reset role');
      expect((await db.query("select private.net_sold_total_ht_cents(100, 120, 12) as cents")).rows[0]).toEqual({ cents: 9000 });
      expect((await db.query("select private.net_sold_total_ht_cents(100, 0, 0) as cents")).rows[0]).toEqual({ cents: 0 });
      const priorRevision = (await db.query<{ revision: number }>("select revision from public.estimates where id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'")).rows[0].revision;
      expect((await db.query("update public.estimates set total_ht = 43 where id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc' and revision = $1 returning revision", [priorRevision])).rows)
        .toEqual([{ revision: priorRevision + 1 }]);
      expect((await db.query("update public.estimates set total_ht = 44 where id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc' and revision = $1 returning revision", [priorRevision])).rows)
        .toEqual([]);
      await db.exec("insert into public.employees (id, organization_id) values ('22222222-2222-4222-8222-222222222222', '" + orgA + "')");
      expect((await db.query("update public.employees set organization_id = organization_id where revision = 0 returning revision")).rows).toEqual([{ revision: 1 }]);
      expect((await db.query("update public.employees set organization_id = organization_id where revision = 0 returning revision")).rows).toEqual([]);
      await db.query("select set_config('qa.org_id', $1, false)", [orgB]);
      await db.exec('set role authenticated');
      expect((await db.query("update public.estimates set total_ht = 99 where quote_status = 'draft' returning id")).rows).toHaveLength(0);
      await db.exec('reset role');
      await expect(db.exec("update public.estimates set content = 'after' where quote_status = 'accepted'")).rejects.toThrow('immutable');
      await expect(db.exec("delete from public.estimates where quote_status = 'accepted'")).rejects.toThrow('immutable');
      expect((await db.query("select content from public.estimates where id = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'")).rows[0]).toEqual({ content: 'before' });
      await db.query("select set_config('qa.org_id', $1, false)", [orgA]);
      await db.exec("select set_config('qa.admin', 'true', false); select set_config('qa.entitled', 'true', false); select set_config('qa.user_id', '33333333-3333-4333-8333-333333333333', false);");
      await db.exec("update public.estimates set total_ht = 100, total_ttc = 120, discount_amount = 12 where id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'");
      const accepted = await db.query<{ accept_estimate_and_create_job: string }>(
        "select public.accept_estimate_and_create_job('cccccccc-cccc-4ccc-cccc-cccccccccccc')",
      );
      const jobId = accepted.rows[0].accept_estimate_and_create_job;
      expect((await db.query('select sold_total_ht_cents, initial_budget_cents from public.jobs where id = $1', [jobId])).rows[0])
        .toEqual({ sold_total_ht_cents: 9000, initial_budget_cents: 1250 });
      expect((await db.query('select sold_total_ht_cents from public.job_budget_snapshots where job_id = $1', [jobId])).rows[0])
        .toEqual({ sold_total_ht_cents: 9000 });
      expect((await db.query("select quote_status from public.estimates where id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'")).rows[0])
        .toEqual({ quote_status: 'accepted' });
      await expect(db.exec("update public.quote_cost_items set unit_cost_cents = 1 where estimate_id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'"))
        .rejects.toThrow('immutable');
      await expect(db.exec("delete from public.quote_cost_items where estimate_id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'"))
        .rejects.toThrow('immutable');
      await expect(db.exec("insert into public.quote_cost_items (organization_id, estimate_id, line_key, category, description) values ('" + orgA + "', 'cccccccc-cccc-4ccc-cccc-cccccccccccc', 'manual-new', 'other', 'Late change')"))
        .rejects.toThrow('immutable');

      // Removing an earlier row must not count a manually overridden later row twice.
      const shiftingEstimateId = '44444444-4444-4444-8444-444444444444';
      await db.query(
        `insert into public.estimates (id, organization_id, project_id, quote_status, categories)
         values ($1, $2, $3, 'draft', $4::jsonb)`,
        [shiftingEstimateId, orgA, projectA, JSON.stringify([{
          name: 'Matériaux', items: [
            { cost_line_key: '1-1', poste: 'Ciment', materials_cost: 10, amount_ht: 20 },
            { cost_line_key: '1-2', poste: 'Peinture', materials_cost: 20, amount_ht: 40 },
          ],
        }])],
      );
      await db.query(
        "update public.quote_cost_items set unit_cost_cents = 2500 where estimate_id = $1 and line_key = '1-2-material'",
        [shiftingEstimateId],
      );
      await db.query(
        'update public.estimates set categories = $2::jsonb where id = $1',
        [shiftingEstimateId, JSON.stringify([{
          name: 'Matériaux', items: [{ cost_line_key: '1-2', poste: 'Peinture', materials_cost: 20, amount_ht: 40 }],
        }])],
      );
      const shiftedCosts = await db.query<{ total: number }>(
        'select sum(unit_cost_cents)::integer as total from public.quote_cost_items where estimate_id = $1',
        [shiftingEstimateId],
      );
      expect(shiftedCosts.rows[0].total).toBe(2500);
      await expect(db.query(
        'update public.estimates set categories = $2::jsonb where id = $1',
        [shiftingEstimateId, JSON.stringify([{ name: 'Matériaux', items: [
          { cost_line_key: '1-2', poste: 'Peinture', materials_cost: 0, labor_cost: 20, amount_ht: 40 },
        ] }])],
      )).rejects.toThrow('Manual quote cost would lose its source line');
      expect((await db.query(
        'select sum(unit_cost_cents)::integer as total from public.quote_cost_items where estimate_id = $1',
        [shiftingEstimateId],
      )).rows[0]).toEqual({ total: 2500 });

      const unkeyedEstimateId = '55555555-5555-4555-8555-555555555555';
      await db.query(
        `insert into public.estimates (id, organization_id, project_id, quote_status, categories)
         values ($1, $2, $3, 'draft', $4::jsonb)`,
        [unkeyedEstimateId, orgA, projectA, JSON.stringify([{
          name: 'Matériaux', items: [
            { poste: 'Ciment', materials_cost: 10, amount_ht: 20 },
            { poste: 'Peinture', materials_cost: 20, amount_ht: 40 },
          ],
        }])],
      );
      await db.query(
        "update public.quote_cost_items set unit_cost_cents = 2500 where estimate_id = $1 and line_key = '1-2-material'",
        [unkeyedEstimateId],
      );
      await expect(db.query(
        'update public.estimates set categories = $2::jsonb where id = $1',
        [unkeyedEstimateId, JSON.stringify([{ name: 'Matériaux', items: [{ poste: 'Peinture', materials_cost: 20, amount_ht: 40 }] }])],
      )).rejects.toThrow('Manual quote cost would lose its source line');
      await expect(db.query(
        'update public.estimates set categories = $2::jsonb where id = $1',
        [unkeyedEstimateId, JSON.stringify([{ name: 'Matériaux', items: [
          { poste: 'Ciment', materials_cost: 12, amount_ht: 22 },
          { poste: 'Peinture', materials_cost: 20, amount_ht: 40 },
        ] }])],
      )).rejects.toThrow('Manual quote cost would lose its source line');
      expect((await db.query(
        'select sum(unit_cost_cents)::integer as total from public.quote_cost_items where estimate_id = $1',
        [unkeyedEstimateId],
      )).rows[0]).toEqual({ total: 3500 });

      const multiVatEstimateId = '66666666-6666-4666-8666-666666666666';
      const multiVatCategories = [
        { name: 'Fourniture', description: '', subtotal_ht: 50, subtotal_tva: 10, subtotal_ttc: 60,
          items: [{ poste: 'Matériau', description: '', quantity: 2, unit: 'u', unit_price_ht: 25,
            amount_ht: 50, tva_percent: 20, tva_amount: 10, amount_ttc: 60 }] },
        { name: 'Pose', description: '', subtotal_ht: 50, subtotal_tva: 5, subtotal_ttc: 55,
          items: [{ poste: 'Main d’œuvre', description: '', quantity: 1, unit: 'h', unit_price_ht: 50,
            amount_ht: 50, tva_percent: 10, tva_amount: 5, amount_ttc: 55 }] },
      ];
      await db.query(
        `insert into public.estimates
          (id, organization_id, project_id, quote_status, categories, total_ht, total_tva,
           total_ttc, total_amount, discount_percent, discount_amount, deposit_required)
         values ($1, $2, $3, 'draft', $4::jsonb, 100, 15, 115, 115, 10, 11.5, 30)`,
        [multiVatEstimateId, orgA, projectA, JSON.stringify(multiVatCategories)],
      );
      await db.query("select set_config('qa.org_id', $1, false)", [orgA]);
      await db.exec("select set_config('qa.admin', 'true', false); set role authenticated;");
      await expect(db.query(
        `insert into public.estimates (id, organization_id, project_id, quote_status, categories, total_ht, total_tva, total_ttc, total_amount)
         values ('77777777-7777-4777-8777-777777777777', $1, $2, 'accepted', $3::jsonb, 100, 15, 115, 115)`,
        [orgA, projectA, JSON.stringify(multiVatCategories)],
      )).rejects.toThrow('Only complete draft quotes may be edited');
      await expect(db.query(
        `insert into public.estimates (id, organization_id, project_id, quote_status, categories, total_ht, total_tva, total_ttc, total_amount)
         values ('88888888-8888-4888-8888-888888888888', $1, $2, 'draft', $3::jsonb, 101, 15, 115, 115)`,
        [orgA, projectA, JSON.stringify(multiVatCategories)],
      )).rejects.toThrow('Quote totals do not match its lines');
      expect((await db.query(
        'update public.estimates set discount_amount = 11.5 where id = $1 returning id',
        [multiVatEstimateId],
      )).rows).toHaveLength(1);
      await expect(db.query(
        'update public.estimates set total_ht = 101 where id = $1',
        [multiVatEstimateId],
      )).rejects.toThrow('Quote totals do not match its lines');
      await expect(db.query(
        'update public.estimates set discount_amount = 12 where id = $1',
        [multiVatEstimateId],
      )).rejects.toThrow('Quote discount or deposit is invalid');
      const forgedCategories = structuredClone(multiVatCategories);
      forgedCategories[0].items[0].amount_ht = 49;
      await expect(db.query(
        'update public.estimates set categories = $2::jsonb where id = $1',
        [multiVatEstimateId, JSON.stringify(forgedCategories)],
      )).rejects.toThrow('Quote line amounts do not match');
      expect((await db.query(
        'select total_ht::float8 as total_ht, total_tva::float8 as total_tva, total_ttc::float8 as total_ttc, discount_amount::float8 as discount_amount from public.estimates where id = $1',
        [multiVatEstimateId],
      )).rows[0]).toMatchObject({ total_ht: 100, total_tva: 15, total_ttc: 115, discount_amount: 11.5 });
      await db.exec('reset role');
      const rejectedEstimateId = '99999999-9999-4999-8999-999999999999';
      await db.query(
        `insert into public.estimates (id, organization_id, project_id, quote_status, categories, total_ht, total_tva, total_ttc, total_amount)
         values ($1, $2, $3, 'rejected', $4::jsonb, 100, 15, 115, 115)`,
        [rejectedEstimateId, orgA, projectA, JSON.stringify(multiVatCategories)],
      );
      await expect(db.query('select public.accept_estimate_and_create_job($1)', [rejectedEstimateId]))
        .rejects.toThrow('Rejected or expired quotes cannot be accepted');
      expect((await db.query('select count(*)::integer as count from public.jobs where source_estimate_id = $1', [rejectedEstimateId])).rows[0])
        .toEqual({ count: 0 });
    } finally {
      await db.close();
    }
  }, 30_000);
});
