-- Force PostgREST schema cache reload by touching the table comment
COMMENT ON TABLE workspace_agents IS 'Workspace AI agents and their configuration';
