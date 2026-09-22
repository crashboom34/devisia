/*
  Harden the Data API surface without changing the application tenancy model.

  - public pricing remains readable through a safe, RLS-aware view;
  - anonymous table access is removed;
  - destructive/non-DML table privileges are removed from browser roles;
  - SECURITY DEFINER RPCs validate the caller instead of trusting user input;
  - trigger/internal functions are no longer callable through the Data API;
  - every public function receives a fixed search_path;
  - concurrent estimate activation is constrained at the database layer.
*/

CREATE UNIQUE INDEX IF NOT EXISTS idx_estimates_one_active_per_scenario
  ON public.estimates (project_id, scenario_type)
  WHERE is_active = true;

ALTER VIEW public.public_subscription_plans
  SET (security_invoker = true);

DROP POLICY IF EXISTS "Anyone can view active subscription tiers" ON public.subscription_tiers;
CREATE POLICY "Anyone can view active subscription tiers"
  ON public.subscription_tiers
  FOR SELECT
  TO anon
  USING (is_active = true);

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT SELECT ON public.public_subscription_plans TO anon, authenticated;
GRANT SELECT (
  id,
  name,
  display_name,
  description,
  price_monthly,
  price_yearly,
  features,
  tier_level,
  max_projects_per_month,
  max_estimates_per_project,
  priority_support,
  sort_order,
  is_active
) ON public.subscription_tiers TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_estimate_history(p_estimate_id uuid)
RETURNS TABLE(
  estimate_id uuid,
  model_used text,
  total_ttc numeric,
  is_active boolean,
  created_at timestamptz,
  regeneration_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project_id uuid;
  v_scenario_type text;
  v_is_service_role boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  SELECT estimate.project_id, estimate.scenario_type
  INTO v_project_id, v_scenario_type
  FROM public.estimates AS estimate
  JOIN public.projects AS project ON project.id = estimate.project_id
  WHERE estimate.id = p_estimate_id
    AND (v_is_service_role OR project.user_id = auth.uid());

  IF v_project_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    estimate.id,
    estimate.model_used,
    estimate.total_ttc,
    estimate.is_active,
    estimate.created_at,
    estimate.regeneration_count
  FROM public.estimates AS estimate
  WHERE estimate.project_id = v_project_id
    AND estimate.scenario_type = v_scenario_type
  ORDER BY estimate.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_estimate(
  p_estimate_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project_id uuid;
  v_scenario_type text;
  v_is_service_role boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL OR (NOT v_is_service_role AND auth.uid() IS DISTINCT FROM p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT estimate.project_id, estimate.scenario_type
  INTO v_project_id, v_scenario_type
  FROM public.estimates AS estimate
  JOIN public.projects AS project ON project.id = estimate.project_id
  WHERE estimate.id = p_estimate_id
    AND project.user_id = p_user_id;

  IF v_project_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Estimate not found or unauthorized'
    );
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_project_id::text || ':' || v_scenario_type, 0));

  UPDATE public.estimates
  SET is_active = false
  WHERE project_id = v_project_id
    AND scenario_type = v_scenario_type
    AND id <> p_estimate_id
    AND is_active = true;

  UPDATE public.estimates
  SET is_active = true
  WHERE id = p_estimate_id;

  RETURN json_build_object('success', true, 'estimate_id', p_estimate_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_model(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_model_id uuid;
  v_is_service_role boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL OR (NOT v_is_service_role AND auth.uid() IS DISTINCT FROM p_user_id) THEN
    RETURN NULL;
  END IF;

  SELECT preference.preferred_model_id
  INTO v_model_id
  FROM public.user_preferences AS preference
  WHERE preference.user_id = p_user_id
    AND preference.preferred_model_id IS NOT NULL;

  IF v_model_id IS NULL THEN
    SELECT model.id
    INTO v_model_id
    FROM public.ai_models AS model
    WHERE model.is_active = true
      AND model.cost_per_1k_tokens_input = 0
      AND model.cost_per_1k_tokens_output = 0
    ORDER BY model.created_at ASC
    LIMIT 1;
  END IF;

  IF v_model_id IS NULL THEN
    SELECT model.id
    INTO v_model_id
    FROM public.ai_models AS model
    WHERE model.is_active = true
    ORDER BY model.cost_per_1k_tokens_input ASC, model.created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_model_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_ai_model(p_user_id uuid)
RETURNS TABLE(
  model_id uuid,
  model_identifier text,
  provider text,
  max_tokens integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_service_role boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL OR (NOT v_is_service_role AND auth.uid() IS DISTINCT FROM p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT model.id, model.model_id, model.provider, model.max_tokens
  FROM public.user_subscriptions AS subscription
  JOIN public.subscription_tiers AS tier ON subscription.tier_id = tier.id
  JOIN public.ai_models AS model ON tier.ai_model_id = model.id
  WHERE subscription.user_id = p_user_id
    AND subscription.status = 'active'
    AND model.is_active = true
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_project_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
  v_limit integer;
  v_used integer;
  v_tier_name text;
  v_is_service_role boolean := coalesce(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL OR (NOT v_is_service_role AND auth.uid() IS DISTINCT FROM p_user_id) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT tier.max_projects_per_month, coalesce(subscription.projects_used_this_period, 0), tier.display_name
  INTO v_limit, v_used, v_tier_name
  FROM public.user_subscriptions AS subscription
  JOIN public.subscription_tiers AS tier ON subscription.tier_id = tier.id
  WHERE subscription.user_id = p_user_id
    AND subscription.status = 'active';

  IF NOT FOUND THEN
    v_limit := 5;
    SELECT count(*)::integer
    INTO v_used
    FROM public.projects AS project
    WHERE project.user_id = p_user_id
      AND project.created_at >= date_trunc('month', now());
    v_tier_name := 'Free';
  END IF;

  v_result := jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'remaining', greatest(0, v_limit - v_used),
    'has_reached_limit', v_used >= v_limit,
    'tier_name', v_tier_name
  );

  RETURN v_result;
END;
$$;

DO $$
BEGIN
  -- Historical environments contain either the original uuid signature
  -- (whose argument has a default) or the later zero-argument replacement.
  IF to_regprocedure('public.is_admin(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.is_admin(uuid) SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
  END IF;

  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
  END IF;
END;
$$;

ALTER FUNCTION public.is_super_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_single_default_model() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_user_view_restrictions_updated_at() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_estimate_history(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_active_estimate(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_model(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_ai_model(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_project_limit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_model() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_view_restrictions_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_estimate_history(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_active_estimate(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_model(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_ai_model(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_project_limit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DO $$
BEGIN
  IF to_regprocedure('public.set_subscription_tier_model(uuid,uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.set_subscription_tier_model(uuid, uuid)
      SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.set_subscription_tier_model(uuid, uuid)
      FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.set_subscription_tier_model(uuid, uuid)
      TO authenticated, service_role;
  END IF;

  IF to_regprocedure('public.switch_admin_plan(uuid,text)') IS NOT NULL THEN
    ALTER FUNCTION public.switch_admin_plan(uuid, text)
      SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.switch_admin_plan(uuid, text)
      FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.switch_admin_plan(uuid, text)
      TO authenticated, service_role;
  END IF;
END;
$$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
