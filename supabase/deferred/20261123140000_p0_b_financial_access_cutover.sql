-- Phase 2: apply only after every client using the legacy financial queries
-- has been retired. See docs/operations/DEVISIA_P0B_P1_RELEASE.md.
do $$
begin
  if to_regprocedure('public.get_job_financial_summary(uuid)') is null
     or to_regprocedure('private.validate_job_snapshot_progress(numeric)') is null then
    raise exception 'Install the P0-B financial contract before the access cutover';
  end if;
  if to_regprocedure('public.duplicate_quote(uuid,text,uuid)') is null then
    raise exception 'Install P1 quote duplication before the access cutover';
  end if;
end;
$$;

-- The current membership model has owner/admin/member. Reserve financial
-- records for owner/admin while preserving selected time data for members.
drop policy "Members read jobs" on public.jobs;
drop policy "Members read budget snapshots" on public.job_budget_snapshots;
create policy "Admins read budget snapshots" on public.job_budget_snapshots for select to authenticated
using ((select private.is_org_admin(organization_id)) and (select private.has_entitlement(organization_id, 'job_management')));
drop policy "Members read job costs" on public.job_cost_entries;
drop policy "Members read job change orders" on public.job_change_orders;
create policy "Admins read job change orders" on public.job_change_orders for select to authenticated
using ((select private.is_org_admin(organization_id)) and (select private.has_entitlement(organization_id, 'job_management')));
drop policy "Members read job performance snapshots" on public.job_performance_snapshots;
create policy "Admins read job performance snapshots" on public.job_performance_snapshots for select to authenticated
using ((select private.is_org_admin(organization_id)) and (select private.has_entitlement(organization_id, 'historical_cost_learning')));

revoke select on public.time_entries from public, anon, authenticated;
revoke select (hourly_cost_cents_snapshot) on public.time_entries from public, anon, authenticated;
grant select (id, organization_id, employee_id, job_id, work_date, minutes, source, notes, created_by, created_at, updated_at)
  on public.time_entries to authenticated;

create or replace function private.validate_job_snapshot_progress(p_progress_percent numeric)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if p_progress_percent is null or p_progress_percent <= 0 or p_progress_percent > 100
     or p_progress_percent <> round(p_progress_percent, 2) then
    raise exception 'Progress must be between 0.01 and 100 with at most two decimals';
  end if;
end;
$$;

notify pgrst, 'reload schema';
