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
-- Remove an older permissive owner policy if present: permissive policies OR
-- together and would otherwise make sent/rejected quotes writable.
drop policy if exists "Users can update own estimates" on public.estimates;
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

-- Optimistic revision tokens prevent a second browser tab from silently
-- overwriting a more recent employee or draft quote save.
alter table public.employees add column if not exists revision bigint not null default 0;
alter table public.estimates add column if not exists revision bigint not null default 0;

create or replace function private.bump_row_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
revoke all on function private.bump_row_revision() from public, anon, authenticated;

drop trigger if exists bump_employee_revision on public.employees;
create trigger bump_employee_revision before update on public.employees
  for each row execute function private.bump_row_revision();
drop trigger if exists bump_estimate_revision on public.estimates;
create trigger bump_estimate_revision before update on public.estimates
  for each row execute function private.bump_row_revision();

-- A cost row edited by an admin becomes a manual override. Rebuilding quote
-- categories only replaces generated rows; it must not erase those overrides.
create or replace function private.mark_quote_cost_override()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.source in ('estimate', 'estimate-unallocated')
     and (new.source is null or new.source = old.source)
     and (to_jsonb(new) - 'updated_at' - 'source')
         is distinct from (to_jsonb(old) - 'updated_at' - 'source') then
    new.source := 'manual';
  end if;
  return new;
end;
$$;
revoke all on function private.mark_quote_cost_override() from public, anon, authenticated;
drop trigger if exists mark_quote_cost_override on public.quote_cost_items;
create trigger mark_quote_cost_override before update on public.quote_cost_items
  for each row execute function private.mark_quote_cost_override();

create or replace function private.prevent_accepted_quote_cost_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_estimate_id uuid;
begin
  target_estimate_id := case when tg_op = 'INSERT' then new.estimate_id else old.estimate_id end;
  if exists (
    select 1 from public.estimates
    where id = target_estimate_id and quote_status = 'accepted'
  ) then
    raise exception 'Accepted quote cost items are immutable';
  end if;
  if tg_op = 'UPDATE' and new.estimate_id is distinct from old.estimate_id
     and exists (select 1 from public.estimates where id = new.estimate_id and quote_status = 'accepted') then
    raise exception 'Accepted quote cost items are immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.prevent_accepted_quote_cost_change() from public, anon, authenticated;
drop trigger if exists prevent_accepted_quote_cost_change on public.quote_cost_items;
create trigger prevent_accepted_quote_cost_change
  before insert or update or delete on public.quote_cost_items
  for each row execute function private.prevent_accepted_quote_cost_change();

create or replace function private.sync_quote_cost_items_from_estimate()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_category record;
  v_item record;
  v_material_cents bigint;
  v_labor_cents bigint;
  v_sale_cents bigint;
  v_description text;
begin
  if new.estimate_kind <> 'quote' then return new; end if;
  delete from public.quote_cost_items
    where estimate_id = new.id and source in ('estimate', 'estimate-unallocated');

  for v_category in
    select value, ordinality from jsonb_array_elements(coalesce(new.categories, '[]'::jsonb)) with ordinality
  loop
    for v_item in
      select value, ordinality from jsonb_array_elements(coalesce(v_category.value->'items', '[]'::jsonb)) with ordinality
    loop
      v_material_cents := case when jsonb_typeof(v_item.value->'materials_cost') = 'number'
        then greatest(round((v_item.value->>'materials_cost')::numeric * 100)::bigint, 0) else 0 end;
      v_labor_cents := case when jsonb_typeof(v_item.value->'labor_cost') = 'number'
        then greatest(round((v_item.value->>'labor_cost')::numeric * 100)::bigint, 0) else 0 end;
      v_sale_cents := case when jsonb_typeof(v_item.value->'amount_ht') = 'number'
        then greatest(round((v_item.value->>'amount_ht')::numeric * 100)::bigint, 0) else 0 end;
      v_description := left(coalesce(nullif(v_item.value->>'poste', ''), 'Poste sans nom'), 500);

      if v_material_cents > 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, quantity,
          unit, unit_cost_cents, sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-material',
          'material', v_description, 1, 'forfait', v_material_cents, v_sale_cents, 'estimate'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
      if v_labor_cents > 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, planned_minutes,
          hourly_cost_cents, sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-labor',
          'labor', v_description, 60, v_labor_cents, case when v_material_cents = 0 then v_sale_cents else 0 end, 'estimate'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
      if v_material_cents = 0 and v_labor_cents = 0 then
        insert into public.quote_cost_items(
          organization_id, estimate_id, line_key, category, description, other_cost_cents,
          sale_price_cents, source
        ) values (
          new.organization_id, new.id, v_category.ordinality || '-' || v_item.ordinality || '-unallocated',
          'other', v_description, 0, v_sale_cents, 'estimate-unallocated'
        ) on conflict (estimate_id, line_key) do nothing;
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

-- The quote keeps gross HT and a separate TTC discount for display. A job
-- snapshot must store net sold HT, proportionally allocated across VAT rates.
create or replace function private.net_sold_total_ht_cents(
  p_total_ht numeric, p_total_ttc numeric, p_discount_amount numeric
)
returns bigint language sql immutable set search_path = '' as $$
  select case when coalesce(p_total_ttc, 0) <= 0 then 0::bigint
    else round(
      greatest(coalesce(p_total_ht, 0), 0)
      * (1 - least(greatest(coalesce(p_discount_amount, 0), 0), p_total_ttc) / p_total_ttc)
      * 100
    )::bigint
  end;
$$;
revoke all on function private.net_sold_total_ht_cents(numeric, numeric, numeric) from public, anon, authenticated;

create or replace function public.accept_estimate_and_create_job(p_estimate_id uuid)
returns uuid language plpgsql security definer set search_path = public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_estimate public.estimates;
  v_project public.projects;
  v_job_id uuid;
  v_sold_total_ht_cents bigint;
  v_material bigint := 0;
  v_labor bigint := 0;
  v_subcontract bigint := 0;
  v_equipment bigint := 0;
  v_other bigint := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_estimate from public.estimates
    where id = p_estimate_id and estimate_kind = 'quote' for update;
  if v_estimate.id is null
     or not private.is_org_admin(v_estimate.organization_id)
     or not private.has_entitlement(v_estimate.organization_id, 'job_management') then
    raise exception 'Estimate not found';
  end if;
  if v_estimate.quote_status = 'accepted' then raise exception 'Estimate already accepted'; end if;
  select * into v_project from public.projects where id = v_estimate.project_id;
  v_sold_total_ht_cents := private.net_sold_total_ht_cents(
    v_estimate.total_ht, v_estimate.total_ttc, v_estimate.discount_amount
  );

  select
    coalesce(sum(case when category = 'material' then round(quantity * unit_cost_cents)::bigint else 0 end),0),
    coalesce(sum(case when category = 'labor' then round(planned_minutes * hourly_cost_cents / 60.0)::bigint else 0 end),0),
    coalesce(sum(case when category = 'subcontract' then other_cost_cents else 0 end),0),
    coalesce(sum(case when category = 'equipment' then other_cost_cents else 0 end),0),
    coalesce(sum(case when category in ('transport','consumable','other') then other_cost_cents else 0 end),0)
  into v_material, v_labor, v_subcontract, v_equipment, v_other
  from public.quote_cost_items where estimate_id = v_estimate.id;

  insert into public.jobs(
    organization_id, source_estimate_id, source_project_id, name, client_name, address,
    sold_total_ht_cents, initial_budget_cents, created_by
  ) values (
    v_estimate.organization_id, v_estimate.id, v_project.id, v_project.title,
    coalesce(v_estimate.client_name, v_project.client_name), v_project.client_address,
    v_sold_total_ht_cents,
    v_material + v_labor + v_subcontract + v_equipment + v_other, v_user_id
  )
  on conflict (source_estimate_id) do update set updated_at = now()
  returning id into v_job_id;

  insert into public.job_budget_snapshots(
    organization_id, job_id, version, sold_total_ht_cents, material_cents, labor_cents,
    subcontract_cents, equipment_cents, other_cents, source_payload
  ) values (
    v_estimate.organization_id, v_job_id, 1, v_sold_total_ht_cents,
    v_material, v_labor, v_subcontract, v_equipment, v_other,
    jsonb_build_object('estimate_id', v_estimate.id, 'captured_at', now())
  ) on conflict (job_id, version) do nothing;

  update public.estimates set quote_status = 'accepted' where id = v_estimate.id;
  return v_job_id;
end;
$$;
