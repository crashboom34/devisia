/*
  # Ajouter politique de suppression pour les devis

  1. Sécurité
    - Ajoute une politique DELETE pour la table `estimates`
    - Les utilisateurs peuvent supprimer uniquement les devis de leurs propres projets
    - Vérifie l'ownership via la table `projects`
*/

-- Supprimer la politique si elle existe déjà (pour la recréer)
DROP POLICY IF EXISTS "Users can delete estimates for own projects" ON estimates;

-- Politique DELETE : les utilisateurs peuvent supprimer leurs propres devis
CREATE POLICY "Users can delete estimates for own projects"
  ON estimates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM projects
      WHERE projects.id = estimates.project_id
      AND projects.user_id = auth.uid()
    )
  );
