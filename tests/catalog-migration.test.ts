import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261006190000_team_cost_catalog.sql'), 'utf8');
const backfill = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261006190100_job_cost_catalog_backfill.sql'), 'utf8');
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
        create schema private;
        create table public.organizations (id uuid primary key);
        create table public.employees (id uuid primary key, organization_id uuid references public.organizations(id));
        create table public.job_cost_entries (
          id uuid primary key default gen_random_uuid(),
          organization_id uuid not null references public.organizations(id),
          category text not null, description text not null,
          amount_ht_cents bigint not null, created_at timestamptz not null default now()
        );
        create table public.projects (id uuid primary key, organization_id uuid not null references public.organizations(id));
        create table public.estimates (
          id uuid primary key, organization_id uuid not null references public.organizations(id),
          project_id uuid not null references public.projects(id), quote_status text not null,
          categories jsonb, total_ht numeric, total_tva numeric, total_ttc numeric, total_amount numeric,
          discount_percent numeric, discount_amount numeric, client_name text, payment_terms text,
          execution_delay text, deposit_required numeric, special_conditions text, content text
        );
        create function private.is_org_admin(org_id uuid) returns boolean language sql stable security definer
          set search_path = '' as $$
          select current_setting('qa.org_id', true) = org_id::text
            and current_setting('qa.admin', true) = 'true'
          $$;
        create function private.has_entitlement(org_id uuid, feature text) returns boolean language sql stable security definer
          set search_path = '' as $$
          select current_setting('qa.org_id', true) = org_id::text
            and current_setting('qa.entitled', true) = 'true' and feature = 'purchase_tracking'
          $$;
        grant usage on schema private to authenticated;
        grant execute on function private.is_org_admin(uuid), private.has_entitlement(uuid, text) to authenticated;
        alter table public.estimates enable row level security;
        grant select on public.estimates to authenticated;
        grant select on public.projects to authenticated;
        create policy "Admins read own estimates" on public.estimates for select to authenticated
          using (private.is_org_admin(organization_id));
      `);
      await db.query('insert into public.organizations (id) values ($1), ($2)', [orgA, orgB]);
      await db.query('insert into public.projects (id, organization_id) values ($1, $2), ($3, $4)', [projectA, orgA, projectB, orgB]);
      await db.query("insert into public.job_cost_entries (organization_id, category, description, amount_ht_cents) values ($1, 'material', 'Sac ciment 25 kg', 1200), ($2, 'material', 'Ciment 25kg', 999)", [orgA, orgB]);

      await db.exec(migration);
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
      await db.query("select set_config('qa.org_id', $1, false)", [orgA]);
      await db.exec("select set_config('qa.admin', 'true', false); set role authenticated;");
      expect((await db.query("update public.estimates set total_ht = 42 where quote_status = 'draft' returning id")).rows).toHaveLength(1);
      expect((await db.query("update public.estimates set total_ht = 42 where quote_status = 'accepted' returning id")).rows).toHaveLength(0);
      expect((await db.query("update public.estimates set total_ht = 42 where quote_status = 'sent' returning id")).rows).toHaveLength(0);
      await expect(db.query("update public.estimates set quote_status = 'sent' where quote_status = 'draft'")).rejects.toThrow();
      await db.exec('reset role');
      await db.query("select set_config('qa.org_id', $1, false)", [orgB]);
      await db.exec('set role authenticated');
      expect((await db.query("update public.estimates set total_ht = 99 where quote_status = 'draft' returning id")).rows).toHaveLength(0);
      await db.exec('reset role');
      await expect(db.exec("update public.estimates set content = 'after' where quote_status = 'accepted'")).rejects.toThrow('immutable');
      await expect(db.exec("delete from public.estimates where quote_status = 'accepted'")).rejects.toThrow('immutable');
      expect((await db.query("select content from public.estimates where quote_status = 'accepted'")).rows[0]).toEqual({ content: 'before' });
    } finally {
      await db.close();
    }
  }, 30_000);
});
