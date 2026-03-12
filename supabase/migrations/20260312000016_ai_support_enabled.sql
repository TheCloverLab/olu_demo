ALTER TABLE workspace_home_configs
  ADD COLUMN IF NOT EXISTS ai_support_enabled boolean DEFAULT false;
