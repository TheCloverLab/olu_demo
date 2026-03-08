ALTER TABLE business_campaigns
  DROP CONSTRAINT IF EXISTS business_campaigns_agent_id_fkey;

ALTER TABLE business_campaigns
  ADD CONSTRAINT business_campaigns_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES workspace_agents(id) ON DELETE SET NULL;

ALTER TABLE business_campaign_targets
  DROP CONSTRAINT IF EXISTS business_campaign_targets_creator_agent_id_fkey;

ALTER TABLE business_campaign_targets
  ADD CONSTRAINT business_campaign_targets_creator_agent_id_fkey
  FOREIGN KEY (creator_agent_id) REFERENCES workspace_agents(id) ON DELETE SET NULL;
