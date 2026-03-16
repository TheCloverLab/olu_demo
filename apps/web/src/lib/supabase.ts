import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export all types from @olu/shared — single source of truth
export type {
  // user
  User, UserWallet,
  // agent
  // workspace
  BusinessModuleKey, Workspace, WorkspaceMembership, WorkspaceModule,
  WorkspacePermission, WorkspaceIntegration, WorkspacePolicy, WorkspaceBilling,
  WorkspaceConsumerConfig, WorkspaceSettingsData, WorkspaceEmployee,
  WorkspaceWallet, WorkspaceJoin,
  // consumer
  Post, Product, Fan, MembershipTier,
  ConsumerAppType, ConsumerAppVisibility, ConsumerAppStatus, ConsumerApp,
  ConsumerCourse, ConsumerCourseSection, ConsumerMembership,
  ConsumerCoursePurchase, ConsumerLessonProgress, ConsumerPurchase,
  // business
  IPLicense, IPInfringement, AnalyticsRevenue, AnalyticsViews, Campaign,
  SupplierProduct, SupplierCreatorPartnership,
  BusinessCampaign, BusinessCampaignTarget, BusinessCampaignEvent, BusinessCampaignWorkflow,
  // experience
  ExperienceType, ExperienceVisibility, WorkspaceExperience,
  WorkspaceProduct, WorkspaceProductPlan, WorkspaceProductExperience,
  ForumPost, ForumPostComment, ForumPostLike,
  ExperienceVideoItem, ExperienceCourse, ExperienceCourseChapter, ExperienceCourseLesson,
  WorkspaceHomeTab, WorkspaceHomeLayout, WorkspaceHomeConfig,
} from '@olu/shared'
