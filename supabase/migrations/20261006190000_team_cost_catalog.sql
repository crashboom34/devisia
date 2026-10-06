-- Salaries remain visible only through the existing admin-only employees RLS policies.
alter table public.employees
  add column if not exists other_monthly_employer_cost_cents integer not null default 0
  check (other_monthly_employer_cost_cents >= 0);

alter table public.employees
  add column if not exists cost_source text not null default 'legacy'
  check (cost_source in ('legacy', 'urssaf', 'manual'));

-- Keep the trigger and the historical backfill on one conservative key rule.
create or replace function private.job_cost_catalog_key(raw_description text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(
      lower(regexp_replace(btrim(raw_description), '[[:space:]]+', ' ', 'g')),
      '(^| )de ', '\1', 'g'
    ),
    '([0-9]) (kg|g|ml|l|mm|cm|m)([0-9]*)( |$)', '\1\2\3\4', 'g'
  );
$$;

revoke all on function private.job_cost_catalog_key(text) from public, anon, authenticated;

-- Reusable organization-scoped purchase catalogue. Only admins with purchase
-- tracking can read it. Entries are written by a trigger on authorized costs.
create table if not exists public.job_cost_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null check (category in ('material','subcontract','equipment','transport','consumable','other')),
  description text not null check (char_length(description) between 1 and 160),
  description_key text not null check (char_length(description_key) between 1 and 160),
  amount_ht_cents bigint not null check (amount_ht_cents >= 0),
  use_count integer not null default 1 check (use_count > 0),
  last_used_at timestamptz not null default now(),
  unique (organization_id, category, description_key)
);

create index if not exists job_cost_catalog_recent_idx
  on public.job_cost_catalog (organization_id, category, last_used_at desc);

alter table public.job_cost_catalog enable row level security;
revoke all on public.job_cost_catalog from public, anon, authenticated;
grant select on public.job_cost_catalog to authenticated;

drop policy if exists "Admins read own purchase catalog" on public.job_cost_catalog;
create policy "Admins read own purchase catalog" on public.job_cost_catalog
  for select to authenticated
  using (private.is_org_admin(organization_id) and private.has_entitlement(organization_id, 'purchase_tracking'));

create or replace function private.remember_job_cost_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_key text;
begin
  normalized_key := private.job_cost_catalog_key(new.description);
  if normalized_key = '' or char_length(btrim(new.description)) > 160 then return new; end if;
  insert into public.job_cost_catalog
    (organization_id, category, description, description_key, amount_ht_cents)
  values
    (new.organization_id, new.category, btrim(new.description), normalized_key, new.amount_ht_cents)
  on conflict (organization_id, category, description_key)
  do update set
    description = excluded.description,
    amount_ht_cents = excluded.amount_ht_cents,
    use_count = job_cost_catalog.use_count + 1,
    last_used_at = now();
  return new;
end;
$$;

revoke all on function private.remember_job_cost_catalog() from public, anon, authenticated;

drop trigger if exists remember_job_cost_catalog_after_insert on public.job_cost_entries;
create trigger remember_job_cost_catalog_after_insert
  after insert on public.job_cost_entries
  for each row execute function private.remember_job_cost_catalog();

-- A validated quote has already fixed a job budget. Changes after acceptance
-- must be represented by a job change order, not by rewriting or deleting it.
create or replace function private.prevent_accepted_estimate_content_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.quote_status = 'accepted' then
    raise exception 'Accepted estimates are immutable; create a change order instead';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.prevent_accepted_estimate_content_change() from public, anon, authenticated;

drop trigger if exists prevent_accepted_estimate_content_change on public.estimates;
create trigger prevent_accepted_estimate_content_change
  before update or delete on public.estimates
  for each row execute function private.prevent_accepted_estimate_content_change();

-- The existing client had UPDATE privilege but no UPDATE RLS policy. Permit
-- manual editing of drafts only for organization admins, and only on quote content.
-- Status and tenant/source identifiers remain writable solely by trusted RPCs.
revoke update on public.estimates from authenticated;
grant update (
  categories, total_ht, total_tva, total_ttc, total_amount,
  discount_percent, discount_amount, client_name, payment_terms,
  execution_delay, deposit_required, special_conditions
) on public.estimates to authenticated;

drop policy if exists "Admins edit draft quotes" on public.estimates;
create policy "Admins edit draft quotes" on public.estimates
  for update to authenticated
  using (
    quote_status = 'draft'
    and private.is_org_admin(organization_id)
    and exists (
      select 1 from public.projects p
      where p.id = estimates.project_id and p.organization_id = estimates.organization_id
    )
  )
  with check (
    quote_status = 'draft'
    and private.is_org_admin(organization_id)
    and exists (
      select 1 from public.projects p
      where p.id = estimates.project_id and p.organization_id = estimates.organization_id
    )
  );
