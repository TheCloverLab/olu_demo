-- Fix workspace_joins RLS: user_id references users.id, not auth.uid()
-- Must use the same pattern as forum_posts and other tables

DROP POLICY IF EXISTS workspace_joins_insert ON workspace_joins;
DROP POLICY IF EXISTS workspace_joins_delete ON workspace_joins;

CREATE POLICY workspace_joins_insert ON workspace_joins FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY workspace_joins_update ON workspace_joins FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY workspace_joins_delete ON workspace_joins FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
