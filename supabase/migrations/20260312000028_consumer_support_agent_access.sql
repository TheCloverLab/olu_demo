-- Allow any authenticated user to read support-enabled agents (needed for consumer support chat)
CREATE POLICY "Anyone can view support agents"
  ON workspace_agents
  FOR SELECT
  USING (support_enabled = true);

-- Allow any authenticated user to read ai_support_enabled (needed for consumer support chat)
CREATE POLICY "Anyone can read support config"
  ON workspace_home_configs
  FOR SELECT
  USING (auth.role() = 'authenticated');
