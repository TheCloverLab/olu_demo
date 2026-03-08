-- ============================================================================
-- FIX WORKSPACE MEMBERSHIP SELECT POLICY RECURSION
-- ============================================================================

DROP POLICY IF EXISTS "Workspace members can view memberships" ON workspace_memberships;

CREATE POLICY "Workspace members can view memberships"
  ON workspace_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = workspace_memberships.user_id
        AND u.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_memberships.workspace_id
        AND u.auth_id = auth.uid()
    )
  );
