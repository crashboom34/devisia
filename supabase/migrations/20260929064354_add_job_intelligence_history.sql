-- Phase F: accepted change orders, immutable performance snapshots and
-- structured historical facts for future same-tenant learning.

create table if not exists public.job_change_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  sold_delta_cents bigint not null default 0 check (sold_delta_cents between -1000000000000 and 1000000000000),
  cost_category text not null default 'other'
    check (cost_category in ('material','labor','subcontract','equipment','transport','consumable','other')),
  planned_cost_delta_cents bigint not null default 0
    check (planned_cost_delta_cents between -1000000000000 and 1000000000000),
  approved_on date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sold_delta_cents <> 0 or planned_cost_delta_cents <> 0),
  check (status <> 'approved' or approved_on is not null)
);

create table if not exists public.job_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot_kind text not null default 'progress' check (snapshot_kind in ('progress', 'completion')),
  progress_percent numeric(5,2) not null check (progress_percent > 0 and progress_percent <= 100),
  initial_sold_total_ht_cents bigint not null check (initial_sold_total_ht_cents >= 0),
  approved_sold_delta_cents bigint not null default 0,
  revised_sold_total_ht_cents bigint not null check (revised_sold_total_ht_cents >= 0),
  initial_budget_cents bigint not null check (initial_budget_cents >= 0),
  approved_budget_delta_cents bigint not null default 0,
  revised_budget_cents bigint not null check (revised_budget_cents >= 0),
  actual_cost_cents bigint not null check (actual_cost_cents >= 0),
  forecast_cost_cents bigint not null check (forecast_cost_cents >= 0),
  planned_margin_cents bigint not null,
  current_margin_cents bigint not null,
  projected_margin_cents bigint not null,
  projected_margin_variance_cents bigint not null,
  approved_change_order_count integer not null default 0 check (approved_change_order_count >= 0),
  planned_by_category jsonb not null default '{}'::jsonb check (jsonb_typeof(planned_by_category) = 'object'),
  actual_by_category jsonb not null default '{}'::jsonb check (jsonb_typeof(actual_by_category) = 'object'),
  classification_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(classification_snapshot) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  captured_at timestamptz not null default now(),
  unique (job_id, version)
);

create index if not exists job_change_orders_job_status_idx
  on public.job_change_orders(job_id, status, created_at desc);
create index if not exists job_change_orders_organization_idx
  on public.job_change_orders(organization_id, created_at desc);
create index if not exists job_performance_snapshots_job_version_idx
  on public.job_performance_snapshots(job_id, version desc);
create index if not exists job_performance_snapshots_org_kind_idx
  on public.job_performance_snapshots(organization_id, snapshot_kind, captured_at desc);

alter table public.job_change_orders enable row level security;
alter table public.job_performance_snapshots enable row level security;

create policy "Members read job change orders"
on public.job_change_orders for select to authenticated
using (
  (select private.is_org_member(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
);

create policy "Admins manage job change orders"
on public.job_change_orders for all to authenticated
using (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
)
with check (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
);

create policy "Members read job performance snapshots"
on public.job_performance_snapshots for select to authenticated
using (
  (select private.is_org_member(organization_id))
  and (select private.has_entitlement(organization_id, 'historical_cost_learning'))
);

revoke all on public.job_change_orders, public.job_performance_snapshots from anon, authenticated;
grant select, insert, update, delete on public.job_change_orders to authenticated;
grant select on public.job_performance_snapshots to authenticated;

create or replace function private.validate_job_intelligence_tenant_links()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not exists (
    select 1 from public.jobs j
    where j.id = new.job_id and j.organization_id = new.organization_id
  ) then
    raise exception using errcode = '23514', message = 'Job intelligence record references another organization';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_job_intelligence_tenant_links() from public, anon;

create or replace function private.protect_approved_job_change_order()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if old.status = 'approved' then
    raise exception 'Approved change orders are immutable; create a correcting change order instead';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.protect_approved_job_change_order() from public, anon;

create or replace function private.validate_job_change_order_financials()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_job public.jobs;
  v_budget public.job_budget_snapshots;
  v_existing_sold_delta bigint := 0;
  v_existing_category_delta bigint := 0;
  v_initial_category bigint := 0;
begin
  if new.status <> 'approved' then return new; end if;

  -- Serialize approvals for a job so concurrent requests cannot both pass
  -- validation against the same previous totals.
  select * into v_job
  from public.jobs
  where id = new.job_id
  for update;

  select * into v_budget
  from public.job_budget_snapshots
  where job_id = new.job_id
  order by version asc
  limit 1;

  if v_job.id is null or v_budget.id is null then
    raise exception 'Job or initial budget snapshot not found';
  end if;

  select
    coalesce(sum(sold_delta_cents), 0)::bigint,
    coalesce(sum(
      case
        when new.cost_category in ('transport', 'consumable', 'other')
          and cost_category in ('transport', 'consumable', 'other') then planned_cost_delta_cents
        when cost_category = new.cost_category then planned_cost_delta_cents
        else 0
      end
    ), 0)::bigint
  into v_existing_sold_delta, v_existing_category_delta
  from public.job_change_orders
  where job_id = new.job_id
    and status = 'approved'
    and id <> new.id;

  v_initial_category := case
    when new.cost_category = 'material' then v_budget.material_cents
    when new.cost_category = 'labor' then v_budget.labor_cents
    when new.cost_category = 'subcontract' then v_budget.subcontract_cents
    when new.cost_category = 'equipment' then v_budget.equipment_cents
    else v_budget.other_cents
  end;

  if v_job.sold_total_ht_cents + v_existing_sold_delta + new.sold_delta_cents < 0 then
    raise exception 'A change order cannot make revised sold total negative';
  end if;
  if v_initial_category + v_existing_category_delta + new.planned_cost_delta_cents < 0 then
    raise exception 'A change order cannot make a revised budget category negative';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_job_change_order_financials() from public, anon;

drop trigger if exists protect_approved_job_change_order on public.job_change_orders;
create trigger protect_approved_job_change_order
before update or delete on public.job_change_orders
for each row execute function private.protect_approved_job_change_order();

drop trigger if exists validate_job_change_order_tenant on public.job_change_orders;
create trigger validate_job_change_order_tenant
before insert or update on public.job_change_orders
for each row execute function private.validate_job_intelligence_tenant_links();

drop trigger if exists validate_job_change_order_financials on public.job_change_orders;
create trigger validate_job_change_order_financials
before insert or update on public.job_change_orders
for each row execute function private.validate_job_change_order_financials();

drop trigger if exists validate_job_performance_snapshot_tenant on public.job_performance_snapshots;
create trigger validate_job_performance_snapshot_tenant
before insert on public.job_performance_snapshots
for each row execute function private.validate_job_intelligence_tenant_links();

drop trigger if exists normalize_job_change_orders_created_by on public.job_change_orders;
create trigger normalize_job_change_orders_created_by
before insert or update on public.job_change_orders
for each row execute function private.normalize_created_by();

drop trigger if exists set_job_change_orders_updated_at on public.job_change_orders;
create trigger set_job_change_orders_updated_at
before update on public.job_change_orders
for each row execute function public.update_updated_at_column();

drop trigger if exists normalize_job_performance_snapshots_created_by on public.job_performance_snapshots;
create trigger normalize_job_performance_snapshots_created_by
before insert on public.job_performance_snapshots
for each row execute function private.normalize_created_by();

create or replace function private.capture_job_performance_snapshot(
  p_job_id uuid,
  p_progress_percent numeric,
  p_complete boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_budget public.job_budget_snapshots;
  v_snapshot_id uuid;
  v_version integer;
  v_kind text := case when p_complete then 'completion' else 'progress' end;
  v_approved_count integer := 0;
  v_sold_delta bigint := 0;
  v_material_delta bigint := 0;
  v_labor_delta bigint := 0;
  v_subcontract_delta bigint := 0;
  v_equipment_delta bigint := 0;
  v_other_delta bigint := 0;
  v_actual_material bigint := 0;
  v_actual_labor bigint := 0;
  v_actual_subcontract bigint := 0;
  v_actual_equipment bigint := 0;
  v_actual_other bigint := 0;
  v_revised_sold bigint;
  v_revised_material bigint;
  v_revised_labor bigint;
  v_revised_subcontract bigint;
  v_revised_equipment bigint;
  v_revised_other bigint;
  v_revised_budget bigint;
  v_actual_total bigint;
  v_forecast bigint;
  v_planned_margin bigint;
  v_current_margin bigint;
  v_projected_margin bigint;
  v_classification jsonb := '{}'::jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_progress_percent is null or p_progress_percent <= 0 or p_progress_percent > 100 then
    raise exception 'Progress must be between 0 and 100';
  end if;
  if p_complete and p_progress_percent <> 100 then
    raise exception 'A completed job must be captured at 100 percent';
  end if;

  select * into v_job from public.jobs where id = p_job_id for update;
  if v_job.id is null
     or not private.is_org_admin(v_job.organization_id)
     or not private.has_entitlement(v_job.organization_id, 'historical_cost_learning') then
    raise exception 'Job not found';
  end if;
  if p_complete and v_job.status = 'completed' then
    raise exception 'Job is already completed';
  end if;

  select * into v_budget
  from public.job_budget_snapshots
  where job_id = v_job.id
  order by version asc
  limit 1;
  if v_budget.id is null then raise exception 'Initial budget snapshot not found'; end if;

  select
    count(*)::integer,
    coalesce(sum(sold_delta_cents), 0)::bigint,
    coalesce(sum(case when cost_category = 'material' then planned_cost_delta_cents else 0 end), 0)::bigint,
    coalesce(sum(case when cost_category = 'labor' then planned_cost_delta_cents else 0 end), 0)::bigint,
    coalesce(sum(case when cost_category = 'subcontract' then planned_cost_delta_cents else 0 end), 0)::bigint,
    coalesce(sum(case when cost_category = 'equipment' then planned_cost_delta_cents else 0 end), 0)::bigint,
    coalesce(sum(case when cost_category in ('transport','consumable','other') then planned_cost_delta_cents else 0 end), 0)::bigint
  into v_approved_count, v_sold_delta, v_material_delta, v_labor_delta,
       v_subcontract_delta, v_equipment_delta, v_other_delta
  from public.job_change_orders
  where job_id = v_job.id and status = 'approved';

  v_revised_sold := v_job.sold_total_ht_cents + v_sold_delta;
  v_revised_material := v_budget.material_cents + v_material_delta;
  v_revised_labor := v_budget.labor_cents + v_labor_delta;
  v_revised_subcontract := v_budget.subcontract_cents + v_subcontract_delta;
  v_revised_equipment := v_budget.equipment_cents + v_equipment_delta;
  v_revised_other := v_budget.other_cents + v_other_delta;
  if v_revised_sold < 0 or v_revised_material < 0 or v_revised_labor < 0
     or v_revised_subcontract < 0 or v_revised_equipment < 0 or v_revised_other < 0 then
    raise exception 'A change order cannot make revised totals negative';
  end if;
  v_revised_budget := v_revised_material + v_revised_labor + v_revised_subcontract + v_revised_equipment + v_revised_other;

  select
    coalesce(sum(case when category = 'material' then amount_ht_cents else 0 end), 0)::bigint,
    coalesce(sum(case when category = 'subcontract' then amount_ht_cents else 0 end), 0)::bigint,
    coalesce(sum(case when category = 'equipment' then amount_ht_cents else 0 end), 0)::bigint,
    coalesce(sum(case when category in ('transport','consumable','other') then amount_ht_cents else 0 end), 0)::bigint
  into v_actual_material, v_actual_subcontract, v_actual_equipment, v_actual_other
  from public.job_cost_entries where job_id = v_job.id;

  select coalesce(sum(round(minutes * hourly_cost_cents_snapshot / 60.0)), 0)::bigint
  into v_actual_labor
  from public.time_entries where job_id = v_job.id;

  v_actual_total := v_actual_material + v_actual_labor + v_actual_subcontract + v_actual_equipment + v_actual_other;
  v_forecast := case when p_complete then v_actual_total else round(v_actual_total * 100 / p_progress_percent)::bigint end;
  v_planned_margin := v_revised_sold - v_revised_budget;
  v_current_margin := v_revised_sold - v_actual_total;
  v_projected_margin := v_revised_sold - v_forecast;

  select jsonb_build_object(
    'project_type', qc.project_type,
    'trades', qc.trades,
    'lots', qc.lots,
    'complexity', qc.complexity,
    'confidence', qc.confidence
  ) into v_classification
  from public.quote_classifications qc
  where qc.project_id = v_job.source_project_id;
  v_classification := coalesce(v_classification, '{}'::jsonb);

  select coalesce(max(version), 0) + 1 into v_version
  from public.job_performance_snapshots where job_id = v_job.id;

  insert into public.job_performance_snapshots(
    organization_id, job_id, version, snapshot_kind, progress_percent,
    initial_sold_total_ht_cents, approved_sold_delta_cents, revised_sold_total_ht_cents,
    initial_budget_cents, approved_budget_delta_cents, revised_budget_cents,
    actual_cost_cents, forecast_cost_cents, planned_margin_cents, current_margin_cents,
    projected_margin_cents, projected_margin_variance_cents, approved_change_order_count,
    planned_by_category, actual_by_category, classification_snapshot, created_by
  ) values (
    v_job.organization_id, v_job.id, v_version, v_kind, p_progress_percent,
    v_job.sold_total_ht_cents, v_sold_delta, v_revised_sold,
    v_job.initial_budget_cents, v_revised_budget - v_job.initial_budget_cents, v_revised_budget,
    v_actual_total, v_forecast, v_planned_margin, v_current_margin,
    v_projected_margin, v_projected_margin - v_planned_margin, v_approved_count,
    jsonb_build_object(
      'material', v_revised_material, 'labor', v_revised_labor,
      'subcontract', v_revised_subcontract, 'equipment', v_revised_equipment, 'other', v_revised_other
    ),
    jsonb_build_object(
      'material', v_actual_material, 'labor', v_actual_labor,
      'subcontract', v_actual_subcontract, 'equipment', v_actual_equipment, 'other', v_actual_other
    ),
    v_classification, v_user_id
  ) returning id into v_snapshot_id;

  if p_complete then
    update public.jobs
    set status = 'completed', completed_on = current_date, updated_at = now()
    where id = v_job.id;
  end if;

  return v_snapshot_id;
end;
$$;

revoke all on function private.capture_job_performance_snapshot(uuid, numeric, boolean) from public, anon;
grant execute on function private.capture_job_performance_snapshot(uuid, numeric, boolean) to authenticated;

create or replace function public.capture_job_performance_snapshot(
  p_job_id uuid,
  p_progress_percent numeric,
  p_complete boolean default false
)
returns uuid
language sql
volatile
security invoker
set search_path = public, private
as $$
  select private.capture_job_performance_snapshot(p_job_id, p_progress_percent, p_complete);
$$;

revoke all on function public.capture_job_performance_snapshot(uuid, numeric, boolean) from public, anon;
grant execute on function public.capture_job_performance_snapshot(uuid, numeric, boolean) to authenticated;

comment on table public.job_change_orders is
  'Avenants de chantier. Seuls les avenants approuvés révisent le vendu et le budget.';
comment on table public.job_performance_snapshots is
  'Historique immuable prévu-réel-projection, utilisable comme faits structurés pour l apprentissage futur du tenant.';
