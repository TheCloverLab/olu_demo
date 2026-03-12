-- Add model config to workspace_home_configs (for support AI default model)
ALTER TABLE workspace_home_configs
  ADD COLUMN IF NOT EXISTS ai_support_model TEXT DEFAULT NULL;

-- Add model config to workspace_agents (per-agent model override)
ALTER TABLE workspace_agents
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT NULL;
