/*
  # Ajouter le nom du modèle utilisé dans les devis

  1. Modifications
    - Ajout de la colonne `model_used` dans la table `estimates`
    - Cette colonne stocke le nom du modèle AI qui a généré le devis
    - Permet de tracer quel modèle a été utilisé (important pour le fallback)

  2. Notes
    - Colonne nullable pour compatibilité avec les devis existants
    - Les nouveaux devis auront toujours cette information
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estimates' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE estimates 
    ADD COLUMN model_used text;
    
    COMMENT ON COLUMN estimates.model_used IS 'Nom du modèle AI qui a généré ce devis';
  END IF;
END $$;
