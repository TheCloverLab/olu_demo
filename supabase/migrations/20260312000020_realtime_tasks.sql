-- Enable Supabase Realtime for workspace_agent_tasks
-- so TaskCenter can receive live updates when agents create/update tasks
alter publication supabase_realtime add table workspace_agent_tasks;
