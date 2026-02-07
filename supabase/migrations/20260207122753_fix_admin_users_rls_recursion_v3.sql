/*
  # Fix RLS recursion on admin_users table

  1. Problem
    - The `is_super_admin()` function queries `admin_users` table
    - The INSERT policy on `admin_users` calls `is_super_admin()`
    - This creates infinite recursion

  2. Solution
    - Drop all dependent policies first
    - Recreate `is_super_admin()` function with SECURITY DEFINER
    - Recreate all policies

  3. Security
    - SECURITY DEFINER is safe here because the function only returns a boolean
*/

DROP POLICY IF EXISTS "Allow first super admin or super admin inserts" ON admin_users;
DROP POLICY IF EXISTS "Only super admins can update admins" ON admin_users;
DROP POLICY IF EXISTS "Only super admins can delete admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can view other admins" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage system config" ON system_config;

DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS is_super_admin();

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
$$;

CREATE POLICY "Allow first super admin or super admin inserts"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin'))
    OR is_super_admin()
  );

CREATE POLICY "Only super admins can update admins"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Only super admins can delete admins"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Admins can view other admins"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_super_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage system config" ON system_config;
CREATE POLICY "Super admins can manage system config"
  ON system_config
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());