-- =========================================================================
-- The Leadership Federation — Team Members & Role-Based Access
-- Adds multi-user team management with role hierarchy
-- =========================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  name text not null,
  role text not null default 'viewer' check (role in ('super_admin', 'admin', 'manager', 'check_in_staff', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members (role);

-- RLS policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read their own role
CREATE POLICY "Team members can read own role"
  ON team_members FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins can read all team members
CREATE POLICY "Super admins can read all team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Super admins can insert new team members
CREATE POLICY "Super admins can insert team members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Super admins can update team members
CREATE POLICY "Super admins can update team members"
  ON team_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Super admins can delete team members
CREATE POLICY "Super admins can delete team members"
  ON team_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'super_admin')
  );
