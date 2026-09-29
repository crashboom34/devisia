-- Resolve feature access from the organization owner's active plan. The RPC
-- exposes only product entitlements and only to an authenticated member.
create or replace function public.get_organization_entitlements(p_organization_id uuid)
returns table(tier text, feature_key text, enabled boolean, limits jsonb)
language sql
stable
security definer
set search_path = public, private
as $$
  with allowed_org as (
    select o.owner_user_id
    from public.organizations o
    join public.organization_members om on om.organization_id = o.id
    where o.id = p_organization_id
      and om.user_id = (select auth.uid())
  ), effective_tier as (
    select coalesce(
      (
        select us.tier_id
        from public.user_subscriptions us
        where us.user_id = ao.owner_user_id
          and us.status = 'active'
        order by us.updated_at desc nulls last, us.created_at desc
        limit 1
      ),
      (
        select st.id
        from public.subscription_tiers st
        where st.name = 'starter' and st.is_active
        limit 1
      )
    ) as tier_id
    from allowed_org ao
  )
  select st.name::text, fe.feature_key::text, fe.enabled, fe.limits
  from effective_tier et
  join public.subscription_tiers st on st.id = et.tier_id and st.is_active
  join public.feature_entitlements fe on fe.tier_id = st.id
  order by fe.feature_key;
$$;

revoke all on function public.get_organization_entitlements(uuid) from public, anon;
grant execute on function public.get_organization_entitlements(uuid) to authenticated;

-- Keep RLS decisions aligned with the same Starter fallback used by the UI.
create or replace function private.has_entitlement(p_organization_id uuid, p_feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  with organization_owner as (
    select o.owner_user_id
    from public.organizations o
    where o.id = p_organization_id
  ), effective_tier as (
    select coalesce(
      (
        select us.tier_id
        from public.user_subscriptions us
        where us.user_id = oo.owner_user_id
          and us.status = 'active'
        order by us.updated_at desc nulls last, us.created_at desc
        limit 1
      ),
      (
        select st.id
        from public.subscription_tiers st
        where st.name = 'starter' and st.is_active
        limit 1
      )
    ) as tier_id
    from organization_owner oo
  )
  select coalesce(bool_or(fe.enabled), false)
  from effective_tier et
  join public.feature_entitlements fe on fe.tier_id = et.tier_id
  where fe.feature_key = p_feature_key;
$$;

revoke all on function private.has_entitlement(uuid, text) from public, anon;
grant execute on function private.has_entitlement(uuid, text) to authenticated, service_role;
