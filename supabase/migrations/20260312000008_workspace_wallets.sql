-- Add wallet balances for all workspaces
INSERT INTO workspace_wallets (workspace_id, usdc_balance)
VALUES
  -- Creator workspaces
  ('05000000-0000-0000-0000-000000000001', 12450.00),  -- Luna Chen
  ('05000000-0000-0000-0000-000000000002', 8920.00),   -- Kai Vibe
  ('05000000-0000-0000-0000-000000000003', 15300.00),  -- Zara Nova
  -- Advertiser workspaces
  ('05000000-0000-0000-0000-000000000004', 45200.00),  -- GameVerse
  ('05000000-0000-0000-0000-000000000005', 23100.00),  -- Marcus Chen
  -- Supplier workspaces
  ('05000000-0000-0000-0000-000000000006', 6750.00),   -- ArtisanCraft
  ('05000000-0000-0000-0000-000000000007', 3200.00),   -- Yuki Draws
  -- New creator workspaces
  ('05000000-0000-0000-0000-000000000008', 9800.00),   -- FitLife Academy
  ('05000000-0000-0000-0000-000000000009', 7300.00),   -- Lens Studio
  ('05000000-0000-0000-0000-000000000010', 18500.00),  -- CodeCraft Academy
  ('05000000-0000-0000-0000-000000000011', 5400.00)    -- Chef's Table
ON CONFLICT (workspace_id) DO UPDATE SET usdc_balance = EXCLUDED.usdc_balance;
