-- Add model config to workspace_agents (per-agent model override)
ALTER TABLE workspace_agents
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT NULL;

-- Add support_enabled flag to workspace_agents
-- Any agent can be assigned to handle consumer support
ALTER TABLE workspace_agents
  ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT FALSE;

-- Keep ai_support_model on workspace_home_configs for backward compat
ALTER TABLE workspace_home_configs
  ADD COLUMN IF NOT EXISTS ai_support_model TEXT DEFAULT NULL;
