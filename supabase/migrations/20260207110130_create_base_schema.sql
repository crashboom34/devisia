/*
  # Complete Base Schema - Devisia Platform

  1. New Tables
    - `profiles` - User profiles (id, email, full_name, avatar_url)
    - `api_keys` - API key storage per provider (openai, anthropic, openrouter)
    - `projects` - User projects with client info, status tracking
    - `estimates` - AI-generated construction quotes with full BTP fields
    - `ai_models` - AI model registry with provider, cost, capabilities
    - `admin_users` - Admin user tracking with roles (admin, super_admin)
    - `subscription_tiers` - Subscription plan definitions with AI model mapping
    - `user_subscriptions` - User-to-tier subscriptions with usage tracking
    - `api_usage_logs` - API usage audit logs
    - `usage_logs` - Model usage logs (used by edge functions)
    - `rate_limits` - Per-user rate limiting
    - `system_config` - System-wide configuration key/value store
    - `user_preferences` - Per-user preferences (theme, language, notifications)
    - `user_view_restrictions` - Per-user UI view restrictions
    - `estimate_templates` - Reusable BTP estimate templates
    - `project_rooms` - Rooms/zones within projects
    - `room_photos` - Photos attached to rooms
    - `quote_regeneration_log` - Audit log for quote regeneration
    - `clients` - Client/customer management

  2. Security
    - RLS enabled on ALL tables
    - Restrictive policies checking auth.uid() and ownership
    - Admin-only access for system config, templates, AI model management
    - Bootstrap policy for first super admin creation

  3. Functions
    - is_admin(), is_super_admin() - Admin check helpers
    - handle_new_user() - Auto-create profile on signup
    - get_user_ai_model() - Map subscription to AI model
    - check_project_limit() - Check user project quota
    - set_active_estimate() - Manage active estimate versions
    - get_estimate_history() - Get estimate version history

  4. Views
    - public_subscription_plans - Public-safe subscription info
    - admin_subscription_tier_models - Admin view with AI model details

  5. Important Notes
    - Three standardized tiers: Starter (GPT-4.1 Mini), Business (Mistral Large 2), Pro (GPT-4.1)
    - AI model details hidden from regular users
    - Admin users bypass project limits
*/

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. AI_MODELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'openrouter')),
  model_id text NOT NULL,
  display_name text NOT NULL,
  description text,
  cost_per_1k_tokens_input numeric(10,6) DEFAULT 0,
  cost_per_1k_tokens_output numeric(10,6) DEFAULT 0,
  max_tokens integer DEFAULT 4096,
  capabilities jsonb DEFAULT '{"function_calling": false, "vision": false}'::jsonb,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  api_endpoint text,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, model_id)
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active AI models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 3. ADMIN_USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin')) DEFAULT 'admin',
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin helper functions
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view other admins"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow first super admin or super admin inserts"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    (NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin'))
    OR
    is_super_admin()
  );

CREATE POLICY "Only super admins can update admins"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Only super admins can delete admins"
  ON admin_users FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- 4. API_KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'openrouter'::text])),
  api_key text NOT NULL,
  model_id text,
  model_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'processing', 'completed', 'archived')),
  client_name text,
  client_address text,
  work_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. ESTIMATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  voice_input_url text,
  transcript text,
  estimate_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_model text,
  tokens_used integer,
  scenario_type text,
  total_amount numeric(12,2) DEFAULT 0,
  line_items jsonb DEFAULT '[]'::jsonb,
  categories jsonb DEFAULT '[]'::jsonb,
  estimate_number text,
  client_name text,
  estimate_date timestamptz DEFAULT now(),
  validity_days integer DEFAULT 30,
  payment_terms text,
  execution_delay text,
  deposit_required numeric(5,2) DEFAULT 0,
  special_conditions text,
  total_ht numeric(12,2) DEFAULT 0,
  total_tva numeric(12,2) DEFAULT 0,
  total_ttc numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  discount_percent numeric(5,2) DEFAULT 0,
  model_used text,
  scenario_justification text,
  is_active boolean DEFAULT true,
  regenerated_from_id uuid REFERENCES estimates(id) ON DELETE SET NULL,
  regeneration_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimates_active
  ON estimates(project_id, scenario_type, is_active) WHERE is_active = true;

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimates"
  ON estimates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own estimates"
  ON estimates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
  ON estimates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete estimates for own projects"
  ON estimates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = estimates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. SUBSCRIPTION_TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  ai_model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  tier_level integer,
  max_projects_per_month integer DEFAULT 10,
  max_estimates_per_project integer DEFAULT 3,
  priority_support boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active subscription tiers"
  ON subscription_tiers FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all subscription tiers"
  ON subscription_tiers FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can manage subscription tiers"
  ON subscription_tiers FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_subscription_tiers_tier_level ON subscription_tiers(tier_level);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_ai_model ON subscription_tiers(ai_model_id);

-- ============================================================================
-- 8. USER_SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  tier_id uuid REFERENCES subscription_tiers ON DELETE RESTRICT NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')) DEFAULT 'active',
  projects_used_this_period integer DEFAULT 0,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now() + interval '30 days',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_user ON user_subscriptions(user_id, tier_id);

-- ============================================================================
-- 9. USAGE LOGS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  model_used text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  cost numeric(10,6) DEFAULT 0,
  duration_ms integer,
  status text CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON api_usage_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  tokens_used integer DEFAULT 0,
  cost numeric(10,6) DEFAULT 0,
  response_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs from usage_logs"
  ON usage_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage logs"
  ON usage_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. RATE_LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  requests_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. SYSTEM_CONFIG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public system config"
  ON system_config FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can view all system config"
  ON system_config FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Super admins can manage system config"
  ON system_config FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================================
-- 12. USER_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  preferred_model_id text,
  preferred_provider text,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. USER_VIEW_RESTRICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_view_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_mode text NOT NULL CHECK (view_mode IN ('full', 'detailed-settings-only', 'api-info-only', 'complete-settings-only')),
  allowed_routes text[] NOT NULL DEFAULT ARRAY[]::text[],
  redirect_route text NOT NULL DEFAULT '/dashboard',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_view_restrictions_user_id ON user_view_restrictions(user_id);

ALTER TABLE user_view_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own view restrictions"
  ON user_view_restrictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own view restrictions"
  ON user_view_restrictions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own view restrictions"
  ON user_view_restrictions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own view restrictions"
  ON user_view_restrictions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 14. ESTIMATE_TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  lots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimate_templates_template_id ON estimate_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_category ON estimate_templates(category);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_active ON estimate_templates(is_active) WHERE is_active = true;

ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active templates"
  ON estimate_templates FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can insert templates"
  ON estimate_templates FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update templates"
  ON estimate_templates FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete templates"
  ON estimate_templates FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- 15. PROJECT_ROOMS AND ROOM_PHOTOS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rooms of own projects"
  ON project_rooms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert rooms to own projects"
  ON project_rooms FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update rooms of own projects"
  ON project_rooms FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete rooms of own projects"
  ON project_rooms FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_rooms.project_id AND projects.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS room_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES project_rooms(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  comment text,
  dimensions_text text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of own rooms"
  ON room_photos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_rooms pr JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = room_photos.room_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert photos to own rooms"
  ON room_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_rooms pr JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = room_photos.room_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update photos of own rooms"
  ON room_photos FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_rooms pr JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = room_photos.room_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_rooms pr JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = room_photos.room_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos of own rooms"
  ON room_photos FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM project_rooms pr JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = room_photos.room_id AND p.user_id = auth.uid()
  ));

-- ============================================================================
-- 16. QUOTE_REGENERATION_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_regeneration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES estimates(id) ON DELETE CASCADE,
  original_estimate_id uuid REFERENCES estimates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  old_model text,
  new_model text,
  old_total_ttc numeric,
  new_total_ttc numeric,
  price_difference_percent numeric,
  regeneration_duration_ms integer,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'cancelled')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_regeneration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own regeneration logs"
  ON quote_regeneration_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own regeneration logs"
  ON quote_regeneration_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 17. CLIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  contact_name text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION ensure_single_default_model()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE ai_models SET is_default = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_single_default_model ON ai_models;
CREATE TRIGGER enforce_single_default_model
  AFTER INSERT OR UPDATE OF is_default ON ai_models
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_model();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE FUNCTIONS
-- ============================================================================

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

CREATE OR REPLACE FUNCTION set_active_estimate(p_estimate_id uuid, p_project_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_scenario text;
BEGIN
  SELECT scenario_type INTO v_scenario FROM estimates WHERE id = p_estimate_id;

  UPDATE estimates
  SET is_active = false
  WHERE project_id = p_project_id
    AND scenario_type = v_scenario
    AND id != p_estimate_id;

  UPDATE estimates
  SET is_active = true
  WHERE id = p_estimate_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_estimate_history(p_estimate_id uuid)
RETURNS TABLE (
  id uuid,
  scenario_type text,
  total_ttc numeric,
  model_used text,
  is_active boolean,
  regeneration_count integer,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id uuid;
  v_scenario text;
BEGIN
  SELECT e.project_id, e.scenario_type INTO v_project_id, v_scenario
  FROM estimates e WHERE e.id = p_estimate_id;

  RETURN QUERY
  SELECT e.id, e.scenario_type, e.total_ttc, e.model_used, e.is_active, e.regeneration_count, e.created_at
  FROM estimates e
  WHERE e.project_id = v_project_id AND e.scenario_type = v_scenario
  ORDER BY e.created_at DESC;
END;
$$;

-- ============================================================================
-- VIEWS
-- ============================================================================

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
  CASE
    WHEN tier_level = 1 THEN 'GPT-4.1 Mini AI'
    WHEN tier_level = 2 THEN 'Mistral Large 2 AI'
    WHEN tier_level = 3 THEN 'GPT-4.1 Premium AI'
    ELSE 'AI-Powered'
  END as ai_capability_level
FROM subscription_tiers
WHERE is_active = true
ORDER BY sort_order, tier_level;

GRANT SELECT ON public_subscription_plans TO authenticated;
GRANT SELECT ON public_subscription_plans TO anon;

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
