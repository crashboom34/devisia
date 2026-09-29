-- Enforce tenant consistency across every job-costing relationship. RLS limits
-- visibility; these triggers additionally prevent cross-tenant foreign keys
-- from being written by a forged client request.

create or replace function private.validate_job_costing_tenant_links()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_daily_minutes integer;
begin
  if tg_table_name = 'quote_classifications' then
    if not exists (
      select 1 from public.projects p
      where p.id = new.project_id and p.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Project and organization do not match';
    end if;
  elsif tg_table_name = 'quote_cost_items' then
    if not exists (
      select 1 from public.estimates e
      where e.id = new.estimate_id and e.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Estimate and organization do not match';
    end if;
  elsif tg_table_name = 'jobs' then
    if not exists (
      select 1
      from public.estimates e
      join public.projects p on p.id = e.project_id
      where e.id = new.source_estimate_id
        and p.id = new.source_project_id
        and e.organization_id = new.organization_id
        and p.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Job sources and organization do not match';
    end if;
  elsif tg_table_name = 'job_budget_snapshots' then
    if not exists (
      select 1 from public.jobs j
      where j.id = new.job_id and j.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Job and organization do not match';
    end if;
  elsif tg_table_name = 'time_entries' then
    if not exists (
      select 1 from public.jobs j
      where j.id = new.job_id and j.organization_id = new.organization_id
    ) or not exists (
      select 1 from public.employees e
      where e.id = new.employee_id and e.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Time entry references another organization';
    end if;

    -- Serialize allocations for one employee/day so concurrent writes cannot
    -- both pass the 24-hour check against a stale total.
    perform pg_advisory_xact_lock(hashtextextended(new.employee_id::text || ':' || new.work_date::text, 0));
    select coalesce(sum(t.minutes), 0) + new.minutes
      into v_daily_minutes
    from public.time_entries t
    where t.employee_id = new.employee_id
      and t.work_date = new.work_date
      and t.id is distinct from new.id;
    if v_daily_minutes > 1440 then
      raise exception using errcode = '23514', message = 'Daily time cannot exceed 24 hours';
    end if;
  elsif tg_table_name = 'job_cost_entries' then
    if not exists (
      select 1 from public.jobs j
      where j.id = new.job_id and j.organization_id = new.organization_id
    ) then
      raise exception using errcode = '23514', message = 'Job cost references another organization';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.validate_job_costing_tenant_links() from public, anon;

drop trigger if exists validate_quote_classification_tenant on public.quote_classifications;
create trigger validate_quote_classification_tenant
before insert or update on public.quote_classifications
for each row execute function private.validate_job_costing_tenant_links();

drop trigger if exists validate_quote_cost_tenant on public.quote_cost_items;
create trigger validate_quote_cost_tenant
before insert or update on public.quote_cost_items
for each row execute function private.validate_job_costing_tenant_links();

drop trigger if exists validate_job_tenant on public.jobs;
create trigger validate_job_tenant
before insert or update on public.jobs
for each row execute function private.validate_job_costing_tenant_links();

drop trigger if exists validate_budget_snapshot_tenant on public.job_budget_snapshots;
create trigger validate_budget_snapshot_tenant
before insert or update on public.job_budget_snapshots
for each row execute function private.validate_job_costing_tenant_links();

drop trigger if exists validate_time_entry_tenant on public.time_entries;
create trigger validate_time_entry_tenant
before insert or update on public.time_entries
for each row execute function private.validate_job_costing_tenant_links();

drop trigger if exists validate_job_cost_tenant on public.job_cost_entries;
create trigger validate_job_cost_tenant
before insert or update on public.job_cost_entries
for each row execute function private.validate_job_costing_tenant_links();

create unique index if not exists time_entries_employee_job_date_uniq
on public.time_entries(employee_id, job_id, work_date);

-- Audit fields always reflect the authenticated actor. Updates retain the
-- original creator instead of accepting a client-supplied replacement.
create or replace function private.normalize_created_by()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

revoke all on function private.normalize_created_by() from public, anon;

drop trigger if exists normalize_jobs_created_by on public.jobs;
create trigger normalize_jobs_created_by
before insert or update on public.jobs
for each row execute function private.normalize_created_by();

drop trigger if exists normalize_time_entries_created_by on public.time_entries;
create trigger normalize_time_entries_created_by
before insert or update on public.time_entries
for each row execute function private.normalize_created_by();

drop trigger if exists normalize_job_cost_entries_created_by on public.job_cost_entries;
create trigger normalize_job_cost_entries_created_by
before insert or update on public.job_cost_entries
for each row execute function private.normalize_created_by();
