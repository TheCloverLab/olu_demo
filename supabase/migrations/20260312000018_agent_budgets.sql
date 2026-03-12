-- ============================================================================
-- AGENT BUDGETS — Budget approval, tracking, and transaction ledger
-- ============================================================================

-- Budget requests linked to agent tasks
CREATE TABLE agent_budgets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES workspace_agent_tasks(id) ON DELETE SET NULL,
  agent_id        UUID NOT NULL REFERENCES workspace_agents(id) ON DELETE CASCADE,
  thread_id       TEXT,
  requested_amount NUMERIC(18,2) NOT NULL,
  approved_amount  NUMERIC(18,2),
  spent_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'in_progress', 'paused', 'completed', 'cancelled')),
  description     TEXT,
  breakdown       JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_budgets_workspace ON agent_budgets(workspace_id);
CREATE INDEX idx_agent_budgets_agent ON agent_budgets(agent_id);
CREATE INDEX idx_agent_budgets_status ON agent_budgets(status);

-- Transaction ledger for audit trail
CREATE TABLE budget_transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id   UUID NOT NULL REFERENCES agent_budgets(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('allocation', 'spend', 'refund', 'pause')),
  amount      NUMERIC(18,2) NOT NULL,
  description TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_budget_transactions_budget ON budget_transactions(budget_id);

-- Add locked_amount to workspace_wallets (funds allocated to active budgets)
ALTER TABLE workspace_wallets
  ADD COLUMN IF NOT EXISTS locked_amount NUMERIC(18,2) NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE agent_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can manage budgets"
  ON agent_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN users u ON u.id = w.owner_user_id
      WHERE w.id = agent_budgets.workspace_id
        AND u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can view transactions"
  ON budget_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_budgets ab
      JOIN workspaces w ON w.id = ab.workspace_id
      JOIN users u ON u.id = w.owner_user_id
      WHERE ab.id = budget_transactions.budget_id
        AND u.auth_id = auth.uid()
    )
  );
