-- ============================================================================
-- WORKSPACE FOUNDATION
-- ============================================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_memberships (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL CHECK (membership_role IN ('owner', 'admin', 'operator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE workspace_modules (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL CHECK (module_key IN ('creator_ops', 'marketing', 'supply_chain')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, module_key)
);

CREATE TABLE workspace_permissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL CHECK (membership_role IN ('owner', 'admin', 'operator', 'viewer')),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, membership_role, resource, action)
);

CREATE TABLE workspace_integrations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('connected', 'disconnected', 'planned', 'error')),
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

CREATE TABLE workspace_policies (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  approval_policy JSONB NOT NULL DEFAULT '{"publish_requires_marketer_approval":true,"budget_change_review_threshold":500}'::jsonb,
  sandbox_policy JSONB NOT NULL DEFAULT '{"takeover_mode":"manual","high_risk_actions_require_review":true}'::jsonb,
  notification_policy JSONB NOT NULL DEFAULT '{"route_creator_approvals_to_workspace":true,"route_publish_events_to_workspace":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_billing (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled')),
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner_user_id ON workspaces(owner_user_id);
CREATE INDEX idx_workspace_memberships_user_id ON workspace_memberships(user_id);
CREATE INDEX idx_workspace_memberships_workspace_id ON workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_modules_workspace_id ON workspace_modules(workspace_id);
CREATE INDEX idx_workspace_permissions_workspace_id ON workspace_permissions(workspace_id);
CREATE INDEX idx_workspace_integrations_workspace_id ON workspace_integrations(workspace_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view workspaces"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspaces.id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = workspaces.owner_user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update workspaces"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = workspaces.owner_user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = workspaces.owner_user_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view memberships"
  ON workspace_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_memberships.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage memberships"
  ON workspace_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_memberships.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_memberships.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view modules"
  ON workspace_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_modules.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage modules"
  ON workspace_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_modules.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_modules.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view permissions"
  ON workspace_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_permissions.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage permissions"
  ON workspace_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_permissions.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_permissions.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view integrations"
  ON workspace_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_integrations.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage integrations"
  ON workspace_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_integrations.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_integrations.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view policies"
  ON workspace_policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_policies.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage policies"
  ON workspace_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_policies.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_policies.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view billing"
  ON workspace_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_billing.workspace_id
        AND wm.status = 'active'
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage billing"
  ON workspace_billing FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_billing.workspace_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = workspace_billing.workspace_id
        AND u.auth_id = auth.uid()
    )
  );
