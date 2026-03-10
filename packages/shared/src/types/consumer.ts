import type { WorkspaceConsumerConfig } from './workspace'

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

export type ConsumerAppType = 'community' | 'academy'
export type ConsumerAppVisibility = 'public' | 'private'
export type ConsumerAppStatus = 'draft' | 'published' | 'archived'

export type ConsumerApp = {
  id: string
  owner_user_id: string
  app_type: ConsumerAppType
  title: string
  slug: string
  summary?: string | null
  status: ConsumerAppStatus
  visibility: ConsumerAppVisibility
  source: 'workspace_config' | 'course'
  template_key?: WorkspaceConsumerConfig['template_key'] | null
  linked_course_id?: string | null
  linked_course_slug?: string | null
  cover_img?: string | null
  config_json?: Record<string, any> | null
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

export type ConsumerMembership = {
  id: string
  user_id: string
  creator_id: string
  tier_key: string
  tier_name: string
  status: 'active' | 'cancelled'
  joined_at?: string
  created_at?: string
  updated_at?: string
}

export type ConsumerCoursePurchase = {
  id: string
  user_id: string
  course_id: string
  status: 'purchased' | 'refunded'
  purchased_at?: string
  created_at?: string
  updated_at?: string
}

export type ConsumerLessonProgress = {
  id: string
  user_id: string
  course_id: string
  section_key: string
  completed: boolean
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}
