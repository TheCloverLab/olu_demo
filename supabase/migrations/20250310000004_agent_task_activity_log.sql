-- Agent task activity log — tracks all agent actions on tasks
-- Used for audit trail and the Activity feed in the Business OS

CREATE TABLE IF NOT EXISTS workspace_agent_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workspace_agent_tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'started', 'completed', 'message', 'error')),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_logs_task ON workspace_agent_task_logs(task_id);
CREATE INDEX idx_task_logs_agent ON workspace_agent_task_logs(agent_id);
CREATE INDEX idx_task_logs_created ON workspace_agent_task_logs(created_at DESC);

-- RLS: workspace members can read logs
ALTER TABLE workspace_agent_task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view task logs"
  ON workspace_agent_task_logs
  FOR SELECT
  USING (
    agent_id IN (
      SELECT wa.id FROM workspace_agents wa
      JOIN workspace_memberships wm ON wm.workspace_id = wa.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Service role can insert (agent-runtime uses service role)
CREATE POLICY "Service role can insert task logs"
  ON workspace_agent_task_logs
  FOR INSERT
  WITH CHECK (true);
