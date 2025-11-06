/*
  # Add categories column to estimates table

  1. Changes
    - Add `categories` column to `estimates` table (JSONB, default empty array)
    - This column will store structured category data with items grouped by category
  
  2. Purpose
    - Support the new categorized estimate format from the generate-estimate edge function
    - Allow better organization of estimate line items by category
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'categories'
  ) THEN
    ALTER TABLE estimates ADD COLUMN categories jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
