/*
  # Update Mistral Large model ID

  1. Changes
    - Update `ai_models` table: change model_id from deprecated `mistralai/mistral-large-2`
      to the current valid OpenRouter model `mistralai/mistral-large-2512`
    - Update display_name to reflect the new version

  2. Reason
    - The old model ID `mistralai/mistral-large-2` has been deprecated on OpenRouter
    - This caused all Business tier estimate generations to silently fall back to GPT-4.1 Mini
*/

UPDATE ai_models
SET model_id = 'mistralai/mistral-large-2512',
    display_name = 'Mistral Large',
    updated_at = now()
WHERE model_id = 'mistralai/mistral-large-2';
