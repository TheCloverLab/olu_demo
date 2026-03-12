-- Repair: add support_enabled to workspace_agents (migration 20260312000019 was applied but column missing)
ALTER TABLE workspace_agents
  ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT FALSE;
