-- Enable Supabase Realtime for workspace_agent_tasks
-- so TaskCenter can receive live updates when agents create/update tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'workspace_agent_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workspace_agent_tasks;
  END IF;
END $$;
