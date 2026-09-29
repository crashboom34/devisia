drop policy if exists "Admins manage job change orders" on public.job_change_orders;

create policy "Admins create job change orders"
on public.job_change_orders for insert to authenticated
with check (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
);

create policy "Admins update job change orders"
on public.job_change_orders for update to authenticated
using (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
)
with check (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
);

create policy "Admins delete job change orders"
on public.job_change_orders for delete to authenticated
using (
  (select private.is_org_admin(organization_id))
  and (select private.has_entitlement(organization_id, 'job_management'))
);
