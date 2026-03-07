import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (generated from schema)
export type User = {
  id: string
  auth_id?: string
  username: string
  handle: string
  email: string
  role: 'creator' | 'fan' | 'advertiser' | 'supplier'
  roles?: ('creator' | 'fan' | 'advertiser' | 'supplier')[]
  name: string
  bio?: string
  avatar_img?: string
  cover_img?: string
  avatar_color?: string
  initials?: string
  followers: number
  following: number
  posts: number
  verified: boolean
  onboarding_completed?: boolean
  social_links?: Record<string, string>
  created_at?: string
  updated_at?: string
}

export type Post = {
  id: string
  creator_id: string
  type: 'image' | 'video' | 'music' | 'text'
  title: string
  preview?: string
  cover_img?: string
  gradient_bg?: string
  emoji?: string
  likes: number
  comments: number
  tips: number
  locked: boolean
  lock_price?: number
  allow_fan_creation: boolean
  fan_creation_fee?: number
  sponsored: boolean
  sponsored_by?: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

export type AIAgent = {
  id: string
  user_id: string
  agent_key: string
  name: string
  role: string
  icon?: string
  avatar_img?: string
  color?: string
  status: 'online' | 'offline' | 'busy'
  description?: string
  last_message?: string
  last_time?: string
  created_at?: string
  updated_at?: string
}

export type AgentTask = {
  id: string
  agent_id: string
  task_key: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due?: string
  progress: number
  created_at?: string
  updated_at?: string
}

export type Conversation = {
  id: string
  agent_id: string
  from_type: 'agent' | 'user'
  text: string
  time: string
  created_at?: string
}

export type Product = {
  id: string
  creator_id: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock: number
  sold_count: number
  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock'
  created_at?: string
  updated_at?: string
}

export type Fan = {
  id: string
  user_id?: string
  creator_id: string
  name: string
  handle: string
  tier: 'free' | 'creator_club' | 'vip'
  joined_date: string
  total_spend: number
  status: 'active' | 'new' | 'churned'
  color?: string
  initials?: string
  last_seen?: string
  avatar_img?: string
  created_at?: string
  updated_at?: string
}

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

export type MembershipTier = {
  id: string
  creator_id: string
  tier_key: string
  name: string
  price: number
  description?: string
  perks: string[]
  subscriber_count: number
  created_at?: string
  updated_at?: string
}

export type RoleApplication = {
  id: string
  user_id: string
  target_role: 'creator' | 'advertiser' | 'supplier'
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  review_note?: string
  created_at?: string
  updated_at?: string
}
