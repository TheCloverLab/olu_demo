import { supabase } from '../lib/supabase'
import type {
  User,
  Post,
  AIAgent,
  AgentTask,
  Conversation,
  Product,
  Fan,
  IPLicense,
  IPInfringement,
  AnalyticsRevenue,
  AnalyticsViews,
  Campaign,
  MembershipTier,
  ConsumerCourse,
  ConsumerCourseSection,
  ConsumerCoursePurchase,
  ConsumerLessonProgress,
  ConsumerMembership,
} from '../lib/supabase'
export {
  advanceBusinessCampaign,
  approveBusinessCampaignTarget,
  getLatestBusinessCampaignForAdvertiser,
  getLatestBusinessCampaignForCreator,
  rejectBusinessCampaignTarget,
  startBusinessCampaignDemo,
} from '../domain/campaign/api'
export {
  getMyRoleApplications,
  submitRoleApplication,
} from '../domain/workspace/api'

// ============================================================================
// USERS
// ============================================================================
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as User[]
}

export async function getUserByHandle(handle: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle)
    .single()
  
  if (error) throw error
  return data as User
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as User
}

export async function getCreators() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'creator')
    .order('followers', { ascending: false })
  
  if (error) throw error
  return data as User[]
}

// ============================================================================
// POSTS
// ============================================================================
export async function getPosts(limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      creator:users!posts_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials,
        verified
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

export async function getPostsByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Post[]
}

export async function updatePost(
  postId: string,
  updates: Partial<Pick<Post, 'title' | 'preview' | 'locked'>>
) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select('*')
    .single()

  if (error) throw error
  return data as Post
}

export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      creator:users!posts_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials,
        verified
      )
    `)
    .eq('id', postId)
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// AI AGENTS
// ============================================================================
export async function getAgentsByUser(userId: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as AIAgent[]
}

export async function getAgentsWithTasks(userId: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select(`
      *,
      tasks:agent_tasks (
        id,
        title,
        status,
        priority,
        due,
        progress
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as (AIAgent & { tasks?: AgentTask[] })[]
}

export async function getAgentTasks(agentId: string) {
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as AgentTask[]
}

export async function getConversations(agentId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as Conversation[]
}

export async function getGroupChatsByUser(userId: string) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getGroupChatMessages(groupChatId: string) {
  const { data, error } = await supabase
    .from('group_chat_messages')
    .select('*')
    .eq('group_chat_id', groupChatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addGroupChatMessage(groupChatId: string, fromName: string, text: string, avatar?: string) {
  const { data, error } = await supabase
    .from('group_chat_messages')
    .insert({
      group_chat_id: groupChatId,
      from_name: fromName,
      avatar: avatar ?? null,
      text,
      time: 'Just now',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSocialChatsByUser(userId: string) {
  const { data, error } = await supabase
    .from('social_chats')
    .select(`
      *,
      with_user:users!social_chats_with_user_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSocialChatMessages(socialChatId: string) {
  const { data, error } = await supabase
    .from('social_chat_messages')
    .select('*')
    .eq('social_chat_id', socialChatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function ensureSocialChat(userId: string, withUserId: string) {
  const { data: existingRows, error: existingError } = await supabase
    .from('social_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('with_user_id', withUserId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (existingError) throw existingError
  if (existingRows && existingRows.length > 0) return existingRows[0]

  const { data: created, error: createError } = await supabase
    .from('social_chats')
    .insert({
      user_id: userId,
      with_user_id: withUserId,
      last_message: 'Say hi 👋',
      last_time: 'Now',
      unread: 0,
    })
    .select('*')
    .single()

  if (createError) throw createError

  const { error: introError } = await supabase.from('social_chat_messages').insert({
    social_chat_id: created.id,
    from_type: 'other',
    text: 'Hey, thanks for reaching out. I usually reply within a few hours.',
    time: 'Just now',
  })

  if (introError) {
    console.error('Failed to seed intro message', introError)
  }

  return created
}

export async function addSocialChatMessage(socialChatId: string, fromType: 'user' | 'other', text: string, time = 'Just now') {
  const { data, error } = await supabase
    .from('social_chat_messages')
    .insert({
      social_chat_id: socialChatId,
      from_type: fromType,
      text,
      time,
    })
    .select('*')
    .single()

  if (error) throw error

  const { error: updateError } = await supabase
    .from('social_chats')
    .update({
      last_message: text,
      last_time: time,
      unread: 0,
    })
    .eq('id', socialChatId)

  if (updateError) throw updateError
  return data
}

export async function addConversationMessage(agentId: string, fromType: 'agent' | 'user', text: string, time: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ agent_id: agentId, from_type: fromType, text, time })
    .select()
    .single()
  
  if (error) throw error
  return data as Conversation
}

// ============================================================================
// PRODUCTS
// ============================================================================
export async function getProductsByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Product[]
}

// ============================================================================
// CONSUMER COURSES
// ============================================================================
export async function getConsumerCourses() {
  const { data, error } = await supabase
    .from('consumer_courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ConsumerCourse[]
}

export async function getConsumerCourseBySlug(slug: string) {
  const { data, error } = await supabase
    .from('consumer_courses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  return data as ConsumerCourse | null
}

export async function getConsumerCourseSections(courseId: string) {
  const { data, error } = await supabase
    .from('consumer_course_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true })

  if (error) throw error
  return data as ConsumerCourseSection[]
}

export async function updateConsumerCourse(
  courseId: string,
  updates: Partial<Pick<ConsumerCourse, 'title' | 'subtitle' | 'headline' | 'description'>>
) {
  const { data, error } = await supabase
    .from('consumer_courses')
    .update(updates)
    .eq('id', courseId)
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCourse
}

export async function updateConsumerCourseSection(
  sectionId: string,
  updates: Partial<Pick<ConsumerCourseSection, 'title' | 'summary' | 'preview'>>
) {
  const { data, error } = await supabase
    .from('consumer_course_sections')
    .update(updates)
    .eq('id', sectionId)
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCourseSection
}

export async function getConsumerMembership(userId: string, creatorId: string) {
  const { data, error } = await supabase
    .from('consumer_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('creator_id', creatorId)
    .maybeSingle()

  if (error) throw error
  return data as ConsumerMembership | null
}

export async function upsertConsumerMembership(
  userId: string,
  creatorId: string,
  tierKey: string,
  tierName: string
) {
  const { data, error } = await supabase
    .from('consumer_memberships')
    .upsert({
      user_id: userId,
      creator_id: creatorId,
      tier_key: tierKey,
      tier_name: tierName,
      status: 'active',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'user_id,creator_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerMembership
}

export async function getConsumerCoursePurchase(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('consumer_course_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) throw error
  return data as ConsumerCoursePurchase | null
}

export async function getConsumerCoursePurchases(userId: string) {
  const { data, error } = await supabase
    .from('consumer_course_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'purchased')
    .order('purchased_at', { ascending: false })

  if (error) throw error
  return data as ConsumerCoursePurchase[]
}

export async function createConsumerCoursePurchase(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('consumer_course_purchases')
    .upsert({
      user_id: userId,
      course_id: courseId,
      status: 'purchased',
      purchased_at: new Date().toISOString(),
    }, { onConflict: 'user_id,course_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCoursePurchase
}

export async function getConsumerLessonProgress(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('consumer_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ConsumerLessonProgress[]
}

export async function upsertConsumerLessonProgress(
  userId: string,
  courseId: string,
  sectionKey: string,
  completed: boolean
) {
  const { data, error } = await supabase
    .from('consumer_lesson_progress')
    .upsert({
      user_id: userId,
      course_id: courseId,
      section_key: sectionKey,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,course_id,section_key' })
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerLessonProgress
}

// ============================================================================
// FANS / CRM
// ============================================================================
export async function getFansByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('fans')
    .select('*')
    .eq('creator_id', creatorId)
    .order('total_spend', { ascending: false })
  
  if (error) throw error
  return data as Fan[]
}

// ============================================================================
// IP MANAGEMENT
// ============================================================================
export async function getIPLicensesByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('ip_licenses')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data as IPLicense[]
}

export async function getIPInfringementsByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('ip_infringements')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data as IPInfringement[]
}

// ============================================================================
// ANALYTICS
// ============================================================================
export async function getRevenueAnalytics(userId: string) {
  const { data, error } = await supabase
    .from('analytics_revenue')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as AnalyticsRevenue[]
}

export async function getViewsAnalytics(userId: string) {
  const { data, error } = await supabase
    .from('analytics_views')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as AnalyticsViews[]
}

// ============================================================================
// CAMPAIGNS (Advertiser)
// ============================================================================
export async function getCampaignsByAdvertiser(advertiserId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Campaign[]
}

export async function getSupplierProductsBySupplier(supplierId: string) {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('revenue_month', { ascending: false })

  if (error) throw error
  return data
}

export async function getSupplierPartnershipsBySupplier(supplierId: string) {
  const { data, error } = await supabase
    .from('supplier_creator_partnerships')
    .select(`
      *,
      creator:users!supplier_creator_partnerships_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('supplier_id', supplierId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// MEMBERSHIP TIERS
// ============================================================================
export async function getMembershipTiersByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('creator_id', creatorId)
    .order('price', { ascending: true })
  
  if (error) throw error
  return data as MembershipTier[]
}

export async function updateMembershipTier(
  tierId: string,
  updates: Partial<Pick<MembershipTier, 'name' | 'price' | 'description' | 'perks'>>
) {
  const { data, error } = await supabase
    .from('membership_tiers')
    .update(updates)
    .eq('id', tierId)
    .select('*')
    .single()

  if (error) throw error
  return data as MembershipTier
}
