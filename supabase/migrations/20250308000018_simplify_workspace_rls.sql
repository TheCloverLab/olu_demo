-- ============================================================================
-- SIMPLIFY WORKSPACE RLS TO OWNER-BASED ACCESS FOR MVP
-- ============================================================================

DROP POLICY IF EXISTS "Workspace members can view workspaces" ON workspaces;
CREATE POLICY "Workspace owners can view workspaces"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = workspaces.owner_user_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view modules" ON workspace_modules;
CREATE POLICY "Workspace owners can view modules"
  ON workspace_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_modules.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view permissions" ON workspace_permissions;
CREATE POLICY "Workspace owners can view permissions"
  ON workspace_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_permissions.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view integrations" ON workspace_integrations;
CREATE POLICY "Workspace owners can view integrations"
  ON workspace_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_integrations.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view policies" ON workspace_policies;
CREATE POLICY "Workspace owners can view policies"
  ON workspace_policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_policies.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view billing" ON workspace_billing;
CREATE POLICY "Workspace owners can view billing"
  ON workspace_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_billing.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view workspace agents" ON workspace_agents;
CREATE POLICY "Workspace owners can view workspace agents"
  ON workspace_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_agents.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can view workspace agent tasks" ON workspace_agent_tasks;
CREATE POLICY "Workspace owners can view workspace agent tasks"
  ON workspace_agent_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_agents wa
      JOIN workspaces w ON w.id = wa.workspace_id
      JOIN users u ON u.id = w.owner_user_id
      WHERE wa.id = workspace_agent_tasks.workspace_agent_id
        AND u.auth_id = auth.uid()
    )
  );
