import { supabase } from '../../lib/supabase'
import type {
  ConsumerCourse,
  ConsumerCourseSection,
  ConsumerCoursePurchase,
  ConsumerLessonProgress,
  ConsumerMembership,
  Fan,
  MembershipTier,
  Post,
  Product,
} from '../../lib/supabase'

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

export async function createPost(
  creatorId: string,
  input: Pick<Post, 'title'> & Partial<Pick<Post, 'preview' | 'locked' | 'type'>>
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      creator_id: creatorId,
      type: input.type || 'text',
      title: input.title,
      preview: input.preview || '',
      likes: 0,
      comments: 0,
      tips: 0,
      locked: input.locked ?? false,
      allow_fan_creation: true,
      sponsored: false,
      tags: [],
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Post
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

export async function getConsumerCoursesForDiscover(options: { query?: string; page?: number; pageSize?: number } = {}) {
  const page = options.page ?? 0
  const pageSize = options.pageSize ?? 6
  const from = page * pageSize
  const to = from + pageSize - 1
  const pattern = (options.query || '').trim().replaceAll(',', ' ').replaceAll('%', '').replaceAll('*', '')

  let request = supabase
    .from('consumer_courses')
    .select('*')
    .eq('status', 'published')
    .order('students_count', { ascending: false })
    .range(from, to)

  if (pattern) {
    request = request.or(`title.ilike.%${pattern}%,subtitle.ilike.%${pattern}%,instructor.ilike.%${pattern}%,headline.ilike.%${pattern}%,description.ilike.%${pattern}%`)
  }

  const { data, error } = await request
  if (error) throw error
  return data as ConsumerCourse[]
}

export async function createConsumerCourse(
  input: Pick<ConsumerCourse, 'creator_id' | 'slug' | 'title' | 'subtitle' | 'instructor' | 'price' | 'level' | 'hero' | 'headline' | 'description'> &
    Partial<Pick<ConsumerCourse, 'outcomes' | 'lessons_count' | 'students_count' | 'completion_rate' | 'status'>>
) {
  const { data, error } = await supabase
    .from('consumer_courses')
    .insert({
      ...input,
      outcomes: input.outcomes || [],
      lessons_count: input.lessons_count ?? 0,
      students_count: input.students_count ?? 0,
      completion_rate: input.completion_rate ?? '0%',
      status: input.status ?? 'published',
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCourse
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
  updates: Partial<Pick<ConsumerCourse, 'title' | 'subtitle' | 'headline' | 'description' | 'status'>>
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

export async function createConsumerCourseSection(
  input: Pick<ConsumerCourseSection, 'course_id' | 'section_key' | 'title' | 'duration' | 'summary' | 'preview' | 'position'>
) {
  const { data, error } = await supabase
    .from('consumer_course_sections')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCourseSection
}

export async function updateConsumerCourseSection(
  sectionId: string,
  updates: Partial<Pick<ConsumerCourseSection, 'title' | 'summary' | 'preview'>>
) {
  const { data, error } = await supabase
    .from('consumer_course_sections')
    .update(updates)
    .or(`id.eq.${sectionId},section_key.eq.${sectionId}`)
    .select('*')
    .single()

  if (error) throw error
  return data as ConsumerCourseSection
}

// ============================================================================
// MEMBERSHIP & ENGAGEMENT
// ============================================================================

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
    .or(`id.eq.${tierId},tier_key.eq.${tierId}`)
    .select('*')
    .single()

  if (error) throw error
  return data as MembershipTier
}

// ============================================================================
// Domain-level wrappers (used by consumer/api.ts)
// ============================================================================

export async function getPublishedConsumerCourses() {
  return await getConsumerCourses()
}

export async function getConsumerCourseDetail(slug: string) {
  return await getConsumerCourseBySlug(slug)
}

export async function getConsumerCourseDetailSections(courseId: string) {
  return await getConsumerCourseSections(courseId)
}

export async function getConsumerCoursesForFeed(query?: string, page?: number, pageSize?: number) {
  return await getConsumerCoursesForDiscover({ query, page, pageSize })
}

export async function getCommunityMembershipTiers(creatorId: string) {
  return await getMembershipTiersByCreator(creatorId)
}

export async function getCommunityFans(creatorId: string) {
  return await getFansByCreator(creatorId)
}

export async function getCommunityPosts(creatorId: string) {
  return await getPostsByCreator(creatorId)
}

export async function getCommunityProducts(creatorId: string) {
  return await getProductsByCreator(creatorId)
}

export async function getCommunityPostDetail(postId: string) {
  return await getPostById(postId)
}
