/*
  # Fix ownership/search_path gaps found in Phase 0 security audit

  1. Problem
    - `set_active_estimate(p_estimate_id, p_project_id)` is SECURITY DEFINER and
      bypasses RLS entirely, but never verifies that the calling user owns
      `p_project_id` before flipping `is_active` on its estimates. Any
      authenticated user who can guess/obtain a project_id + estimate_id pair
      could activate/deactivate another user's quote versions.
    - `is_admin(uuid)` is SECURITY DEFINER but, unlike its sibling
      `is_super_admin(uuid)` (fixed in
      20260207122753_fix_admin_users_rls_recursion_v3.sql), was never given a
      pinned `search_path`. A mutable search_path on a SECURITY DEFINER
      function is a known Postgres/Supabase hardening gap (a malicious
      search_path could shadow `admin_users` with an attacker-controlled
      relation in some configurations).

  2. Solution
    - Recreate `set_active_estimate` to raise an exception unless the caller
      owns the project (`projects.user_id = auth.uid()`), same ownership
      model already used everywhere else in the schema.
    - Recreate `is_admin` with `SET search_path = public`, matching
      `is_super_admin`.

  3. Notes
    - No current frontend/edge-function code calls `set_active_estimate`
      (the quote-regeneration UI that would have used it is unwired), so this
      tightens the RPC before anything depends on it, rather than fixing a
      live regression.
*/

CREATE OR REPLACE FUNCTION set_active_estimate(p_estimate_id uuid, p_project_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_scenario text;
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM projects WHERE id = p_project_id;

  IF v_owner IS NULL OR v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify estimates for this project';
  END IF;

  SELECT scenario_type INTO v_scenario FROM estimates WHERE id = p_estimate_id AND project_id = p_project_id;

  IF v_scenario IS NULL THEN
    RAISE EXCEPTION 'Estimate % does not belong to project %', p_estimate_id, p_project_id;
  END IF;

  UPDATE estimates
  SET is_active = false
  WHERE project_id = p_project_id
    AND scenario_type = v_scenario
    AND id != p_estimate_id;

  UPDATE estimates
  SET is_active = true
  WHERE id = p_estimate_id;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$;
