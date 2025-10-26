/*
  # Ajout de modèles gratuits

  Ajoute des modèles IA gratuits ou à très bas coût pour les utilisateurs.
*/

-- Ajouter des modèles gratuits/économiques
INSERT INTO ai_models (provider, model_id, display_name, description, cost_per_1k_tokens_input, cost_per_1k_tokens_output, max_tokens, capabilities, is_active) VALUES
  ('openrouter', 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (Gratuit)', 'Modele open-source gratuit via OpenRouter', 0.0, 0.0, 32768, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'google/gemma-2-9b-it:free', 'Gemma 2 9B (Gratuit)', 'Modele Google gratuit via OpenRouter', 0.0, 0.0, 8192, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'nousresearch/hermes-3-llama-3.1-405b:free', 'Hermes 3 Llama 405B (Gratuit)', 'Modele tres puissant gratuit limite', 0.0, 0.0, 16384, '{"function_calling": true, "vision": false}'::jsonb, true),
  ('openrouter', 'meta-llama/llama-3.2-3b-instruct:free', 'Llama 3.2 3B (Gratuit)', 'Petit modele rapide et gratuit', 0.0, 0.0, 131072, '{"function_calling": false, "vision": false}'::jsonb, true)
ON CONFLICT (provider, model_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output;
/*
  # Fix Admin Bootstrap - Allow First Super Admin

  ## Problem
  Current RLS policies prevent creating the first admin user because they require
  being a super admin to insert into admin_users table (chicken and egg problem).

  ## Solution
  Add a special policy that allows ANY authenticated user to insert themselves as
  super_admin ONLY if NO super admins exist yet (bootstrap scenario).

  ## Changes
  1. Drop the restrictive INSERT policy
  2. Create a new policy that allows:
     - Super admins to insert (normal case)
     - ANY authenticated user to insert if no super admins exist (bootstrap case)

  ## Security
  - Once a super admin exists, only super admins can create new admins
  - Regular users cannot promote themselves after bootstrap
  - The bootstrap window closes automatically after first super admin
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Only super admins can modify admin users" ON admin_users;

-- Create separate policies for different operations

-- SELECT: Admins can view other admins (keep existing)
-- (Already exists: "Admins can view other admins")

-- INSERT: Allow bootstrap + super admin management
CREATE POLICY "Allow first super admin or super admin inserts"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Case 1: Bootstrap - no super admins exist yet
    (NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin'))
    OR
    -- Case 2: Already a super admin
    is_super_admin()
  );

-- UPDATE: Only super admins can update
CREATE POLICY "Only super admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- DELETE: Only super admins can delete
CREATE POLICY "Only super admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_super_admin());
/*
  # Add OpenRouter Support and Model Selection

  ## Changes
  1. **Expand provider constraint** to include 'openrouter'
  2. **Add model_id column** to store specific model selection (e.g., 'meta-llama/llama-3.1-8b-instruct:free')
  3. **Add model_name column** for display purposes (e.g., 'Llama 3.1 8B')

  ## Security
  - Maintains existing RLS policies
  - No breaking changes to existing data

  ## Migration Safety
  - Uses IF NOT EXISTS checks
  - Non-destructive column additions
*/

-- Drop the old constraint
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;

-- Add new constraint with openrouter
ALTER TABLE api_keys ADD CONSTRAINT api_keys_provider_check 
  CHECK (provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'openrouter'::text]));

-- Add model_id column for specific model selection (optional, NULL for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'model_id'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN model_id text;
  END IF;
END $$;

-- Add model_name column for display purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN model_name text;
  END IF;
END $$;

-- Add comment explaining the columns
COMMENT ON COLUMN api_keys.model_id IS 'Specific model identifier (e.g., meta-llama/llama-3.1-8b-instruct:free for OpenRouter)';
COMMENT ON COLUMN api_keys.model_name IS 'Human-readable model name for display (e.g., Llama 3.1 8B Free)';
/*
  # Add User Preferences and New AI Models

  ## Overview
  This migration implements a centralized API key management system where:
  - Admins manage ALL API keys via system_config
  - Users select their preferred model from available options
  - All AI API calls are proxied through Edge Functions using admin-configured keys

  ## Changes

  ### 1. New Tables
  
  #### user_preferences
  Stores user-specific settings including their preferred AI model selection
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - unique per user
  - `preferred_model_id` (uuid, references ai_models) - user's selected model
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. New AI Models

  Three new models added to `ai_models`:
  
  1. **Llama 3.1 8B Instruct (OpenRouter)** - FREE
     - Fast, efficient, great for general tasks
     - Cost: $0 (completely free)
  
  2. **Mixtral 8x22B Instruct (OpenRouter)**
     - Powerful mixture-of-experts model
     - Cost: $0.0009 per 1K input tokens, $0.0009 per 1K output tokens
  
  3. **Claude 3 Haiku (Anthropic)** - Medium 3.1
     - Fast, affordable, high quality
     - Cost: $0.00025 per 1K input tokens, $0.00125 per 1K output tokens

  ### 3. Security
  
  - RLS enabled on user_preferences
  - Users can only read/update their own preferences
  - All users can view active AI models
  - Only super admins can modify ai_models

  ### 4. Migration Safety
  
  - Uses IF NOT EXISTS for idempotent operations
  - Non-destructive additions only
  - Backward compatible with existing data
*/

-- =====================================================
-- 1. CREATE USER_PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_model_id ON user_preferences(preferred_model_id);

-- Add comment
COMMENT ON TABLE user_preferences IS 'User-specific preferences including AI model selection';
COMMENT ON COLUMN user_preferences.preferred_model_id IS 'The AI model this user prefers to use (NULL = use system default)';

-- =====================================================
-- 2. ROW LEVEL SECURITY FOR USER_PREFERENCES
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all preferences
DROP POLICY IF EXISTS "Admins can view all preferences" ON user_preferences;
CREATE POLICY "Admins can view all preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. ADD NEW AI MODELS
-- =====================================================

-- Insert Llama 3.1 8B Instruct (FREE)
INSERT INTO ai_models (
  provider,
  model_id,
  display_name,
  description,
  cost_per_1k_tokens_input,
  cost_per_1k_tokens_output,
  is_active,
  max_tokens,
  capabilities
) VALUES (
  'openrouter',
  'meta-llama/llama-3.1-8b-instruct:free',
  'Llama 3.1 8B Instruct (FREE)',
  'Fast and efficient open-source model, perfect for general tasks. Completely free to use via OpenRouter.',
  0.000000,
  0.000000,
  true,
  8192,
  '{"function_calling": true, "json_mode": true, "streaming": true, "vision": false}'::jsonb
)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  is_active = EXCLUDED.is_active,
  max_tokens = EXCLUDED.max_tokens,
  capabilities = EXCLUDED.capabilities;

-- Insert Mixtral 8x22B Instruct
INSERT INTO ai_models (
  provider,
  model_id,
  display_name,
  description,
  cost_per_1k_tokens_input,
  cost_per_1k_tokens_output,
  is_active,
  max_tokens,
  capabilities
) VALUES (
  'openrouter',
  'mistralai/mixtral-8x22b-instruct',
  'Mixtral 8x22B Instruct',
  'Powerful mixture-of-experts model with excellent reasoning capabilities. Great for complex tasks requiring deep analysis.',
  0.000900,
  0.000900,
  true,
  65536,
  '{"function_calling": true, "json_mode": true, "streaming": true, "vision": false}'::jsonb
)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  is_active = EXCLUDED.is_active,
  max_tokens = EXCLUDED.max_tokens,
  capabilities = EXCLUDED.capabilities;

-- Insert Claude 3 Haiku (Medium 3.1)
INSERT INTO ai_models (
  provider,
  model_id,
  display_name,
  description,
  cost_per_1k_tokens_input,
  cost_per_1k_tokens_output,
  is_active,
  max_tokens,
  capabilities
) VALUES (
  'anthropic',
  'claude-3-haiku-20240307',
  'Claude 3 Haiku',
  'Fast, affordable, and intelligent. Perfect balance of speed and quality for most tasks. Part of the Claude 3 family.',
  0.000250,
  0.001250,
  true,
  200000,
  '{"function_calling": true, "json_mode": true, "streaming": true, "vision": true}'::jsonb
)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  is_active = EXCLUDED.is_active,
  max_tokens = EXCLUDED.max_tokens,
  capabilities = EXCLUDED.capabilities;

-- =====================================================
-- 4. UPDATE AI_MODELS RLS POLICIES
-- =====================================================

-- Allow all authenticated users to view active models
DROP POLICY IF EXISTS "Authenticated users can view active models" ON ai_models;
CREATE POLICY "Authenticated users can view active models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only super admins can modify models
DROP POLICY IF EXISTS "Only super admins can modify models" ON ai_models;
CREATE POLICY "Only super admins can modify models"
  ON ai_models FOR ALL
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

-- =====================================================
-- 5. ADD HELPER FUNCTION
-- =====================================================

-- Function to get user's preferred model or system default
CREATE OR REPLACE FUNCTION get_user_model(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Try to get user's preferred model
  SELECT preferred_model_id INTO v_model_id
  FROM user_preferences
  WHERE user_id = p_user_id
  AND preferred_model_id IS NOT NULL;

  -- If no preference, get the first active free model as default
  IF v_model_id IS NULL THEN
    SELECT id INTO v_model_id
    FROM ai_models
    WHERE is_active = true
    AND cost_per_1k_tokens_input = 0
    AND cost_per_1k_tokens_output = 0
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- If still no model, get any active model
  IF v_model_id IS NULL THEN
    SELECT id INTO v_model_id
    FROM ai_models
    WHERE is_active = true
    ORDER BY cost_per_1k_tokens_input ASC, created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_model_id;
END;
$$;

COMMENT ON FUNCTION get_user_model IS 'Returns the preferred model for a user, falling back to system default if none selected';
/*
  # Add automatic profile creation trigger
  
  1. Changes
    - Add trigger to automatically create profile when user signs up
    - This ensures that projects.user_id foreign key constraint is satisfied
  
  2. Security
    - Maintains existing RLS policies on profiles table
*/

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
);
