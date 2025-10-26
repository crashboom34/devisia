/*
  # SCHÉMA COMPLET - Plateforme d'Estimation IA avec Gestion Multi-Modèles

  Ce fichier contient le schéma complet de la base de données.
  Exécutez ce fichier EN ENTIER dans le SQL Editor de Supabase.

  ## Tables créées:
  1. profiles - Profils utilisateurs
  2. api_keys - Clés API OpenAI/Anthropic/OpenRouter
  3. projects - Projets utilisateurs
  4. estimates - Estimations générées
  5. ai_models - Modèles IA disponibles
  6. admin_users - Utilisateurs administrateurs
  7. subscription_tiers - Plans d'abonnement
  8. user_subscriptions - Abonnements actifs
  9. api_usage_logs - Logs d'utilisation API
  10. rate_limits - Limites de taux
  11. system_config - Configuration système
  12. user_preferences - Préférences utilisateur
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

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. API_KEYS TABLE
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

COMMENT ON COLUMN api_keys.model_id IS 'Specific model identifier (e.g., meta-llama/llama-3.1-8b-instruct:free for OpenRouter)';
COMMENT ON COLUMN api_keys.model_name IS 'Human-readable model name for display (e.g., Llama 3.1 8B Free)';

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ESTIMATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  voice_input_url text,
  transcript text,
  estimate_data jsonb NOT NULL,
  ai_model text,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimates"
  ON estimates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own estimates"
  ON estimates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. AI_MODELS TABLE
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, model_id)
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active AI models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default AI models
INSERT INTO ai_models (provider, model_id, display_name, description, cost_per_1k_tokens_input, cost_per_1k_tokens_output, max_tokens, capabilities, is_active) VALUES
  ('openrouter', 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (Gratuit)', 'Modele open-source gratuit via OpenRouter', 0.0, 0.0, 32768, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'google/gemma-2-9b-it:free', 'Gemma 2 9B (Gratuit)', 'Modele Google gratuit via OpenRouter', 0.0, 0.0, 8192, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'nousresearch/hermes-3-llama-3.1-405b:free', 'Hermes 3 Llama 405B (Gratuit)', 'Modele tres puissant gratuit limite', 0.0, 0.0, 16384, '{"function_calling": true, "vision": false}'::jsonb, true),
  ('openrouter', 'meta-llama/llama-3.2-3b-instruct:free', 'Llama 3.2 3B (Gratuit)', 'Petit modele rapide et gratuit', 0.0, 0.0, 131072, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openai', 'gpt-4o', 'GPT-4o', 'Le modele le plus avance d''OpenAI', 0.0025, 0.01, 128000, '{"function_calling": true, "vision": true}'::jsonb, true),
  ('openai', 'gpt-4o-mini', 'GPT-4o Mini', 'Version economique de GPT-4o', 0.00015, 0.0006, 128000, '{"function_calling": true, "vision": true}'::jsonb, true),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Modele rapide et economique', 0.0005, 0.0015, 16385, '{"function_calling": true, "vision": false}'::jsonb, true),
  ('anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 'Le modele le plus intelligent d''Anthropic', 0.003, 0.015, 200000, '{"function_calling": true, "vision": true}'::jsonb, true),
  ('anthropic', 'claude-3-haiku-20240307', 'Claude 3 Haiku', 'Modele rapide et economique', 0.00025, 0.00125, 200000, '{"function_calling": true, "vision": true}'::jsonb, true),
  ('openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet (OpenRouter)', 'Via OpenRouter avec cle API unique', 0.003, 0.015, 200000, '{"function_calling": true, "vision": true}'::jsonb, true),
  ('openrouter', 'openai/gpt-4o', 'GPT-4o (OpenRouter)', 'Via OpenRouter avec cle API unique', 0.0025, 0.01, 128000, '{"function_calling": true, "vision": true}'::jsonb, true)
ON CONFLICT (provider, model_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output;

-- ============================================================================
-- 6. ADMIN_USERS TABLE
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
    (
      NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin')
      AND role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Only super admins can update admins"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Only super admins can delete admins"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
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
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription tiers"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
  ('free', 'Gratuit', 'Pour commencer', 0, 0,
   '["10 estimations/mois", "Modeles IA gratuits", "Support communautaire"]'::jsonb,
   '{"estimates_per_month": 10, "max_projects": 3, "api_calls_per_day": 50}'::jsonb, 1),
  ('pro', 'Pro', 'Pour les professionnels', 29.99, 299.99,
   '["Estimations illimitees", "Tous les modeles IA", "Support prioritaire", "Export PDF", "Historique complet"]'::jsonb,
   '{"estimates_per_month": -1, "max_projects": -1, "api_calls_per_day": 1000}'::jsonb, 2),
  ('business', 'Business', 'Pour les equipes', 99.99, 999.99,
   '["Tout Pro +", "Collaboration equipe", "API acces", "Branding personnalise", "SLA 99.9%"]'::jsonb,
   '{"estimates_per_month": -1, "max_projects": -1, "api_calls_per_day": 5000, "team_members": 10}'::jsonb, 3),
  ('enterprise', 'Enterprise', 'Solutions sur mesure', 0, 0,
   '["Tout Business +", "Volume illimite", "Support dedie", "On-premise possible", "Formation incluse"]'::jsonb,
   '{"estimates_per_month": -1, "max_projects": -1, "api_calls_per_day": -1, "team_members": -1}'::jsonb, 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 8. USER_SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  tier_id uuid REFERENCES subscription_tiers ON DELETE RESTRICT NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')) DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. API_USAGE_LOGS TABLE
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
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_end);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  TO authenticated
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
  ON system_config FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can view all system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can modify system config"
  ON system_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

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
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create profile when user signs up
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

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
