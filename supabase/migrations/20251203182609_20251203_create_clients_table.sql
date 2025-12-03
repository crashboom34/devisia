/*
  # Create Clients Table

  1. New Table: clients
    - id (uuid, primary key)
    - user_id (uuid, references auth.users, required)
    - name (text, required) - Nom / Raison sociale
    - company (text, nullable) - Entreprise / Nom commercial
    - contact_name (text, nullable) - Nom du contact
    - email (text, nullable)
    - phone (text, nullable)
    - address (text, nullable)
    - postal_code (text, nullable)
    - city (text, nullable)
    - notes (text, nullable)
    - created_at (timestamp)
    - updated_at (timestamp)

  2. Security
    - Enable RLS
    - Users can only read/write their own clients
    - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  contact_name text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clients IS 'Client management table - stores customer information for quotes and invoices';
COMMENT ON COLUMN clients.user_id IS 'User who owns this client record';
COMMENT ON COLUMN clients.name IS 'Client name or company name (required)';
