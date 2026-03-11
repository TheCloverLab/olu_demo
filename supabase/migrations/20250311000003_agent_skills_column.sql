-- Add enabled_skills column to workspace_agents for per-agent skill configuration.
-- NULL means all skills are enabled (backward compatible).
-- Array of skill IDs when configured, e.g. ['workspace-core', 'web', 'lark-suite']

alter table workspace_agents
  add column if not exists enabled_skills text[] default null;

comment on column workspace_agents.enabled_skills is
  'Array of enabled skill IDs. NULL = all skills enabled.';
