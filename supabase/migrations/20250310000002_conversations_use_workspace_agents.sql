-- ============================================================================
-- CONVERSATIONS → WORKSPACE_AGENTS
-- Repoint conversations.agent_id FK from ai_agents to workspace_agents
-- so seeded agent chat messages can reference workspace agents directly.
-- ============================================================================

-- Drop old FK constraint
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;

-- Add new FK to workspace_agents
ALTER TABLE conversations
  ADD CONSTRAINT conversations_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES workspace_agents(id) ON DELETE CASCADE;

-- Drop old RLS policies that reference ai_agents
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;

-- New RLS policies using workspace_agents → workspaces → workspace_memberships
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_agents wa
      JOIN workspace_memberships wm ON wm.workspace_id = wa.workspace_id
      JOIN users u ON u.id = wm.user_id
      WHERE wa.id = conversations.agent_id
      AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_agents wa
      JOIN workspace_memberships wm ON wm.workspace_id = wa.workspace_id
      JOIN users u ON u.id = wm.user_id
      WHERE wa.id = conversations.agent_id
      AND u.auth_id = auth.uid()
    )
  );
