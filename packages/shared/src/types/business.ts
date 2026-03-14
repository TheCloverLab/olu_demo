import type { Tables } from './database'
import type { User } from './user'

import type { Narrow } from './helpers'

export type IPLicense = Narrow<Tables<'ip_licenses'>, {
  status: 'pending' | 'approved' | 'rejected' | 'negotiating'
}>

export type IPInfringement = Narrow<Tables<'ip_infringements'>, {
  status: 'pending' | 'in_progress' | 'resolved'
}>

export type AnalyticsRevenue = Tables<'analytics_revenue'>

export type AnalyticsViews = Tables<'analytics_views'>

export type Campaign = Narrow<Tables<'campaigns'>, {
  status: 'draft' | 'active' | 'paused' | 'completed'
}>

export type SupplierProduct = Tables<'supplier_products'>

// Extend with optional join field from queries
export type SupplierCreatorPartnership = Narrow<Tables<'supplier_creator_partnerships'>, {
  status: 'active' | 'pending' | 'paused' | 'inactive' | null
}> & {
  creator?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'>
}

export type BusinessCampaign = Narrow<Tables<'business_campaigns'>, {
  status: 'draft' | 'sourcing' | 'offer_sent' | 'creator_review' | 'approved' | 'scheduled' | 'published' | 'reporting' | 'completed' | 'cancelled'
}>

// Extend with optional join field from queries
export type BusinessCampaignTarget = Narrow<Tables<'business_campaign_targets'>, {
  stage: 'shortlisted' | 'offer_sent' | 'creator_review' | 'approved' | 'scheduled' | 'published' | 'reported' | 'rejected'
  deliverable_status: 'waiting' | 'uploaded' | 'approved' | 'published' | 'reported'
}> & {
  creator?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'>
}

export type BusinessCampaignEvent = Narrow<Tables<'business_campaign_events'>, {
  actor_type: 'advertiser' | 'creator' | 'agent' | 'system'
}>

export type BusinessCampaignWorkflow = {
  campaign: BusinessCampaign
  targets: BusinessCampaignTarget[]
  events: BusinessCampaignEvent[]
}
