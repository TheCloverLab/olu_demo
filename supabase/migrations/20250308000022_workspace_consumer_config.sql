-- ============================================================================
-- WORKSPACE CONSUMER CONFIG
-- ============================================================================

CREATE TABLE workspace_consumer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL CHECK (template_key IN ('fan_community', 'sell_courses')),
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_consumer_configs_workspace_id ON workspace_consumer_configs(workspace_id);

ALTER TABLE workspace_consumer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view consumer config"
  ON workspace_consumer_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_consumer_configs.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage consumer config"
  ON workspace_consumer_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_consumer_configs.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_consumer_configs.workspace_id
        AND u.auth_id = auth.uid()
    )
  );
