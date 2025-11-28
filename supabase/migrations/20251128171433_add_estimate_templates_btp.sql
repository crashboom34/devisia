/*
  # Templates de Devis BTP

  ## Changements

  ### 1. Nouvelle table `estimate_templates`
  Structure pour stocker les templates de devis BTP réutilisables:
  - `id` : Identifiant unique du template
  - `template_id` : ID technique (slug) du template
  - `name` : Nom du template
  - `category` : Catégorie (Second œuvre, Gros œuvre, etc.)
  - `lots` : Structure JSON des lots, postes et gammes
  - `is_active` : Template actif ou non
  - `sort_order` : Ordre d'affichage
  - `created_at` : Date de création

  ### Structure JSON des lots:
  ```json
  [
    {
      "name": "Nom du lot",
      "postes": [
        {
          "name": "Nom du poste",
          "description": "Description détaillée",
          "gamme_entree": "Spécifications gamme entrée",
          "gamme_standard": "Spécifications gamme standard",
          "gamme_premium": "Spécifications gamme premium"
        }
      ]
    }
  ]
  ```

  ## Sécurité
  - RLS activé
  - Tous les utilisateurs authentifiés peuvent lire les templates
  - Seuls les admins peuvent créer/modifier/supprimer
*/

-- 1. Création de la table estimate_templates
CREATE TABLE IF NOT EXISTS estimate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lots JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_estimate_templates_template_id ON estimate_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_category ON estimate_templates(category);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_active ON estimate_templates(is_active) WHERE is_active = true;

-- 2. RLS
ALTER TABLE estimate_templates ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY "Anyone can view active templates"
  ON estimate_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Création/Modification/Suppression: réservés aux admins
CREATE POLICY "Only admins can insert templates"
  ON estimate_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update templates"
  ON estimate_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete templates"
  ON estimate_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );