/*
  # Update AI Models and Subscription Tier Mapping

  1. Modified Tables
    - `ai_models`
      - Upsert Mistral Large 3 (mistralai/mistral-large-2512):
        display_name, costs corrected to official OpenRouter pricing
      - Upsert GPT-4.1 (openai/gpt-4.1):
        display_name, costs corrected to official OpenRouter pricing
    - `subscription_tiers`
      - starter  → mistral-large-2512 (Mistral Large 3)
      - business → mistral-large-2512 (Mistral Large 3)  [already correct, ensuring idempotency]
      - pro      → openai/gpt-4.1 (GPT-4.1)             [already correct, ensuring idempotency]

  2. Plan-to-Model Mapping (canonical)
    Starter  = Mistral Large 3 (OpenRouter) @ $0.0005/$0.0015 per 1k tokens
    Business = Mistral Large 3 (OpenRouter) @ $0.0005/$0.0015 per 1k tokens
    Pro      = GPT-4.1 (OpenRouter)         @ $0.002/$0.008  per 1k tokens

  3. Important Notes
    - Uses ON CONFLICT (provider, model_id) DO UPDATE for idempotency.
    - starter was previously pointing to GPT-4.1 Mini — now corrected to Mistral Large 3.
    - Costs updated to official OpenRouter rates (Jan 2025).
    - A unique constraint on (provider, model_id) is created if it does not already exist.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_models_provider_model_id_key'
    AND conrelid = 'public.ai_models'::regclass
  ) THEN
    ALTER TABLE ai_models ADD CONSTRAINT ai_models_provider_model_id_key UNIQUE (provider, model_id);
  END IF;
END $$;

INSERT INTO ai_models (
  provider,
  model_id,
  display_name,
  cost_per_1k_tokens_input,
  cost_per_1k_tokens_output,
  max_tokens,
  capabilities,
  is_active
) VALUES (
  'openrouter',
  'mistralai/mistral-large-2512',
  'Mistral Large 3 (OpenRouter)',
  0.0005,
  0.0015,
  262144,
  '{"function_calling": true, "vision": false}'::jsonb,
  true
)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name              = EXCLUDED.display_name,
  cost_per_1k_tokens_input  = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  max_tokens                = EXCLUDED.max_tokens,
  capabilities              = EXCLUDED.capabilities,
  is_active                 = EXCLUDED.is_active;

INSERT INTO ai_models (
  provider,
  model_id,
  display_name,
  cost_per_1k_tokens_input,
  cost_per_1k_tokens_output,
  max_tokens,
  capabilities,
  is_active
) VALUES (
  'openrouter',
  'openai/gpt-4.1',
  'GPT-4.1 (OpenRouter)',
  0.002,
  0.008,
  1047576,
  '{"function_calling": true, "vision": true}'::jsonb,
  true
)
ON CONFLICT (provider, model_id) DO UPDATE SET
  display_name              = EXCLUDED.display_name,
  cost_per_1k_tokens_input  = EXCLUDED.cost_per_1k_tokens_input,
  cost_per_1k_tokens_output = EXCLUDED.cost_per_1k_tokens_output,
  max_tokens                = EXCLUDED.max_tokens,
  capabilities              = EXCLUDED.capabilities,
  is_active                 = EXCLUDED.is_active;

UPDATE subscription_tiers
SET ai_model_id = (
  SELECT id FROM ai_models
  WHERE provider = 'openrouter'
  AND model_id = 'mistralai/mistral-large-2512'
  LIMIT 1
)
WHERE name = 'starter';

UPDATE subscription_tiers
SET ai_model_id = (
  SELECT id FROM ai_models
  WHERE provider = 'openrouter'
  AND model_id = 'mistralai/mistral-large-2512'
  LIMIT 1
)
WHERE name = 'business';

UPDATE subscription_tiers
SET ai_model_id = (
  SELECT id FROM ai_models
  WHERE provider = 'openrouter'
  AND model_id = 'openai/gpt-4.1'
  LIMIT 1
)
WHERE name = 'pro';
