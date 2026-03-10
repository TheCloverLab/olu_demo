import type { User } from './user'

export type IPLicense = {
  id: string
  creator_id: string
  requester: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'negotiating'
  fee_type?: 'flat' | 'royalty' | 'performance' | 'free'
  amount?: string
  approved_by?: string
  date: string
  created_at?: string
  updated_at?: string
}

export type IPInfringement = {
  id: string
  creator_id: string
  platform: string
  offender: string
  content: string
  status: 'pending' | 'in_progress' | 'resolved'
  action?: string
  result?: string
  date: string
  created_at?: string
  updated_at?: string
}

export type AnalyticsRevenue = {
  id: string
  user_id: string
  month: string
  subscriptions: number
  tips: number
  shop: number
  ip: number
  created_at?: string
}

export type AnalyticsViews = {
  id: string
  user_id: string
  month: string
  tiktok: number
  youtube: number
  instagram: number
  created_at?: string
}

export type Campaign = {
  id: string
  advertiser_id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  start_date: string
  end_date: string
  agent_key?: string
  reach: number
  target_reach: number
  conversions: number
  target_conversions: number
  created_at?: string
  updated_at?: string
}

export type SupplierProduct = {
  id: string
  supplier_id: string
  sku?: string
  name: string
  price: number
  revenue_month?: number
  sold_month?: number
  created_at?: string
  updated_at?: string
}

export type SupplierCreatorPartnership = {
  id: string
  supplier_id: string
  creator_id: string
  status: 'active' | 'pending' | 'paused' | 'inactive'
  channel_manager?: string | null
  products_count?: number
  ip_approved?: boolean
  monthly_sales?: number
  created_at?: string
  updated_at?: string
  creator?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'>
}

export type BusinessCampaign = {
  id: string
  advertiser_id: string
  agent_id?: string
  name: string
  brand_name: string
  objective: string
  budget: number
  budget_spent: number
  status: 'draft' | 'sourcing' | 'offer_sent' | 'creator_review' | 'approved' | 'scheduled' | 'published' | 'reporting' | 'completed' | 'cancelled'
  target_creator_count: number
  reported_reach: number
  reported_conversions: number
  created_at?: string
  updated_at?: string
}

export type BusinessCampaignTarget = {
  id: string
  campaign_id: string
  creator_id: string
  creator_agent_id?: string
  stage: 'shortlisted' | 'offer_sent' | 'creator_review' | 'approved' | 'scheduled' | 'published' | 'reported' | 'rejected'
  offer_amount: number
  deliverable_type: string
  deliverable_status: 'waiting' | 'uploaded' | 'approved' | 'published' | 'reported'
  marketer_message?: string
  creator_message?: string
  creator_reward: number
  published_at?: string
  reported_views: number
  reported_clicks: number
  reported_conversions: number
  responded_at?: string
  created_at?: string
  updated_at?: string
  creator?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'>
}

export type BusinessCampaignEvent = {
  id: string
  campaign_id: string
  target_id?: string
  actor_type: 'advertiser' | 'creator' | 'agent' | 'system'
  actor_user_id?: string
  title: string
  detail?: string
  created_at?: string
}

export type BusinessCampaignWorkflow = {
  campaign: BusinessCampaign
  targets: BusinessCampaignTarget[]
  events: BusinessCampaignEvent[]
}
