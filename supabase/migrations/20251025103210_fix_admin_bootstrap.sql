/*
  # Fix Admin Bootstrap - Allow First Super Admin

  ## Problem
  Current RLS policies prevent creating the first admin user because they require
  being a super admin to insert into admin_users table (chicken and egg problem).

  ## Solution
  Add a special policy that allows ANY authenticated user to insert themselves as
  super_admin ONLY if NO super admins exist yet (bootstrap scenario).

  ## Changes
  1. Drop the restrictive INSERT policy
  2. Create a new policy that allows:
     - Super admins to insert (normal case)
     - ANY authenticated user to insert if no super admins exist (bootstrap case)

  ## Security
  - Once a super admin exists, only super admins can create new admins
  - Regular users cannot promote themselves after bootstrap
  - The bootstrap window closes automatically after first super admin
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Only super admins can modify admin users" ON admin_users;

-- Create separate policies for different operations

-- SELECT: Admins can view other admins (keep existing)
-- (Already exists: "Admins can view other admins")

-- INSERT: Allow bootstrap + super admin management
CREATE POLICY "Allow first super admin or super admin inserts"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Case 1: Bootstrap - no super admins exist yet
    (NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin'))
    OR
    -- Case 2: Already a super admin
    is_super_admin()
  );

-- UPDATE: Only super admins can update
CREATE POLICY "Only super admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- DELETE: Only super admins can delete
CREATE POLICY "Only super admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_super_admin());
