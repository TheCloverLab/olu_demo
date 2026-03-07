-- ============================================================================
-- BUSINESS CAMPAIGN LIFECYCLE EXTENSIONS
-- ============================================================================

ALTER TABLE business_campaigns
  ADD COLUMN reported_reach INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reported_conversions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE business_campaign_targets
  ADD COLUMN published_at TIMESTAMPTZ,
  ADD COLUMN reported_views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reported_clicks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reported_conversions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE business_campaigns
  DROP CONSTRAINT business_campaigns_status_check;

ALTER TABLE business_campaigns
  ADD CONSTRAINT business_campaigns_status_check
  CHECK (status IN ('draft', 'sourcing', 'offer_sent', 'creator_review', 'approved', 'scheduled', 'published', 'reporting', 'completed', 'cancelled'));

ALTER TABLE business_campaign_targets
  DROP CONSTRAINT business_campaign_targets_stage_check;

ALTER TABLE business_campaign_targets
  ADD CONSTRAINT business_campaign_targets_stage_check
  CHECK (stage IN ('shortlisted', 'offer_sent', 'creator_review', 'approved', 'scheduled', 'published', 'reported', 'rejected'));

ALTER TABLE business_campaign_targets
  DROP CONSTRAINT business_campaign_targets_deliverable_status_check;

ALTER TABLE business_campaign_targets
  ADD CONSTRAINT business_campaign_targets_deliverable_status_check
  CHECK (deliverable_status IN ('waiting', 'uploaded', 'approved', 'published', 'reported'));
