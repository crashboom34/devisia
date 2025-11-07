/*
  # Ajouter justification du scénario dans les devis

  1. Modifications
    - Ajout de la colonne `scenario_justification` dans la table `estimates`
    - Cette colonne stocke l'explication du scénario (2-3 phrases)
    - Explique pourquoi ce scénario coûte ce prix et son rapport qualité-prix

  2. Notes
    - Colonne nullable pour compatibilité avec les devis existants
    - Type text pour stocker plusieurs phrases
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estimates' AND column_name = 'scenario_justification'
  ) THEN
    ALTER TABLE estimates 
    ADD COLUMN scenario_justification text;
    
    COMMENT ON COLUMN estimates.scenario_justification IS 'Explication du scénario: pourquoi ce prix, les différences avec les autres scénarios, le rapport qualité-prix';
  END IF;
END $$;
