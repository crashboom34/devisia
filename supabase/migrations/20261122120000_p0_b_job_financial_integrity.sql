-- Phase 1: install the common financial contract before switching frontend traffic.
-- Preserve existing rows and the legacy read privileges until phase 2.
revoke insert, update, delete, truncate on public.jobs from public, anon, authenticated;
grant update (name, client_name, address, started_on, updated_at)
  on public.jobs to authenticated;
revoke insert, update, delete, truncate on public.job_budget_snapshots from public, anon, authenticated;
drop policy "Admins create budget snapshots" on public.job_budget_snapshots;

create function private.protect_job_financial_history()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name <> 'jobs' or tg_op = 'DELETE' then
    raise exception using errcode = '23514', message = 'Job financial history is immutable';
  end if;
  if (new.id, new.organization_id, new.source_estimate_id, new.source_project_id,
      new.sold_total_ht_cents, new.initial_budget_cents)
       is distinct from
     (old.id, old.organization_id, old.source_estimate_id, old.source_project_id,
      old.sold_total_ht_cents, old.initial_budget_cents) then
    raise exception using errcode = '23514', message = 'Job contractual baseline is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_job_financial_history() from public, anon, authenticated;
create trigger protect_job_financial_history before update or delete on public.jobs
for each row execute function private.protect_job_financial_history();
create trigger protect_budget_history before update or delete on public.job_budget_snapshots
for each row execute function private.protect_job_financial_history();
create trigger protect_performance_history before update or delete on public.job_performance_snapshots
for each row execute function private.protect_job_financial_history();

-- Keep the accepted project in the same tenant as its frozen source references.
create function private.protect_contract_project_organization()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.organization_id is distinct from old.organization_id
     and exists (select 1 from public.jobs j where j.source_project_id = old.id) then
    raise exception using errcode = '23514', message = 'Contractual project organization is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_contract_project_organization() from public, anon, authenticated;
create trigger protect_contract_project_organization before update of organization_id on public.projects
for each row execute function private.protect_contract_project_organization();

create function private.job_budget_category(p_category text)
returns text language sql immutable strict set search_path = '' as $$
  select case when p_category in ('transport', 'consumable') then 'other' else p_category end;
$$;

create function private.require_job_budget_v1(p_job public.jobs)
returns public.job_budget_snapshots language plpgsql stable set search_path = '' as $$
declare
  v_budget public.job_budget_snapshots;
begin
  select * into v_budget from public.job_budget_snapshots b
  where b.job_id = p_job.id and b.version = 1 and b.organization_id = p_job.organization_id;
  if not found then
    raise exception using errcode = '23514', message = 'Initial budget snapshot not found';
  end if;
  if v_budget.sold_total_ht_cents <> p_job.sold_total_ht_cents
     or v_budget.material_cents::numeric + v_budget.labor_cents + v_budget.subcontract_cents
        + v_budget.equipment_cents + v_budget.other_cents <> p_job.initial_budget_cents
     or least(v_budget.material_cents, v_budget.labor_cents, v_budget.subcontract_cents,
              v_budget.equipment_cents, v_budget.other_cents) < 0
     or not exists (
       select 1 from public.estimates e join public.projects p on p.id = e.project_id
       where e.id = p_job.source_estimate_id and e.estimate_kind = 'quote' and e.quote_status = 'accepted'
         and p.id = p_job.source_project_id and p.organization_id = p_job.organization_id
         and e.organization_id = p_job.organization_id
     ) then
    raise exception using errcode = '23514', message = 'Inconsistent contractual job baseline';
  end if;
  return v_budget;
end;
$$;

create or replace function private.validate_job_change_order_financials()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_budget public.job_budget_snapshots;
  v_category text := private.job_budget_category(new.cost_category);
  v_sold_delta numeric;
  v_category_delta numeric;
  v_initial_category bigint;
begin
  if new.status <> 'approved' then return new; end if;

  -- Write the parent row to serialize approvals. Under stronger isolation a
  -- stale concurrent transaction must retry instead of validating a stale sum.
  update public.jobs j set updated_at = pg_catalog.clock_timestamp()
    where j.id = new.job_id and j.organization_id = new.organization_id
      and private.is_org_admin(j.organization_id)
      and private.has_entitlement(j.organization_id, 'job_management')
    returning * into v_job;
  if not found then
    raise exception using errcode = '42501', message = 'Job not found or access denied';
  end if;
  v_budget := private.require_job_budget_v1(v_job);

  select coalesce(sum(sold_delta_cents), 0),
         coalesce(sum(planned_cost_delta_cents) filter (where private.job_budget_category(cost_category) = v_category), 0)
  into v_sold_delta, v_category_delta
  from public.job_change_orders
  where job_id = v_job.id and organization_id = v_job.organization_id
    and status = 'approved' and id <> new.id;

  v_initial_category := case v_category
    when 'material' then v_budget.material_cents
    when 'labor' then v_budget.labor_cents
    when 'subcontract' then v_budget.subcontract_cents
    when 'equipment' then v_budget.equipment_cents
    else v_budget.other_cents
  end;
  if v_budget.sold_total_ht_cents + v_sold_delta + new.sold_delta_cents < 0 then
    raise exception 'A change order cannot make revised sold total negative';
  end if;
  if v_initial_category + v_category_delta + new.planned_cost_delta_cents < 0 then
    raise exception 'A change order cannot make a revised budget category negative';
  end if;
  return new;
end;
$$;

create function private.calculate_job_financial_summary(p_job public.jobs)
returns table (
  initial_sold_total_ht_cents bigint, initial_budget_cents bigint,
  approved_change_order_count integer, approved_sold_delta_cents bigint, approved_budget_delta_cents bigint,
  revised_sold_total_ht_cents bigint, revised_budget_cents bigint, actual_cost_cents bigint,
  planned_margin_cents bigint, current_margin_cents bigint, planned_by_category jsonb, actual_by_category jsonb
)
language plpgsql stable set search_path = '' as $$
declare
  v_budget public.job_budget_snapshots := private.require_job_budget_v1(p_job);
begin
  initial_sold_total_ht_cents := v_budget.sold_total_ht_cents;
  initial_budget_cents := p_job.initial_budget_cents;

  with delta as (
    select private.job_budget_category(cost_category) as category, count(*)::integer as entries,
           sum(sold_delta_cents) as sold_delta, sum(planned_cost_delta_cents) as amount
    from public.job_change_orders
    where job_id = p_job.id and organization_id = p_job.organization_id and status = 'approved'
    group by 1
  ), expenses as (
    select private.job_budget_category(category) as category, sum(amount_ht_cents) as amount
    from public.job_cost_entries
    where job_id = p_job.id and organization_id = p_job.organization_id
    group by 1
    union all
    select 'labor', sum(round(minutes::numeric * hourly_cost_cents_snapshot / 60))
    from public.time_entries
    where job_id = p_job.id and organization_id = p_job.organization_id
  ), by_category as (
    select initial.category, coalesce(delta.entries, 0) as entries, coalesce(delta.sold_delta, 0) as sold_delta,
           coalesce(delta.amount, 0) as budget_delta, initial.amount + coalesce(delta.amount, 0) as planned,
           coalesce(expenses.amount, 0) as actual
    from (values ('material', v_budget.material_cents), ('labor', v_budget.labor_cents),
           ('subcontract', v_budget.subcontract_cents), ('equipment', v_budget.equipment_cents),
           ('other', v_budget.other_cents)) as initial(category, amount)
    left join delta using (category)
    left join expenses using (category)
  )
  select sum(entries), sum(sold_delta), sum(budget_delta), sum(planned), sum(actual),
         jsonb_object_agg(category, planned), jsonb_object_agg(category, actual)
  into approved_change_order_count, approved_sold_delta_cents, approved_budget_delta_cents,
       revised_budget_cents, actual_cost_cents, planned_by_category, actual_by_category
  from by_category;

  revised_sold_total_ht_cents := initial_sold_total_ht_cents + approved_sold_delta_cents;
  if revised_sold_total_ht_cents < 0 or exists (
    select 1 from pg_catalog.jsonb_each_text(planned_by_category) as budget where budget.value::numeric < 0
  ) then
    raise exception using errcode = '23514', message = 'A change order cannot make revised totals negative';
  end if;
  planned_margin_cents := revised_sold_total_ht_cents - revised_budget_cents;
  current_margin_cents := revised_sold_total_ht_cents - actual_cost_cents;
  return next;
end;
$$;

revoke all on function private.job_budget_category(text),
  private.require_job_budget_v1(public.jobs), private.calculate_job_financial_summary(public.jobs)
  from public, anon, authenticated;

create function public.get_job_financial_summary(p_job_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_job public.jobs;
begin
  select j.* into v_job from public.jobs j
  where j.id = p_job_id and private.is_org_admin(j.organization_id)
    and private.has_entitlement(j.organization_id, 'job_management');
  if not found then
    raise exception using errcode = '42501', message = 'Job not found or access denied';
  end if;
  return (select to_jsonb(summary) from private.calculate_job_financial_summary(v_job) summary);
end;
$$;

revoke all on function public.get_job_financial_summary(uuid) from public, anon, authenticated;
grant execute on function public.get_job_financial_summary(uuid) to authenticated;

-- During the frontend transition, retain the precision accepted by old clients.
create function private.validate_job_snapshot_progress(p_progress_percent numeric)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if p_progress_percent is null or p_progress_percent <= 0 or p_progress_percent > 100 then
    raise exception 'Progress must be between 0 and 100';
  end if;
end;
$$;

revoke all on function private.validate_job_snapshot_progress(numeric) from public, anon, authenticated;

create or replace function private.capture_job_performance_snapshot(
  p_job_id uuid, p_progress_percent numeric, p_complete boolean default false
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_job public.jobs;
  v_summary record;
  v_snapshot_id uuid;
  v_version integer;
  v_forecast bigint;
  v_projected_margin bigint;
  v_classification jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  perform private.validate_job_snapshot_progress(p_progress_percent);
  if p_complete is null or (p_complete and p_progress_percent <> 100) then
    raise exception 'A completed job must be captured at 100 percent';
  end if;
  select j.* into v_job from public.jobs j
    where j.id = p_job_id and private.is_org_admin(j.organization_id)
      and private.has_entitlement(j.organization_id, 'job_management')
      and private.has_entitlement(j.organization_id, 'historical_cost_learning')
    for update;
  if not found then raise exception 'Job not found'; end if;
  if p_complete and (v_job.status = 'completed' or exists (
    select 1 from public.job_performance_snapshots
    where job_id = v_job.id and snapshot_kind = 'completion'
  )) then
    raise exception 'Job is already completed';
  end if;

  select * into strict v_summary from private.calculate_job_financial_summary(v_job);
  -- Round nonnegative monetary amounts to the nearest cent, ties upwards.
  v_forecast := div(v_summary.actual_cost_cents::numeric * 200 + p_progress_percent,
                    p_progress_percent * 2)::bigint;
  v_projected_margin := v_summary.revised_sold_total_ht_cents - v_forecast;
  select jsonb_build_object(
    'project_type', qc.project_type, 'trades', qc.trades, 'lots', qc.lots,
    'complexity', qc.complexity, 'confidence', qc.confidence
  ) into v_classification
  from public.quote_classifications qc
  where qc.project_id = v_job.source_project_id and qc.organization_id = v_job.organization_id;
  select coalesce(max(version), 0) + 1 into v_version from public.job_performance_snapshots where job_id = v_job.id;

  insert into public.job_performance_snapshots(
    organization_id, job_id, version, snapshot_kind, progress_percent,
    initial_sold_total_ht_cents, approved_sold_delta_cents, revised_sold_total_ht_cents,
    initial_budget_cents, approved_budget_delta_cents, revised_budget_cents,
    actual_cost_cents, forecast_cost_cents, planned_margin_cents, current_margin_cents,
    projected_margin_cents, projected_margin_variance_cents, approved_change_order_count,
    planned_by_category, actual_by_category, classification_snapshot, created_by
  ) values (
    v_job.organization_id, v_job.id, v_version, case when p_complete then 'completion' else 'progress' end, p_progress_percent,
    v_summary.initial_sold_total_ht_cents, v_summary.approved_sold_delta_cents, v_summary.revised_sold_total_ht_cents,
    v_summary.initial_budget_cents, v_summary.approved_budget_delta_cents, v_summary.revised_budget_cents,
    v_summary.actual_cost_cents, v_forecast, v_summary.planned_margin_cents, v_summary.current_margin_cents,
    v_projected_margin, v_projected_margin - v_summary.planned_margin_cents, v_summary.approved_change_order_count,
    v_summary.planned_by_category, v_summary.actual_by_category, coalesce(v_classification, '{}'::jsonb), v_user_id
  ) returning id into v_snapshot_id;
  if p_complete then
    update public.jobs set status = 'completed', completed_on = current_date, updated_at = now() where id = v_job.id;
  end if;
  return v_snapshot_id;
end;
$$;

-- Accept a new contract atomically. A legacy, already-linked job is diagnosed instead of reused.
create or replace function public.accept_estimate_and_create_job(p_estimate_id uuid)
returns uuid language plpgsql security definer set search_path = ''
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
    where id = p_estimate_id and estimate_kind = 'quote'
      and private.is_org_admin(organization_id)
      and private.has_entitlement(organization_id, 'job_management')
    for update;
  if not found then
    raise exception 'Estimate not found';
  end if;
  if v_estimate.quote_status = 'accepted' then raise exception 'Estimate already accepted'; end if;
  select * into v_project from public.projects
    where id = v_estimate.project_id and organization_id = v_estimate.organization_id for share;
  if not found then raise exception 'Contractual project not found'; end if;
  if exists (select 1 from public.jobs where source_estimate_id = v_estimate.id) then
    raise exception 'Existing job requires contractual baseline reconciliation';
  end if;
  v_sold_total_ht_cents := private.net_sold_total_ht_cents(
    v_estimate.total_ht, v_estimate.total_ttc, v_estimate.discount_amount
  );

  select
    coalesce(sum(case when category = 'material' then round(quantity * unit_cost_cents)::bigint else 0 end),0),
    coalesce(sum(case when category = 'labor' then round(planned_minutes::numeric * hourly_cost_cents / 60.0)::bigint else 0 end),0),
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
  returning id into v_job_id;

  insert into public.job_budget_snapshots(
    organization_id, job_id, version, sold_total_ht_cents, material_cents, labor_cents,
    subcontract_cents, equipment_cents, other_cents, source_payload
  ) values (
    v_estimate.organization_id, v_job_id, 1, v_sold_total_ht_cents,
    v_material, v_labor, v_subcontract, v_equipment, v_other,
    jsonb_build_object('estimate_id', v_estimate.id, 'captured_at', now())
  );

  update public.estimates set quote_status = 'accepted' where id = v_estimate.id;
  return v_job_id;
end;
$$;

-- Direct cost edits and acceptance serialize on the same quote row. The
-- estimate-triggered synchronization already holds that lock.
create or replace function private.prevent_accepted_quote_cost_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old_estimate_id uuid;
  v_new_estimate_id uuid;
  v_estimate record;
begin
  if tg_op <> 'INSERT' then v_old_estimate_id := old.estimate_id; end if;
  if tg_op <> 'DELETE' then v_new_estimate_id := new.estimate_id; end if;

  for v_estimate in
    select id, quote_status from public.estimates
    where id in (v_old_estimate_id, v_new_estimate_id)
    order by id for update
  loop
    if v_estimate.quote_status = 'accepted' then
      raise exception 'Accepted quote cost items are immutable';
    end if;
    -- Record a row version for stronger isolation levels. The revision trigger
    -- also prevents a stale editor from silently saving over a cost edit.
    if pg_catalog.pg_trigger_depth() = 1 then
      update public.estimates set revision = revision where id = v_estimate.id;
    end if;
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

notify pgrst, 'reload schema';
