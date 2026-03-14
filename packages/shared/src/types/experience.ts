import type { Tables } from './database'

import type { Narrow } from './helpers'

// --- Experience & Product Model ---

export type ExperienceType = 'forum' | 'course' | 'group_chat' | 'video'

export type ExperienceVisibility = 'public' | 'product_gated'

export type WorkspaceExperience = Narrow<Tables<'workspace_experiences'>, {
  type: ExperienceType
  visibility: ExperienceVisibility
  status: 'active' | 'archived'
}>

export type WorkspaceProduct = Narrow<Tables<'workspace_products'>, {
  access_type: 'free' | 'paid'
  status: 'active' | 'archived'
}>

export type WorkspaceProductPlan = Narrow<Tables<'workspace_product_plans'>, {
  billing_type: 'one_time' | 'recurring'
  status: 'active' | 'archived'
}>

export type WorkspaceProductExperience = Tables<'workspace_product_experiences'>

// --- Forum ---

export type ForumPost = Tables<'forum_posts'>

export type ForumPostComment = Tables<'forum_post_comments'>

export type ForumPostLike = Tables<'forum_post_likes'>

// --- Experience Video Items ---

export type ExperienceVideoItem = Tables<'experience_video_items'>

// --- Experience Course Hierarchy ---

export type ExperienceCourse = Narrow<Tables<'experience_courses'>, {
  status: 'draft' | 'published' | 'archived'
}>

export type ExperienceCourseChapter = Tables<'experience_course_chapters'>

// Override attachments JSON column with app-specific shape
export type ExperienceCourseLesson = Narrow<Tables<'experience_course_lessons'>, {
  attachments: { name: string; url: string; size?: number }[] | null
}>

// --- Workspace Home ---

export type WorkspaceHomeTab = {
  key: string
  label: string
  experience_ids: string[]
  display_mode: 'list' | 'tile' | 'grid' | 'featured' | 'inline'
  position: number
}

export type WorkspaceHomeLayout = 'classic' | 'hero' | 'compact' | 'catalog'

// Override tabs and layout JSON columns with app-specific shapes
export type WorkspaceHomeConfig = Narrow<Tables<'workspace_home_configs'>, {
  tabs: WorkspaceHomeTab[]
  layout: WorkspaceHomeLayout | null
}>
