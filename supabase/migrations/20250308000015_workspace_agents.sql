-- ============================================================================
-- WORKSPACE AGENTS
-- ============================================================================

CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_img TEXT,
  color TEXT,
  category TEXT NOT NULL CHECK (category IN ('Creator', 'Advertiser', 'Supplier', 'Pro')),
  pricing_model TEXT NOT NULL,
  price_label TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_per_1k DECIMAL(10,4) NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_agents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL,
  hired_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_key TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_img TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy')),
  description TEXT,
  last_message TEXT,
  last_time TEXT,
  hired_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_agent_tasks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_agent_id UUID NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_agent_id, task_key)
);

CREATE INDEX idx_workspace_agents_workspace_id ON workspace_agents(workspace_id);
CREATE INDEX idx_workspace_agents_template_id ON workspace_agents(template_id);
CREATE INDEX idx_workspace_agent_tasks_agent_id ON workspace_agent_tasks(workspace_agent_id);

ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent templates are viewable by authenticated users"
  ON agent_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workspace members can view workspace agents"
  ON workspace_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_agents.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage workspace agents"
  ON workspace_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_agents.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_agents.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view workspace agent tasks"
  ON workspace_agent_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_agents wa
      JOIN workspace_memberships wm ON wm.workspace_id = wa.workspace_id
      JOIN users u ON u.id = wm.user_id
      WHERE wa.id = workspace_agent_tasks.workspace_agent_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage workspace agent tasks"
  ON workspace_agent_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_agents wa
      JOIN workspaces w ON w.id = wa.workspace_id
      JOIN users u ON u.id = w.owner_user_id
      WHERE wa.id = workspace_agent_tasks.workspace_agent_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_agents wa
      JOIN workspaces w ON w.id = wa.workspace_id
      JOIN users u ON u.id = w.owner_user_id
      WHERE wa.id = workspace_agent_tasks.workspace_agent_id
        AND u.auth_id = auth.uid()
    )
  );
