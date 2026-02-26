/*
  # Align api_usage_logs schema for unified logging

  1. Modified Tables
    - `api_usage_logs`
      - Add `provider` (text) - AI provider name (openrouter, anthropic, openai)
      - Add `project_id` (uuid, nullable) - FK to projects table
      - Add `model_id` (uuid, nullable) - FK to ai_models table
      - Update status CHECK constraint to include 'rate_limited'
      - Add index on provider column
      - Add index on project_id column

  2. Security
    - Add admin SELECT policy on api_usage_logs (admins can view all logs)
    - Inserts are handled via service_role from edge functions

  3. Important Notes
    - The generate-estimate function currently logs to `usage_logs` with zeroed tokens.
      After this migration, it will log to `api_usage_logs` with real data.
    - The llm-proxy function tries to insert provider/project_id which didn't exist before.
    - This migration adds those columns so both functions write to the same table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage_logs' AND column_name = 'provider'
  ) THEN
    ALTER TABLE api_usage_logs ADD COLUMN provider text DEFAULT 'openrouter';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage_logs' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE api_usage_logs ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage_logs' AND column_name = 'model_id'
  ) THEN
    ALTER TABLE api_usage_logs ADD COLUMN model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE api_usage_logs DROP CONSTRAINT IF EXISTS api_usage_logs_status_check;
ALTER TABLE api_usage_logs ADD CONSTRAINT api_usage_logs_status_check
  CHECK (status = ANY (ARRAY['success', 'error', 'timeout', 'rate_limited']));

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_project_id ON api_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_model_id ON api_usage_logs(model_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_usage_logs' AND policyname = 'Admins can view all usage logs'
  ) THEN
    CREATE POLICY "Admins can view all usage logs"
      ON api_usage_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
        )
      );
  END IF;
END $$;
