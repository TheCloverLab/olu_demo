-- ============================================================================
-- WORKSPACE_EMPLOYEES
-- Human team members for each workspace (the "human" half of the HR model).
-- ============================================================================

CREATE TABLE workspace_employees (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  position    TEXT NOT NULL,
  description TEXT,
  avatar_img  TEXT,
  color       TEXT DEFAULT 'from-gray-600 to-gray-500',
  status      TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','busy')),
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','paused','offboarded')),
  email       TEXT,
  skills      TEXT[] DEFAULT '{}',
  salary_label TEXT,
  hired_at    TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by workspace
CREATE INDEX idx_workspace_employees_workspace ON workspace_employees(workspace_id);

-- RLS
ALTER TABLE workspace_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workspace employees"
  ON workspace_employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_employees.workspace_id
      AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage workspace employees"
  ON workspace_employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_employees.workspace_id
      AND wm.membership_role = 'owner'
      AND u.auth_id = auth.uid()
    )
  );
