/*
  # Fix switch_admin_plan function

  1. Changes
    - Rewrite to properly handle upsert (no unique constraint on user_id)
    - Delete existing active subs then insert new one for the target tier

  2. Important Notes
    - Handles case where user has no subscription yet
    - Handles case where user already has an active subscription on a different tier
*/

CREATE OR REPLACE FUNCTION switch_admin_plan(p_user_id uuid, p_tier_name text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier_id uuid;
  v_model_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an admin');
  END IF;

  SELECT st.id INTO v_tier_id
  FROM subscription_tiers st
  WHERE st.name = p_tier_name AND st.is_active = true;

  IF v_tier_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier not found');
  END IF;

  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = p_user_id AND status = 'active') THEN
    UPDATE user_subscriptions
    SET tier_id = v_tier_id, updated_at = now()
    WHERE user_id = p_user_id AND status = 'active';
  ELSE
    INSERT INTO user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
    VALUES (p_user_id, v_tier_id, 'active', now(), now() + interval '365 days');
  END IF;

  SELECT am.display_name INTO v_model_name
  FROM subscription_tiers st
  JOIN ai_models am ON st.ai_model_id = am.id
  WHERE st.id = v_tier_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier_name', p_tier_name,
    'model_name', v_model_name
  );
END;
$$;
