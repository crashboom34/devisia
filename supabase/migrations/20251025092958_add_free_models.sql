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
