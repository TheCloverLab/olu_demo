-- Workspace Joins — tracks which workspaces a user has joined (Whop-style sidebar display)

CREATE TABLE IF NOT EXISTS workspace_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_joins_user ON workspace_joins(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_joins_workspace ON workspace_joins(workspace_id);

-- RLS
ALTER TABLE workspace_joins ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_joins_select ON workspace_joins FOR SELECT USING (true);
CREATE POLICY workspace_joins_insert ON workspace_joins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workspace_joins_delete ON workspace_joins FOR DELETE USING (auth.uid() = user_id);
