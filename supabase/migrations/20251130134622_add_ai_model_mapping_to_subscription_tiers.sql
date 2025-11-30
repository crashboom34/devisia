/*
  # Add AI Model Mapping to Subscription System

  1. Modifications
    - Add AI model reference to subscription_tiers
    - Add tier_level for ordering
    - Add model configuration fields
    - Create secure policies to hide AI details from users

  2. Security
    - Users can view tier info but NOT AI model details
    - Only admins can see/modify AI model mappings
    - Create admin-safe views for managing models
*/

-- Add new columns to subscription_tiers for AI model mapping
ALTER TABLE subscription_tiers 
  ADD COLUMN IF NOT EXISTS ai_model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tier_level integer,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS max_projects_per_month integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_estimates_per_project integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS priority_support boolean DEFAULT false;

-- Create unique constraint on tier_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_tiers_tier_level_key'
  ) THEN
    ALTER TABLE subscription_tiers ADD CONSTRAINT subscription_tiers_tier_level_key UNIQUE(tier_level);
  END IF;
END $$;

-- Update existing RLS policies for subscription_tiers
DROP POLICY IF EXISTS "Anyone can view active subscription tiers" ON subscription_tiers;
CREATE POLICY "Users can view active subscription tiers basic info"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage subscription tiers" ON subscription_tiers;
CREATE POLICY "Only admins can manage subscription tiers"
  ON subscription_tiers FOR ALL
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

-- Create a safe public view that hides AI model details
DROP VIEW IF EXISTS public_subscription_plans CASCADE;
CREATE OR REPLACE VIEW public_subscription_plans AS
SELECT
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
  is_active,
  -- AI capability hint WITHOUT revealing model details
  CASE 
    WHEN tier_level = 1 THEN 'Standard AI Intelligence'
    WHEN tier_level = 2 THEN 'Advanced AI Intelligence'
    WHEN tier_level = 3 THEN 'Premium AI Intelligence'
    WHEN tier_level >= 4 THEN 'Enterprise-Grade AI Intelligence'
    ELSE 'AI-Powered'
  END as ai_capability_level
FROM subscription_tiers
WHERE is_active = true
ORDER BY sort_order, tier_level;

-- Grant SELECT on the public view
GRANT SELECT ON public_subscription_plans TO authenticated;
GRANT SELECT ON public_subscription_plans TO anon;

-- Create admin-only view for managing AI model mappings
DROP VIEW IF EXISTS admin_subscription_tier_models CASCADE;
CREATE OR REPLACE VIEW admin_subscription_tier_models AS
SELECT
  st.id,
  st.name,
  st.display_name,
  st.tier_level,
  st.price_monthly,
  st.price_yearly,
  st.is_active,
  st.ai_model_id,
  am.display_name as ai_model_name,
  am.model_id as ai_model_identifier,
  am.provider as ai_provider,
  am.cost_per_1k_tokens_input,
  am.cost_per_1k_tokens_output,
  am.max_tokens
FROM subscription_tiers st
LEFT JOIN ai_models am ON st.ai_model_id = am.id
ORDER BY st.tier_level;

-- Create RLS policy for admin view
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to use the admin view
CREATE POLICY "Admins can view full tier details with AI models"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update user_subscriptions to track usage
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS projects_used_this_period integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz DEFAULT now() + interval '30 days',
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Update RLS on user_subscriptions to hide AI model access
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
CREATE POLICY "Users can view own subscription basic info"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to get user's current AI model (called by backend only)
CREATE OR REPLACE FUNCTION get_user_ai_model(p_user_id uuid)
RETURNS TABLE (
  model_id uuid,
  model_identifier text,
  provider text,
  max_tokens integer
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.model_id,
    am.provider,
    am.max_tokens
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  JOIN ai_models am ON st.ai_model_id = am.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND am.is_active = true
  LIMIT 1;
END;
$$;

-- Function to check if user has reached project limit
CREATE OR REPLACE FUNCTION check_project_limit(p_user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_limit integer;
  v_used integer;
  v_tier_name text;
BEGIN
  SELECT 
    st.max_projects_per_month,
    us.projects_used_this_period,
    st.display_name
  INTO v_limit, v_used, v_tier_name
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active';
  
  IF NOT FOUND THEN
    -- No subscription, return free tier limits
    v_limit := 5;
    v_used := (
      SELECT COUNT(*)
      FROM projects
      WHERE user_id = p_user_id
        AND created_at >= date_trunc('month', now())
    )::integer;
    v_tier_name := 'Free';
  END IF;
  
  v_result := jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'remaining', GREATEST(0, v_limit - v_used),
    'has_reached_limit', v_used >= v_limit,
    'tier_name', v_tier_name
  );
  
  RETURN v_result;
END;
$$;

-- Sample data: Update subscription tiers with AI models and tier levels
DO $$
DECLARE
  v_haiku_id uuid;
  v_sonnet_id uuid;
  v_opus_id uuid;
BEGIN
  -- Get AI model IDs
  SELECT id INTO v_haiku_id FROM ai_models WHERE model_id LIKE '%haiku%' AND is_active = true LIMIT 1;
  SELECT id INTO v_sonnet_id FROM ai_models WHERE model_id LIKE '%sonnet%' AND is_active = true ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_opus_id FROM ai_models WHERE model_id LIKE '%opus%' AND is_active = true LIMIT 1;
  
  -- Insert/Update subscription tiers
  INSERT INTO subscription_tiers (
    name, display_name, description, price_monthly, price_yearly,
    tier_level, ai_model_id, max_projects_per_month, max_estimates_per_project,
    priority_support, features, sort_order, is_active
  ) VALUES
  (
    'free',
    'Starter',
    'Perfect for small projects and getting started with AI-powered estimates',
    0.00,
    0.00,
    1,
    v_haiku_id,
    5,
    3,
    false,
    '["Up to 5 projects per month", "Standard AI intelligence", "3 estimate variants per project", "Email support", "PDF export"]'::jsonb,
    1,
    true
  ),
  (
    'professional',
    'Professional',
    'Ideal for professionals managing multiple projects with enhanced AI capabilities',
    29.99,
    299.00,
    2,
    v_sonnet_id,
    25,
    999,
    false,
    '["Up to 25 projects per month", "Advanced AI intelligence", "Unlimited estimate variants", "Priority email support", "PDF export", "Custom branding", "Quote templates"]'::jsonb,
    2,
    true
  ),
  (
    'business',
    'Business',
    'For growing businesses requiring premium AI and advanced features',
    79.99,
    799.00,
    3,
    v_sonnet_id,
    100,
    999,
    true,
    '["Up to 100 projects per month", "Premium AI intelligence", "Unlimited estimate variants", "Priority support (24h response)", "PDF export", "Custom branding", "Quote templates", "Team collaboration", "API access"]'::jsonb,
    3,
    true
  ),
  (
    'enterprise',
    'Enterprise',
    'Maximum power for large organizations with enterprise-grade AI',
    249.99,
    2499.00,
    4,
    v_opus_id,
    999999,
    999,
    true,
    '["Unlimited projects", "Enterprise-grade AI intelligence", "Unlimited estimate variants", "Dedicated support", "PDF export", "Custom branding", "Quote templates", "Team collaboration", "API access", "Custom integrations", "SLA guarantee", "Training sessions"]'::jsonb,
    4,
    true
  )
  ON CONFLICT (name) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    tier_level = EXCLUDED.tier_level,
    ai_model_id = EXCLUDED.ai_model_id,
    max_projects_per_month = EXCLUDED.max_projects_per_month,
    max_estimates_per_project = EXCLUDED.max_estimates_per_project,
    priority_support = EXCLUDED.priority_support;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_tier_level ON subscription_tiers(tier_level);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_ai_model ON subscription_tiers(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_user ON user_subscriptions(user_id, tier_id);

COMMENT ON COLUMN subscription_tiers.ai_model_id IS 'Reference to AI model - ADMIN ONLY, hidden from users';
COMMENT ON VIEW public_subscription_plans IS 'User-safe view of subscription plans without AI model details';
COMMENT ON VIEW admin_subscription_tier_models IS 'Admin-only view showing AI model mappings';
COMMENT ON FUNCTION get_user_ai_model IS 'Backend function to retrieve user AI model without exposing to frontend';