/*
  # Add View Restriction System

  1. New Table
    - `user_view_restrictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `view_mode` (text) - 'full', 'detailed-settings-only', 'api-info-only', 'complete-settings-only'
      - `allowed_routes` (text[]) - Array of allowed route paths
      - `redirect_route` (text) - Default route to redirect to
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_view_restrictions` table
    - Add policies for users to manage their own restrictions
    - Add index on user_id for faster lookups

  3. Purpose
    - Allow users to restrict their view to specific pages only
    - Automatically redirect users to allowed pages
    - Persist preferences across sessions
*/

-- Create the view restrictions table
CREATE TABLE IF NOT EXISTS user_view_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  view_mode text NOT NULL CHECK (view_mode IN ('full', 'detailed-settings-only', 'api-info-only', 'complete-settings-only')),
  allowed_routes text[] NOT NULL DEFAULT ARRAY[]::text[],
  redirect_route text NOT NULL DEFAULT '/dashboard',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_view_restrictions_user_id ON user_view_restrictions(user_id);

-- Enable Row Level Security
ALTER TABLE user_view_restrictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own restrictions
CREATE POLICY "Users can view own view restrictions"
  ON user_view_restrictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own restrictions
CREATE POLICY "Users can insert own view restrictions"
  ON user_view_restrictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own restrictions
CREATE POLICY "Users can update own view restrictions"
  ON user_view_restrictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own restrictions
CREATE POLICY "Users can delete own view restrictions"
  ON user_view_restrictions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_view_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_view_restrictions_updated_at_trigger
  BEFORE UPDATE ON user_view_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_view_restrictions_updated_at();

-- Add helpful comment
COMMENT ON TABLE user_view_restrictions IS 'Stores user preferences for view restrictions - allows users to limit their interface to specific pages only';