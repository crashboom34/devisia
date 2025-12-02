/*
  # Standardize Subscription System to 3 Tiers

  1. Plan Standardization
    - THREE PLANS ONLY: Starter, Business, Pro
    - Starter: 9.99 €/month (99 €/year)
    - Business: 19.99 €/month (199 €/year)
    - Pro: 29.99 €/month (299 €/year)

  2. AI Model Mapping
    - Starter → GPT-4.1 Mini
    - Business → Mistral Large 2
    - Pro → GPT-4.1

  3. Changes
    - Add GPT-4.1 and GPT-4.1 Mini models to ai_models
    - Add Mistral Large 2 to ai_models
    - Update subscription_tiers to have exactly 3 active tiers
    - Update AI model mappings for each tier
    - Update pricing for all tiers

  4. Security
    - No changes to RLS policies
    - Keep existing admin-only access to AI model details
*/

-- =====================================================
-- 1. ADD NEW AI MODELS
-- =====================================================

-- Add GPT-4.1 Mini (for Starter tier)
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
  'openai/gpt-4.1-mini',
  'GPT-4.1 Mini',
  'Fast and efficient GPT-4.1 Mini model, perfect for accurate estimates at lower cost',
  0.00015,
  0.00060,
  true,
  16384,
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

-- Add GPT-4.1 (for Pro tier)
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
  'openai/gpt-4.1',
  'GPT-4.1',
  'Most advanced GPT-4.1 model with superior accuracy and reasoning for complex construction estimates',
  0.00300,
  0.01200,
  true,
  32768,
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

-- Add Mistral Large 2 (for Business tier)
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
  'mistralai/mistral-large-2',
  'Mistral Large 2',
  'Powerful Mistral Large 2 model with excellent reasoning for complex construction projects',
  0.00300,
  0.00900,
  true,
  131072,
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

-- =====================================================
-- 2. UPDATE SUBSCRIPTION TIERS
-- =====================================================

DO $$
DECLARE
  v_gpt41_mini_id uuid;
  v_mistral_large2_id uuid;
  v_gpt41_id uuid;
BEGIN
  -- Get AI model IDs
  SELECT id INTO v_gpt41_mini_id FROM ai_models WHERE model_id = 'openai/gpt-4.1-mini' LIMIT 1;
  SELECT id INTO v_mistral_large2_id FROM ai_models WHERE model_id = 'mistralai/mistral-large-2' LIMIT 1;
  SELECT id INTO v_gpt41_id FROM ai_models WHERE model_id = 'openai/gpt-4.1' LIMIT 1;

  -- Deactivate ALL existing tiers and clear tier_level to avoid conflicts
  UPDATE subscription_tiers SET is_active = false, tier_level = NULL;

  -- Delete existing tiers that are not our 3 standard ones
  DELETE FROM subscription_tiers WHERE name NOT IN ('starter', 'business', 'pro');

  -- Insert/Update the THREE standardized tiers

  -- STARTER TIER
  INSERT INTO subscription_tiers (
    name, display_name, description,
    price_monthly, price_yearly,
    tier_level, ai_model_id,
    max_projects_per_month, max_estimates_per_project,
    priority_support, features, sort_order, is_active
  ) VALUES (
    'starter',
    'Starter',
    'Pour les artisans qui débutent ou qui veulent tester',
    9.99,
    99.00,
    1,
    v_gpt41_mini_id,
    10,
    999,
    false,
    '["IA GPT-4.1 Mini pour des devis précis", "Ajoutez votre logo, mentions légales et TVA", "Retrouvez facilement tous vos devis, accessibles partout", "Support par email", "Jusqu''à 10 devis par mois", "Jusqu''à 20 clients"]'::jsonb,
    1,
    true
  )
  ON CONFLICT (name)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    tier_level = EXCLUDED.tier_level,
    ai_model_id = EXCLUDED.ai_model_id,
    max_projects_per_month = EXCLUDED.max_projects_per_month,
    max_estimates_per_project = EXCLUDED.max_estimates_per_project,
    priority_support = EXCLUDED.priority_support,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

  -- BUSINESS TIER
  INSERT INTO subscription_tiers (
    name, display_name, description,
    price_monthly, price_yearly,
    tier_level, ai_model_id,
    max_projects_per_month, max_estimates_per_project,
    priority_support, features, sort_order, is_active
  ) VALUES (
    'business',
    'Business',
    'Choisi par la majorité des artisans Devisia',
    19.99,
    199.00,
    2,
    v_mistral_large2_id,
    30,
    999,
    false,
    '["IA Mistral Large 2 pour devis complexes", "Gestion complète des contacts et clients", "Exports PDF illimités et professionnels", "Transformation devis en factures instantanée", "Jusqu''à 30 devis par mois", "Jusqu''à 60 clients"]'::jsonb,
    2,
    true
  )
  ON CONFLICT (name)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    tier_level = EXCLUDED.tier_level,
    ai_model_id = EXCLUDED.ai_model_id,
    max_projects_per_month = EXCLUDED.max_projects_per_month,
    max_estimates_per_project = EXCLUDED.max_estimates_per_project,
    priority_support = EXCLUDED.priority_support,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

  -- PRO TIER
  INSERT INTO subscription_tiers (
    name, display_name, description,
    price_monthly, price_yearly,
    tier_level, ai_model_id,
    max_projects_per_month, max_estimates_per_project,
    priority_support, features, sort_order, is_active
  ) VALUES (
    'pro',
    'Pro',
    'Pour les entreprises et artisans qui gèrent beaucoup de clients',
    29.99,
    299.00,
    3,
    v_gpt41_id,
    999999,
    999,
    true,
    '["IA GPT-4.1 pour l''excellence maximale", "Devis illimités pour forte demande", "Suivi complet du portefeuille client", "Collaboration d''équipe avancée", "Support prioritaire", "Clients illimités"]'::jsonb,
    3,
    true
  )
  ON CONFLICT (name)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    tier_level = EXCLUDED.tier_level,
    ai_model_id = EXCLUDED.ai_model_id,
    max_projects_per_month = EXCLUDED.max_projects_per_month,
    max_estimates_per_project = EXCLUDED.max_estimates_per_project,
    priority_support = EXCLUDED.priority_support,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

END $$;

-- =====================================================
-- 3. UPDATE AI CAPABILITY LABELS
-- =====================================================

-- Update the public_subscription_plans view to reflect new tier names
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

-- =====================================================
-- 4. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE subscription_tiers IS 'Standardized to exactly 3 tiers: Starter (9.99€), Business (19.99€), Pro (29.99€)';
COMMENT ON COLUMN subscription_tiers.tier_level IS 'Tier level: 1=Starter, 2=Business, 3=Pro';
COMMENT ON VIEW public_subscription_plans IS 'Public view showing 3 standardized plans with AI model hints';
