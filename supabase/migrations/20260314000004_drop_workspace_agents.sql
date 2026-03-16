-- Drop workspace_agents and related tables
-- These are replaced by the specialist_templates + specialist_installs system

-- Drop dependent tables first (FK references)
drop table if exists agent_scheduled_jobs cascade;
drop table if exists budget_transactions cascade;
drop table if exists agent_budgets cascade;
drop table if exists workspace_agent_tasks cascade;

-- Drop the main table
drop table if exists workspace_agents cascade;

-- Drop the old agent_templates table (replaced by specialist_templates)
drop table if exists agent_templates cascade;
