/*
  # Add Admin Subscription Management

  1. Changes
    - Add INSERT policy on user_subscriptions for admin users
    - Add UPDATE policy on user_subscriptions for admin users
    - Add DELETE policy on user_subscriptions for admin users
    - Create helper function to switch admin simulated plan
  
  2. Security
    - Only admin users can manage subscriptions
    - Regular users can only view their own subscriptions (existing policy)
  
  3. Important Notes
    - This enables the AdminPlanSimulator to actually persist plan choices to the database
    - The generate-estimate edge function reads user_subscriptions to determine the AI model
*/

CREATE POLICY "Admins can insert subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete subscriptions"
  ON user_subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION switch_admin_plan(p_user_id uuid, p_tier_name text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier_id uuid;
  v_model_name text;
  v_result jsonb;
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

  INSERT INTO user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
  VALUES (p_user_id, v_tier_id, 'active', now(), now() + interval '365 days')
  ON CONFLICT ON CONSTRAINT user_subscriptions_pkey DO NOTHING;

  UPDATE user_subscriptions
  SET tier_id = v_tier_id, status = 'active', updated_at = now()
  WHERE user_id = p_user_id;

  SELECT am.display_name INTO v_model_name
  FROM subscription_tiers st
  JOIN ai_models am ON st.ai_model_id = am.id
  WHERE st.id = v_tier_id;

  v_result := jsonb_build_object(
    'success', true,
    'tier_name', p_tier_name,
    'model_name', v_model_name
  );

  RETURN v_result;
END;
$$;
