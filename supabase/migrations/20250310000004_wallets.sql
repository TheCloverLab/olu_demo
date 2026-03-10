-- ============================================================================
-- WALLETS — User wallets (consumer) + Workspace wallets (business)
-- ============================================================================

-- User wallet (consumer side — personal funds)
CREATE TABLE user_wallets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  usdc_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  token_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
  ON user_wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_wallets.user_id
      AND u.auth_id = auth.uid()
    )
  );

-- Workspace wallet (business side — operational funds)
CREATE TABLE workspace_wallets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  usdc_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  token_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  pending_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workspace_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read wallet"
  ON workspace_wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = workspace_wallets.workspace_id
      AND u.auth_id = auth.uid()
    )
  );
