-- =========================================================================
-- Fix: infinite recursion in team_members RLS policies
--
-- The original add-team-roles.sql defined 4 super-admin policies that all
-- do `EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND
-- role = 'super_admin')`. Postgres evaluates that subquery under RLS, which
-- triggers the same policy again → infinite recursion:
--
--   ERROR: 42P17 — infinite recursion detected in policy for relation
--   "team_members"
--
-- Fix: move the super-admin check into a SECURITY DEFINER function that
-- runs with the function owner's privileges (bypassing RLS on the inner
-- SELECT). Policies call the function instead of embedding the subquery.
-- =========================================================================

-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Super admins can read all team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Super admins can delete team members" ON team_members;

-- 2. SECURITY DEFINER helper — bypasses RLS on its inner SELECT
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 3. Re-create the super-admin policies using the helper (no recursion)
CREATE POLICY "Super admins can read all team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admins can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- Verify: this should return your role without ERROR 42P17
-- SELECT role FROM team_members WHERE user_id = auth.uid();
