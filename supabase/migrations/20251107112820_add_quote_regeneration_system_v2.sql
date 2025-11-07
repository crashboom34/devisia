/*
  # Système de régénération de devis
  
  ## Description
  Ajoute la fonctionnalité de régénération de devis avec historique et comparaison.
  
  ## Nouvelles colonnes dans `estimates`
  - `is_active` (boolean): Indique si c'est le devis actif pour ce scénario
  - `regenerated_from_id` (uuid): Référence vers le devis original (si régénéré)
  - `regeneration_count` (integer): Nombre de fois que ce devis a été régénéré
  
  ## Nouvelle table `quote_regeneration_log`
  Table pour logger toutes les activités de régénération
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Seuls les propriétaires peuvent régénérer leurs devis
  - Logs accessibles uniquement au propriétaire
*/

-- Ajouter les colonnes à la table estimates
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS regenerated_from_id uuid REFERENCES estimates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS regeneration_count integer DEFAULT 0;

-- Créer un index pour les requêtes de devis actifs
CREATE INDEX IF NOT EXISTS idx_estimates_active 
ON estimates(project_id, scenario_type, is_active) 
WHERE is_active = true;

-- Créer la table de logs de régénération
CREATE TABLE IF NOT EXISTS quote_regeneration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES estimates(id) ON DELETE CASCADE,
  original_estimate_id uuid REFERENCES estimates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  old_model text,
  new_model text,
  old_total_ttc numeric,
  new_total_ttc numeric,
  price_difference_percent numeric,
  regeneration_duration_ms integer,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'cancelled')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_estimate_ids CHECK (estimate_id != original_estimate_id OR original_estimate_id IS NULL)
);

-- Index pour les requêtes de logs
CREATE INDEX IF NOT EXISTS idx_regeneration_log_user 
ON quote_regeneration_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regeneration_log_estimate 
ON quote_regeneration_log(estimate_id);

-- Activer RLS sur la table de logs
ALTER TABLE quote_regeneration_log ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view own regeneration logs"
ON quote_regeneration_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy: Les utilisateurs peuvent créer des logs pour leurs devis
CREATE POLICY "Users can create regeneration logs"
ON quote_regeneration_log
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM estimates e
    JOIN projects p ON e.project_id = p.id
    WHERE e.id = quote_regeneration_log.estimate_id
    AND p.user_id = auth.uid()
  )
);

-- Fonction pour marquer un devis comme actif et désactiver les autres
CREATE OR REPLACE FUNCTION set_active_estimate(
  p_estimate_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_scenario_type text;
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur est propriétaire du projet
  SELECT e.project_id, e.scenario_type
  INTO v_project_id, v_scenario_type
  FROM estimates e
  JOIN projects p ON e.project_id = p.id
  WHERE e.id = p_estimate_id
  AND p.user_id = p_user_id;
  
  IF v_project_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Estimate not found or unauthorized'
    );
  END IF;
  
  -- Désactiver tous les autres devis du même scénario
  UPDATE estimates
  SET is_active = false
  WHERE project_id = v_project_id
  AND scenario_type = v_scenario_type
  AND id != p_estimate_id;
  
  -- Activer le devis sélectionné
  UPDATE estimates
  SET is_active = true
  WHERE id = p_estimate_id;
  
  RETURN json_build_object(
    'success', true,
    'estimate_id', p_estimate_id
  );
END;
$$;

-- Fonction utilitaire pour obtenir l'historique d'un devis
CREATE OR REPLACE FUNCTION get_estimate_history(p_estimate_id uuid)
RETURNS TABLE (
  estimate_id uuid,
  model_used text,
  total_ttc numeric,
  is_active boolean,
  created_at timestamptz,
  regeneration_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_scenario_type text;
BEGIN
  -- Récupérer le projet et scénario du devis
  SELECT e.project_id, e.scenario_type
  INTO v_project_id, v_scenario_type
  FROM estimates e
  WHERE e.id = p_estimate_id;
  
  -- Retourner tous les devis du même scénario
  RETURN QUERY
  SELECT 
    e.id,
    e.model_used,
    e.total_ttc,
    e.is_active,
    e.created_at,
    e.regeneration_count
  FROM estimates e
  WHERE e.project_id = v_project_id
  AND e.scenario_type = v_scenario_type
  ORDER BY e.created_at DESC;
END;
$$;

COMMENT ON TABLE quote_regeneration_log IS 'Logs de toutes les régénérations de devis pour audit et analyse';
COMMENT ON FUNCTION set_active_estimate IS 'Marque un devis comme actif et désactive les autres versions du même scénario';
COMMENT ON FUNCTION get_estimate_history IS 'Retourne l''historique complet d''un devis (toutes les versions)';
