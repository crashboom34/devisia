/*
  # Amélioration de la structure des devis BTP

  1. Modifications de la table `estimates`
    - Ajout de champs pour les informations du devis
    - Ajout de champs pour les montants HT/TTC et TVA
    - Ajout de métadonnées du devis (validité, conditions, délai, etc.)

  2. Structure des données
    - Les `line_items` incluront maintenant : poste, description, quantité, unité,
      prix unitaire HT, montant HT, TVA%, montant TTC, lot, matériaux, main-d'œuvre
    - Les `categories` regroupent les postes par lot avec sous-totaux
    - Les montants globaux incluent total HT, total TVA, total TTC, remise

  3. Nouveaux champs
    - `estimate_number` : numéro de devis
    - `client_name` : nom du client
    - `estimate_date` : date du devis
    - `validity_days` : validité du devis en jours
    - `payment_terms` : conditions de paiement
    - `execution_delay` : délai d'exécution
    - `deposit_required` : acompte requis (%)
    - `special_conditions` : conditions particulières
    - `total_ht` : montant total HT
    - `total_tva` : montant total TVA
    - `total_ttc` : montant total TTC (remplace total_amount)
    - `discount_amount` : montant de remise
    - `discount_percent` : pourcentage de remise
*/

DO $$
BEGIN
  -- Add estimate_number if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'estimate_number'
  ) THEN
    ALTER TABLE estimates ADD COLUMN estimate_number text;
  END IF;

  -- Add client_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE estimates ADD COLUMN client_name text;
  END IF;

  -- Add estimate_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'estimate_date'
  ) THEN
    ALTER TABLE estimates ADD COLUMN estimate_date timestamptz DEFAULT now();
  END IF;

  -- Add validity_days if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'validity_days'
  ) THEN
    ALTER TABLE estimates ADD COLUMN validity_days integer DEFAULT 30;
  END IF;

  -- Add payment_terms if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE estimates ADD COLUMN payment_terms text;
  END IF;

  -- Add execution_delay if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'execution_delay'
  ) THEN
    ALTER TABLE estimates ADD COLUMN execution_delay text;
  END IF;

  -- Add deposit_required if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'deposit_required'
  ) THEN
    ALTER TABLE estimates ADD COLUMN deposit_required numeric(5,2) DEFAULT 0;
  END IF;

  -- Add special_conditions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'special_conditions'
  ) THEN
    ALTER TABLE estimates ADD COLUMN special_conditions text;
  END IF;

  -- Add total_ht if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'total_ht'
  ) THEN
    ALTER TABLE estimates ADD COLUMN total_ht numeric(12,2) DEFAULT 0;
  END IF;

  -- Add total_tva if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'total_tva'
  ) THEN
    ALTER TABLE estimates ADD COLUMN total_tva numeric(12,2) DEFAULT 0;
  END IF;

  -- Add total_ttc if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'total_ttc'
  ) THEN
    ALTER TABLE estimates ADD COLUMN total_ttc numeric(12,2) DEFAULT 0;
  END IF;

  -- Add discount_amount if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE estimates ADD COLUMN discount_amount numeric(12,2) DEFAULT 0;
  END IF;

  -- Add discount_percent if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'discount_percent'
  ) THEN
    ALTER TABLE estimates ADD COLUMN discount_percent numeric(5,2) DEFAULT 0;
  END IF;

END $$;
