-- Add layout column to workspace_home_configs
ALTER TABLE workspace_home_configs
  ADD COLUMN IF NOT EXISTS layout text DEFAULT 'classic';
