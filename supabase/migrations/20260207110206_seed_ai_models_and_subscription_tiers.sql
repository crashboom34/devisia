/*
  # Seed AI Models and Subscription Tiers

  1. AI Models Added
    - GPT-4.1 Mini (openrouter) - For Starter tier
    - GPT-4.1 (openrouter) - For Pro tier
    - Mistral Large 2 (openrouter) - For Business tier
    - Free models for fallback (Mistral 7B, Gemma 2, Llama 3.2)

  2. Subscription Tiers (3 plans)
    - Starter: 9.99/month, GPT-4.1 Mini, 10 projects/month
    - Business: 19.99/month, Mistral Large 2, 30 projects/month
    - Pro: 29.99/month, GPT-4.1, unlimited projects

  3. Important Notes
    - Each tier maps to a specific AI model via ai_model_id
    - The get_user_ai_model() function resolves tier -> model at runtime
    - Free fallback models available for users without subscriptions
*/

-- =====================================================
-- 1. INSERT AI MODELS
-- =====================================================

INSERT INTO ai_models (provider, model_id, display_name, description, cost_per_1k_tokens_input, cost_per_1k_tokens_output, max_tokens, capabilities, is_active)
VALUES
  ('openrouter', 'openai/gpt-4.1-mini', 'GPT-4.1 Mini', 'Fast and efficient GPT-4.1 Mini model for accurate estimates at lower cost', 0.00015, 0.00060, 16384, '{"function_calling": true, "json_mode": true, "streaming": true, "vision": false}'::jsonb, true),
  ('openrouter', 'openai/gpt-4.1', 'GPT-4.1', 'Most advanced GPT-4.1 model with superior accuracy for complex construction estimates', 0.00300, 0.01200, 32768, '{"function_calling": true, "json_mode": true, "streaming": true, "vision": true}'::jsonb, true),
  ('openrouter', 'mistralai/mistral-large-2', 'Mistral Large 2', 'Powerful Mistral Large 2 model with excellent reasoning for complex construction projects', 0.00300, 0.00900, 131072, '{"function_calling": true, "json_mode": true, "streaming": true, "vision": false}'::jsonb, true),
  ('openrouter', 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (Gratuit)', 'Modele open-source gratuit via OpenRouter', 0.0, 0.0, 32768, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'google/gemma-2-9b-it:free', 'Gemma 2 9B (Gratuit)', 'Modele Google gratuit via OpenRouter', 0.0, 0.0, 8192, '{"function_calling": false, "vision": false}'::jsonb, true),
  ('openrouter', 'meta-llama/llama-3.2-3b-instruct:free', 'Llama 3.2 3B (Gratuit)', 'Petit modele rapide et gratuit', 0.0, 0.0, 131072, '{"function_calling": false, "vision": false}'::jsonb, true)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  cost_per_1k_tokens_input = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  is_active = EXCLUDED.is_active,
  max_tokens = EXCLUDED.max_tokens,
  capabilities = EXCLUDED.capabilities;

-- Set default model
UPDATE ai_models SET is_default = true WHERE model_id = 'openai/gpt-4.1-mini';

-- =====================================================
-- 2. INSERT SUBSCRIPTION TIERS
-- =====================================================

DO $$
DECLARE
  v_gpt41_mini_id uuid;
  v_mistral_large2_id uuid;
  v_gpt41_id uuid;
BEGIN
  SELECT id INTO v_gpt41_mini_id FROM ai_models WHERE model_id = 'openai/gpt-4.1-mini' LIMIT 1;
  SELECT id INTO v_mistral_large2_id FROM ai_models WHERE model_id = 'mistralai/mistral-large-2' LIMIT 1;
  SELECT id INTO v_gpt41_id FROM ai_models WHERE model_id = 'openai/gpt-4.1' LIMIT 1;

  INSERT INTO subscription_tiers (
    name, display_name, description,
    price_monthly, price_yearly,
    tier_level, ai_model_id,
    max_projects_per_month, max_estimates_per_project,
    priority_support, features, sort_order, is_active
  ) VALUES
  (
    'starter',
    'Starter',
    'Pour les artisans qui debutent ou qui veulent tester',
    9.99, 99.00,
    1, v_gpt41_mini_id,
    10, 999, false,
    '["IA GPT-4.1 Mini pour des devis precis", "Ajoutez votre logo, mentions legales et TVA", "Retrouvez facilement tous vos devis", "Support par email", "Jusqu''a 10 devis par mois"]'::jsonb,
    1, true
  ),
  (
    'business',
    'Business',
    'Choisi par la majorite des artisans Devisia',
    19.99, 199.00,
    2, v_mistral_large2_id,
    30, 999, false,
    '["IA Mistral Large 2 pour devis complexes", "Gestion complete des contacts et clients", "Exports PDF illimites et professionnels", "Transformation devis en factures", "Jusqu''a 30 devis par mois"]'::jsonb,
    2, true
  ),
  (
    'pro',
    'Pro',
    'Pour les entreprises et artisans qui gerent beaucoup de clients',
    29.99, 299.00,
    3, v_gpt41_id,
    999999, 999, true,
    '["IA GPT-4.1 pour l''excellence maximale", "Devis illimites pour forte demande", "Suivi complet du portefeuille client", "Collaboration d''equipe avancee", "Support prioritaire", "Clients illimites"]'::jsonb,
    3, true
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
