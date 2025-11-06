/*
  # Add default model support

  1. Changes
    - Add `is_default` column to ai_models table
    - Set one free model as default (Llama 3.1 8B Instruct)
    - Add index for faster default model lookup

  2. Security
    - No RLS changes needed
*/

-- Add is_default column
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Set Llama 3.1 8B Instruct as the default model (it's free and good)
UPDATE ai_models 
SET is_default = true 
WHERE model_id = 'meta-llama/llama-3.1-8b-instruct:free'
AND is_active = true;

-- Ensure only one default model
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_models_is_default 
ON ai_models(is_default) 
WHERE is_default = true;