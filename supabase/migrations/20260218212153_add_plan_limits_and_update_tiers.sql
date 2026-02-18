/*
  # Add plan limits and update subscription tiers

  1. New Columns on subscription_tiers
    - max_clients        (integer) — max clients the user can store
    - max_users          (integer) — max team members on the account
    - fair_use_limit     (integer) — server-side soft cap for Pro (not shown to users, used for internal throttling)
    - price_monthly_cents (integer) — price in euro-cents for clean display
    - price_yearly_cents  (integer) — price in euro-cents for clean display

  2. Data updates
    Starter  : 10 estimates/mo, 20 clients, 1 user, fair_use=50
    Business : 30 estimates/mo, 60 clients, 3 users, fair_use=150
    Pro      : unlimited (999999) estimates/mo, unlimited clients, unlimited users, fair_use=400

  3. Notes
    - max_projects_per_month is already used as the estimate counter per month — values confirmed.
    - fair_use_limit is internal only; Pro users see "illimites" in UI.
    - Prices already correct (monthly 9.99/19.99/29.99, yearly 99/199/299).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'max_clients'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN max_clients integer NOT NULL DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'max_users'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN max_users integer NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_tiers' AND column_name = 'fair_use_limit'
  ) THEN
    ALTER TABLE subscription_tiers ADD COLUMN fair_use_limit integer NOT NULL DEFAULT 400;
  END IF;
END $$;

UPDATE subscription_tiers SET
  max_projects_per_month   = 10,
  max_clients              = 20,
  max_users                = 1,
  fair_use_limit           = 50,
  priority_support         = false,
  features = '[
    "IA Mistral Large 3 pour des devis précis",
    "Jusqu à 10 devis par mois",
    "Jusqu à 20 clients",
    "1 utilisateur",
    "Support par email"
  ]'::jsonb
WHERE name = 'starter';

UPDATE subscription_tiers SET
  max_projects_per_month   = 30,
  max_clients              = 60,
  max_users                = 3,
  fair_use_limit           = 150,
  priority_support         = false,
  features = '[
    "IA Mistral Large 3 pour devis complexes",
    "Jusqu à 30 devis par mois",
    "Jusqu à 60 clients",
    "Jusqu à 3 utilisateurs",
    "Exports PDF illimités et professionnels",
    "Transformation des devis en factures"
  ]'::jsonb
WHERE name = 'business';

UPDATE subscription_tiers SET
  max_projects_per_month   = 999999,
  max_clients              = 999999,
  max_users                = 999999,
  fair_use_limit           = 400,
  priority_support         = true,
  features = '[
    "IA GPT-4.1 pour l excellence maximale",
    "Devis illimités pour forte demande",
    "Clients et utilisateurs illimités",
    "Suivi complet du portefeuille client",
    "Collaboration d équipe avancée",
    "Support prioritaire"
  ]'::jsonb
WHERE name = 'pro';
