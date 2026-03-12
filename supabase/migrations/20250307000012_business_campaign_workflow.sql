-- ============================================================================
-- BUSINESS CAMPAIGN WORKFLOW TABLES
-- ============================================================================

CREATE TABLE business_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  objective TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL DEFAULT 0,
  budget_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sourcing', 'offer_sent', 'creator_review', 'approved', 'scheduled', 'completed', 'cancelled')),
  target_creator_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES business_campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'shortlisted' CHECK (stage IN ('shortlisted', 'offer_sent', 'creator_review', 'approved', 'scheduled', 'rejected')),
  offer_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deliverable_type TEXT NOT NULL DEFAULT 'ai_video',
  deliverable_status TEXT NOT NULL DEFAULT 'waiting' CHECK (deliverable_status IN ('waiting', 'uploaded', 'approved', 'published')),
  marketer_message TEXT,
  creator_message TEXT,
  creator_reward DECIMAL(10,2) NOT NULL DEFAULT 0,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

CREATE TABLE business_campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES business_campaigns(id) ON DELETE CASCADE,
  target_id UUID REFERENCES business_campaign_targets(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('advertiser', 'creator', 'agent', 'system')),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_campaigns_advertiser ON business_campaigns(advertiser_id, updated_at DESC);
CREATE INDEX idx_business_campaign_targets_creator ON business_campaign_targets(creator_id, updated_at DESC);
CREATE INDEX idx_business_campaign_events_campaign ON business_campaign_events(campaign_id, created_at DESC);

ALTER TABLE business_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_campaign_events ENABLE ROW LEVEL SECURITY;

-- Advertiser owners can fully manage their own campaigns.
CREATE POLICY "Advertisers can manage own business campaigns"
  ON business_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = business_campaigns.advertiser_id
      AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = business_campaigns.advertiser_id
      AND users.auth_id = auth.uid()
    )
  );

-- Advertiser owners and target creators can read campaign targets.
CREATE POLICY "Advertisers and creators can view campaign targets"
  ON business_campaign_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM business_campaigns
      JOIN users advertiser ON advertiser.id = business_campaigns.advertiser_id
      WHERE business_campaigns.id = business_campaign_targets.campaign_id
      AND advertiser.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = business_campaign_targets.creator_id
      AND users.auth_id = auth.uid()
    )
  );

-- Advertiser owners can insert/update/delete campaign targets.
CREATE POLICY "Advertisers can manage campaign targets"
  ON business_campaign_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM business_campaigns
      JOIN users advertiser ON advertiser.id = business_campaigns.advertiser_id
      WHERE business_campaigns.id = business_campaign_targets.campaign_id
      AND advertiser.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_campaigns
      JOIN users advertiser ON advertiser.id = business_campaigns.advertiser_id
      WHERE business_campaigns.id = business_campaign_targets.campaign_id
      AND advertiser.auth_id = auth.uid()
    )
  );

-- Target creators can update their own offer status fields.
CREATE POLICY "Creators can update assigned campaign targets"
  ON business_campaign_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = business_campaign_targets.creator_id
      AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = business_campaign_targets.creator_id
      AND users.auth_id = auth.uid()
    )
  );

-- Related users can view events.
CREATE POLICY "Advertisers and creators can view campaign events"
  ON business_campaign_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM business_campaigns
      JOIN users advertiser ON advertiser.id = business_campaigns.advertiser_id
      WHERE business_campaigns.id = business_campaign_events.campaign_id
      AND advertiser.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM business_campaign_targets
      JOIN users creator ON creator.id = business_campaign_targets.creator_id
      WHERE business_campaign_targets.id = business_campaign_events.target_id
      AND creator.auth_id = auth.uid()
    )
  );

-- Advertisers and assigned creators can insert events.
CREATE POLICY "Advertisers and creators can insert campaign events"
  ON business_campaign_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_campaigns
      JOIN users advertiser ON advertiser.id = business_campaigns.advertiser_id
      WHERE business_campaigns.id = business_campaign_events.campaign_id
      AND advertiser.auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM business_campaign_targets
      JOIN users creator ON creator.id = business_campaign_targets.creator_id
      WHERE business_campaign_targets.id = business_campaign_events.target_id
      AND creator.auth_id = auth.uid()
    )
  );
