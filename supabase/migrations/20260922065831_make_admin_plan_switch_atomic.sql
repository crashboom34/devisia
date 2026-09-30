/* Prevent concurrent plan switches from creating multiple active subscriptions. */

WITH ranked_active_subscriptions AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.user_subscriptions
  WHERE status = 'active'
)
UPDATE public.user_subscriptions subscription
SET status = 'cancelled', updated_at = now()
FROM ranked_active_subscriptions ranked
WHERE subscription.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_one_active_per_user
  ON public.user_subscriptions(user_id)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.switch_admin_plan(p_user_id uuid, p_tier_name text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier_id uuid;
  v_model_name text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an admin');
  END IF;

  SELECT st.id INTO v_tier_id
  FROM public.subscription_tiers st
  WHERE st.name = lower(trim(p_tier_name)) AND st.is_active = true;

  IF v_tier_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier not found');
  END IF;

  INSERT INTO public.user_subscriptions (
    user_id, tier_id, status, current_period_start, current_period_end
  ) VALUES (
    auth.uid(), v_tier_id, 'active', now(), now() + interval '365 days'
  )
  ON CONFLICT (user_id) WHERE status = 'active'
  DO UPDATE SET
    tier_id = EXCLUDED.tier_id,
    updated_at = now(),
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end;

  SELECT am.display_name INTO v_model_name
  FROM public.subscription_tiers st
  JOIN public.ai_models am ON st.ai_model_id = am.id
  WHERE st.id = v_tier_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier_name', lower(trim(p_tier_name)),
    'model_name', v_model_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.switch_admin_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_admin_plan(uuid, text) TO authenticated;
