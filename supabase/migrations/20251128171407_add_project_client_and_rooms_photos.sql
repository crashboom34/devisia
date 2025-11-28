/*
  # Évolution Devisia - Projets, Clients et Photos par Pièce

  ## Changements

  ### 1. Projets sans devis obligatoire
  - Ajout de champs client sur la table `projects`:
    - `client_name` : Nom du client
    - `client_address` : Adresse du chantier
    - `work_type` : Type de travaux
    - `notes` : Notes diverses
  
  ### 2. Nouvelle table `project_rooms` (Pièces/Zones)
  - `id` : UUID unique
  - `project_id` : Référence au projet
  - `name` : Nom de la pièce (ex: "Salon", "Chambre 1")
  - `description` : Description de la pièce
  - `sort_order` : Ordre d'affichage
  - `created_at` / `updated_at` : Timestamps
  
  ### 3. Nouvelle table `room_photos` (Photos par pièce)
  - `id` : UUID unique
  - `room_id` : Référence à la pièce
  - `image_url` : URL de stockage de la photo
  - `comment` : Commentaire sur la photo
  - `dimensions_text` : Dimensions en texte libre (ex: "3,50m x 4,20m, HSP 2,50m")
  - `sort_order` : Ordre d'affichage
  - `created_at` : Timestamp

  ## Sécurité
  - RLS activé sur toutes les tables
  - Politiques pour que chaque utilisateur accède uniquement à ses propres données
*/

-- 1. Ajout des champs client sur projects
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS work_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Création de la table project_rooms
CREATE TABLE IF NOT EXISTS project_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_project_rooms_project_id ON project_rooms(project_id);

-- 3. Création de la table room_photos
CREATE TABLE IF NOT EXISTS room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES project_rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  comment TEXT,
  dimensions_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_room_photos_room_id ON room_photos(room_id);

-- 4. RLS sur project_rooms
ALTER TABLE project_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project rooms"
  ON project_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_rooms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project rooms"
  ON project_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_rooms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project rooms"
  ON project_rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_rooms.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_rooms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project rooms"
  ON project_rooms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_rooms.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 5. RLS sur room_photos
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own room photos"
  ON room_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_rooms
      JOIN projects ON projects.id = project_rooms.project_id
      WHERE project_rooms.id = room_photos.room_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own room photos"
  ON room_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_rooms
      JOIN projects ON projects.id = project_rooms.project_id
      WHERE project_rooms.id = room_photos.room_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own room photos"
  ON room_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_rooms
      JOIN projects ON projects.id = project_rooms.project_id
      WHERE project_rooms.id = room_photos.room_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_rooms
      JOIN projects ON projects.id = project_rooms.project_id
      WHERE project_rooms.id = room_photos.room_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own room photos"
  ON room_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_rooms
      JOIN projects ON projects.id = project_rooms.project_id
      WHERE project_rooms.id = room_photos.room_id
      AND projects.user_id = auth.uid()
    )
  );