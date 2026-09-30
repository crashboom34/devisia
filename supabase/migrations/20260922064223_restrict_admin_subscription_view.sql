CREATE OR REPLACE VIEW public.admin_subscription_tier_models
WITH (security_invoker = true)
AS
SELECT
  st.id,
  st.name,
  st.display_name,
  st.tier_level,
  st.price_monthly,
  st.price_yearly,
  st.is_active,
  st.ai_model_id,
  am.display_name AS ai_model_name,
  am.model_id AS ai_model_identifier,
  am.provider AS ai_provider,
  am.cost_per_1k_tokens_input,
  am.cost_per_1k_tokens_output,
  am.max_tokens
FROM public.subscription_tiers st
LEFT JOIN public.ai_models am ON st.ai_model_id = am.id
WHERE public.is_admin()
ORDER BY st.tier_level;

REVOKE ALL ON public.admin_subscription_tier_models FROM PUBLIC, anon;
GRANT SELECT ON public.admin_subscription_tier_models TO authenticated, service_role;
