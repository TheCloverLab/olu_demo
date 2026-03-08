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

export type BusinessModuleKey = 'creator_ops' | 'marketing' | 'supply_chain'

export type Workspace = {
  id: string
  owner_user_id: string
  name: string
  slug: string
  status: 'active' | 'paused' | 'archived'
  created_at?: string
  updated_at?: string
}

export type WorkspaceMembership = {
  id: string
  workspace_id: string
  user_id: string
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
  status: 'active' | 'invited' | 'disabled'
  created_at?: string
  updated_at?: string
}

export type WorkspaceModule = {
  id: string
  workspace_id: string
  module_key: BusinessModuleKey
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export type WorkspacePermission = {
  id: string
  workspace_id: string
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
  resource: string
  action: string
  allowed: boolean
  created_at?: string
  updated_at?: string
}

export type WorkspaceIntegration = {
  id: string
  workspace_id: string
  provider: string
  status: 'connected' | 'disconnected' | 'planned' | 'error'
  config_json: Record<string, any>
  last_sync_at?: string | null
  created_at?: string
  updated_at?: string
}

export type WorkspacePolicy = {
  id: string
  workspace_id: string
  approval_policy: Record<string, any>
  sandbox_policy: Record<string, any>
  notification_policy: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type WorkspaceBilling = {
  id: string
  workspace_id: string
  plan: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled'
  billing_email?: string | null
  created_at?: string
  updated_at?: string
}

export type WorkspaceConsumerConfig = {
  id: string
  workspace_id: string
  template_key: 'fan_community' | 'sell_courses'
  config_json: {
    featured_template?: 'fan_community' | 'sell_courses'
    featured_creator_id?: string | null
    featured_course_slug?: string | null
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
}

export type WorkspaceSettingsData = {
  workspace: Workspace
  membership: WorkspaceMembership
  modules: WorkspaceModule[]
  permissions: WorkspacePermission[]
  integrations: WorkspaceIntegration[]
  policies: WorkspacePolicy | null
  billing: WorkspaceBilling | null
  consumerConfig: WorkspaceConsumerConfig | null
}

export type AgentTemplate = {
  id: string
  template_key: string
  name: string
  role: string
  avatar_img?: string | null
  color?: string | null
  category: 'Creator' | 'Advertiser' | 'Supplier' | 'Pro'
  pricing_model: string
  price_label: string
  model: string
  cost_per_1k: number
  rating: number
  reviews: number
  description: string
  status: 'active' | 'retired'
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgent = {
  id: string
  workspace_id: string
  template_id?: string | null
  hired_by_user_id?: string | null
  agent_key: string
  name: string
  role: string
  avatar_img?: string | null
  color?: string | null
  status: 'online' | 'offline' | 'busy'
  description?: string | null
  last_message?: string | null
  last_time?: string | null
  hired_at?: string
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgentTask = {
  id: string
  workspace_agent_id: string
  task_key: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due?: string | null
  progress: number
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgentWithTasks = WorkspaceAgent & {
  tasks?: WorkspaceAgentTask[]
}

export type ConsumerCourse = {
  id: string
  creator_id: string
  slug: string
  title: string
  subtitle: string
  instructor: string
  price: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  hero: string
  headline: string
  description: string
  outcomes: string[]
  lessons_count: number
  students_count: number
  completion_rate: string
  status: 'draft' | 'published' | 'archived'
  created_at?: string
  updated_at?: string
}

export type ConsumerCourseSection = {
  id: string
  course_id: string
  section_key: string
  title: string
  duration: string
  summary: string
  preview: boolean
  position: number
  created_at?: string
  updated_at?: string
}
