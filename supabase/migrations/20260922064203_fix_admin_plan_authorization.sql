/*
  The canonical function definitions in 20260922062928 use the deployed
  zero-argument is_admin() helper. This assertion keeps fresh and linked
  environments aligned with the production hotfix recorded at this version.
*/

DO $$
BEGIN
  IF position(
    'public.is_admin()' IN
    pg_get_functiondef('public.switch_admin_plan(uuid,text)'::regprocedure)
  ) = 0 THEN
    RAISE EXCEPTION 'switch_admin_plan must call public.is_admin()';
  END IF;

  IF position(
    'public.is_admin()' IN
    pg_get_functiondef('public.set_subscription_tier_model(uuid,uuid)'::regprocedure)
  ) = 0 THEN
    RAISE EXCEPTION 'set_subscription_tier_model must call public.is_admin()';
  END IF;
END;
$$;
