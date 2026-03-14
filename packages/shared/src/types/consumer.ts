import type { Tables, Json } from './database'
import type { WorkspaceConsumerConfig } from './workspace'

import type { Narrow } from './helpers'

export type Post = Narrow<Tables<'posts'>, {
  type: 'image' | 'video' | 'music' | 'text'
}>

export type Product = Narrow<Tables<'products'>, {
  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock'
}>

export type Fan = Narrow<Tables<'fans'>, {
  tier: 'free' | 'creator_club' | 'vip'
  status: 'active' | 'new' | 'churned'
}>

export type MembershipTier = Tables<'membership_tiers'>

export type ConsumerAppType = 'community' | 'academy' | 'consulting'
export type ConsumerAppVisibility = 'public' | 'private'
export type ConsumerAppStatus = 'draft' | 'published' | 'archived'

/** No backing DB table — assembled in app code */
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
  config_json?: Record<string, Json | undefined> | null
}

export type ConsumerCourse = Narrow<Tables<'consumer_courses'>, {
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  status: 'draft' | 'published' | 'archived'
}>

export type ConsumerCourseSection = Tables<'consumer_course_sections'>

export type ConsumerMembership = Narrow<Tables<'consumer_memberships'>, {
  status: 'active' | 'cancelled'
}>

export type ConsumerCoursePurchase = Narrow<Tables<'consumer_course_purchases'>, {
  status: 'purchased' | 'refunded'
}>

export type ConsumerLessonProgress = Tables<'consumer_lesson_progress'>

export type ConsumerPurchase = Narrow<Tables<'consumer_purchases'>, {
  status: 'active' | 'cancelled' | 'expired' | 'refunded'
}>

// --- Creator Theme & Layout Customization ---

export type CreatorThemePreset = 'default' | 'neon' | 'pastel' | 'minimal' | 'bold' | 'earth'

export type CreatorTheme = {
  preset: CreatorThemePreset
  accentColor: string
  bgStyle: 'solid' | 'gradient' | 'image'
  bgValue: string
  cardRadius: 'sm' | 'md' | 'lg' | 'xl'
  fontStyle: 'modern' | 'serif' | 'mono'
}

export type CreatorLayoutSection =
  | 'hero'
  | 'feed'
  | 'topics'
  | 'gallery'
  | 'courses'
  | 'membership'
  | 'shop'
  | 'about'

export type CreatorTabConfig = {
  key: string
  label: string
  visible: boolean
  order: number
}

export type CreatorCustomization = {
  theme: CreatorTheme
  sections: CreatorLayoutSection[]
  tabs: CreatorTabConfig[]
  heroStyle: 'fullscreen' | 'card' | 'minimal' | 'video'
  logo?: string
  tagline?: string
}

// --- Comment System ---

export type PostComment = {
  id: string
  post_id: string
  user_id: string
  parent_id?: string | null
  text: string
  likes: number
  pinned: boolean
  created_at?: string
  updated_at?: string
  user?: {
    name: string
    handle?: string
    avatar_img?: string
    avatar_color?: string
    initials?: string
  }
  replies?: PostComment[]
}

// --- Gallery ---

export type GalleryAlbum = {
  id: string
  creator_id: string
  title: string
  description?: string
  cover_img?: string
  image_count: number
  created_at?: string
}

export type GalleryImage = {
  id: string
  album_id?: string
  creator_id: string
  url: string
  thumbnail?: string
  caption?: string
  tags: string[]
  likes: number
  created_at?: string
}

// --- Course Module (3-level structure) ---

export type CourseModule = {
  id: string
  course_id: string
  title: string
  description?: string
  position: number
  lessons_count: number
}

export type CourseLesson = {
  id: string
  module_id: string
  course_id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'assignment'
  duration: string
  preview: boolean
  summary: string
  video_url?: string
  position: number
}
