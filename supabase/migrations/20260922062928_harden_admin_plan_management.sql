/*
  Harden plan/model administration.

  - A caller may only simulate a plan for their own authenticated admin account.
  - Model assignment is validated and changed atomically through a dedicated RPC.
  - No secret or provider credential is returned by either function.
*/

ALTER TABLE subscription_tiers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS max_clients integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fair_use_limit integer NOT NULL DEFAULT 400;

ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE estimates e
SET user_id = p.user_id
FROM projects p
WHERE e.project_id = p.id
  AND e.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);

ALTER TABLE api_usage_logs
  ADD COLUMN IF NOT EXISTS model_used text;

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
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an admin');
  END IF;

  SELECT st.id INTO v_tier_id
  FROM subscription_tiers st
  WHERE st.name = lower(trim(p_tier_name)) AND st.is_active = true;

  IF v_tier_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier not found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid() AND status = 'active'
  ) THEN
    UPDATE user_subscriptions
    SET tier_id = v_tier_id,
        updated_at = now(),
        current_period_start = now(),
        current_period_end = now() + interval '365 days'
    WHERE user_id = auth.uid() AND status = 'active';
  ELSE
    INSERT INTO user_subscriptions (
      user_id, tier_id, status, current_period_start, current_period_end
    ) VALUES (
      auth.uid(), v_tier_id, 'active', now(), now() + interval '365 days'
    );
  END IF;

  SELECT am.display_name INTO v_model_name
  FROM subscription_tiers st
  JOIN ai_models am ON st.ai_model_id = am.id
  WHERE st.id = v_tier_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier_name', lower(trim(p_tier_name)),
    'model_name', v_model_name
  );
END;
$$;

REVOKE ALL ON FUNCTION switch_admin_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION switch_admin_plan(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION set_subscription_tier_model(
  p_tier_id uuid,
  p_model_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier_name text;
  v_model_name text;
  v_model_identifier text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an admin');
  END IF;

  SELECT name INTO v_tier_name
  FROM subscription_tiers
  WHERE id = p_tier_id;

  IF v_tier_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier not found');
  END IF;

  SELECT display_name, model_id
  INTO v_model_name, v_model_identifier
  FROM ai_models
  WHERE id = p_model_id AND is_active = true;

  IF v_model_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Active model not found');
  END IF;

  UPDATE subscription_tiers
  SET ai_model_id = p_model_id, updated_at = now()
  WHERE id = p_tier_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier_name', v_tier_name,
    'model_name', v_model_name,
    'model_identifier', v_model_identifier
  );
END;
$$;

REVOKE ALL ON FUNCTION set_subscription_tier_model(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_subscription_tier_model(uuid, uuid) TO authenticated;

DO $$
DECLARE
  v_gpt41_id uuid;
BEGIN
  SELECT id INTO v_gpt41_id
  FROM ai_models
  WHERE provider = 'openrouter'
    AND model_id = 'openai/gpt-4.1'
    AND is_active = true
  LIMIT 1;

  IF v_gpt41_id IS NULL THEN
    RAISE EXCEPTION 'Active GPT-4.1 OpenRouter model is required for the Pro tier';
  END IF;

  UPDATE subscription_tiers
  SET ai_model_id = v_gpt41_id, updated_at = now()
  WHERE name = 'pro';
END;
$$;
