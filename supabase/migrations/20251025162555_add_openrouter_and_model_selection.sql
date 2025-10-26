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
