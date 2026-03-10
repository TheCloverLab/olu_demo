-- ============================================================================
-- PUBLIC COMMUNITY DISCOVERY
-- Allow any authenticated user to discover public communities by reading
-- workspace owner IDs and consumer configs with template_key = 'fan_community'
-- ============================================================================

-- Allow any authenticated user to read workspace id + owner_user_id
-- (needed to map creator user IDs to their workspace for community lookup)
CREATE POLICY "Anyone can discover workspaces"
  ON workspaces FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to read consumer configs
-- (needed to check which workspaces have public communities)
CREATE POLICY "Anyone can discover community configs"
  ON workspace_consumer_configs FOR SELECT
  USING (auth.role() = 'authenticated');
