import { supabase } from '../../lib/supabase'
import type {
  WorkspaceExperience,
  ExperienceType,
  ExperienceVisibility,
  ForumPost,
  ForumPostComment,
  User,
} from '../../lib/supabase'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_AUTHORS = {
  creator: { id: 'demo-user-001', name: 'Demo Creator', handle: '@demo_creator', avatar_img: undefined as string | undefined, avatar_color: 'from-violet-500 to-fuchsia-500', initials: 'DC' },
  alex: { id: 'u2', name: 'Alex Park', handle: '@alexpark', avatar_img: undefined as string | undefined, avatar_color: 'from-pink-500 to-rose-600', initials: 'AP' },
  jordan: { id: 'u3', name: 'Jordan Lee', handle: '@jordanlee', avatar_img: undefined as string | undefined, avatar_color: 'from-blue-500 to-blue-700', initials: 'JL' },
  mia: { id: 'u4', name: 'Mia Zhang', handle: '@miazhang', avatar_img: undefined as string | undefined, avatar_color: 'from-violet-500 to-purple-600', initials: 'MZ' },
  sofia: { id: 'u5', name: 'Sofia Martinez', handle: '@sofiamartinez', avatar_img: undefined as string | undefined, avatar_color: 'from-rose-500 to-pink-600', initials: 'SM' },
  emma: { id: 'u6', name: 'Emma Wilson', handle: '@emmawilson', avatar_img: undefined as string | undefined, avatar_color: 'from-sky-500 to-blue-600', initials: 'EW' },
  nina: { id: 'u7', name: 'Nina Patel', handle: '@ninapatel', avatar_img: undefined as string | undefined, avatar_color: 'from-yellow-500 to-amber-600', initials: 'NP' },
}

const DEMO_EXPERIENCES: WorkspaceExperience[] = [
  { id: 'exp-1', workspace_id: 'ws-demo', type: 'forum', name: 'General Discussion', icon: null, cover: null, config_json: {}, position: 0, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-2', workspace_id: 'ws-demo', type: 'course', name: 'Digital Art Masterclass', icon: null, cover: '/images/covers/dragonart.jpg', config_json: {}, position: 1, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-3', workspace_id: 'ws-demo', type: 'group_chat', name: 'VIP Lounge', icon: null, cover: null, config_json: {}, position: 2, visibility: 'members_only', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-4', workspace_id: 'ws-demo', type: 'forum', name: 'Fan Art Showcase', icon: null, cover: '/images/covers/lunachen.jpg', config_json: {}, position: 3, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-5', workspace_id: 'ws-demo', type: 'support_chat', name: 'Help Center', icon: null, cover: null, config_json: {}, position: 4, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-6', workspace_id: 'ws-demo', type: 'course', name: 'Animation Fundamentals', icon: null, cover: '/images/covers/gamingsetup.jpg', config_json: {}, position: 5, visibility: 'product_gated', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-7', workspace_id: 'ws-demo', type: 'forum', name: 'Feedback & Ideas', icon: null, cover: null, config_json: {}, position: 6, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
]

const DEMO_FORUM_POSTS: ForumPostWithAuthor[] = [
  // General Discussion (exp-1)
  { id: 'fp-1', experience_id: 'exp-1', author_id: 'demo-user-001', content: 'Just dropped my latest pixel art collection — 20 unique pieces inspired by cyberpunk Tokyo. Check them out! 🌃', images: [], like_count: 42, comment_count: 5, created_at: '2026-03-10T10:00:00Z', updated_at: '', author: DEMO_AUTHORS.creator },
  { id: 'fp-2', experience_id: 'exp-1', author_id: 'u2', content: 'Love the new collection! The neon reflections on the rain-soaked streets are incredible. Any plans for prints?', images: [], like_count: 18, comment_count: 2, created_at: '2026-03-09T15:30:00Z', updated_at: '', author: DEMO_AUTHORS.alex },
  { id: 'fp-3', experience_id: 'exp-1', author_id: 'u3', content: 'Tutorial request: How do you achieve that glitch effect on your latest pieces? Would love a behind-the-scenes breakdown.', images: [], like_count: 31, comment_count: 8, created_at: '2026-03-08T09:15:00Z', updated_at: '', author: DEMO_AUTHORS.jordan },
  { id: 'fp-4', experience_id: 'exp-1', author_id: 'u4', content: 'Anyone going to PixelCon next month? Would love to organize a meetup for this community!', images: [], like_count: 56, comment_count: 12, created_at: '2026-03-07T18:45:00Z', updated_at: '', author: DEMO_AUTHORS.mia },
  { id: 'fp-5', experience_id: 'exp-1', author_id: 'demo-user-001', content: 'Big announcement: I\'m launching a limited edition NFT series next week. First 50 community members get early access. Stay tuned! 🎨', images: [], like_count: 89, comment_count: 15, created_at: '2026-03-06T14:00:00Z', updated_at: '', author: DEMO_AUTHORS.creator },
  { id: 'fp-6', experience_id: 'exp-1', author_id: 'u5', content: 'Just finished the Digital Art Masterclass — the layering techniques completely changed my workflow. Highly recommend to anyone on the fence!', images: [], like_count: 24, comment_count: 3, created_at: '2026-03-05T11:20:00Z', updated_at: '', author: DEMO_AUTHORS.sofia },
  // Fan Art Showcase (exp-4)
  { id: 'fp-7', experience_id: 'exp-4', author_id: 'u4', content: 'My first attempt at the cyberpunk style from the masterclass. Feedback welcome! 🙏', images: [], like_count: 67, comment_count: 9, created_at: '2026-03-10T08:00:00Z', updated_at: '', author: DEMO_AUTHORS.mia },
  { id: 'fp-8', experience_id: 'exp-4', author_id: 'u6', content: 'Redrew my favorite character from Luna\'s Neon City series in watercolor style. Digital meets traditional!', images: [], like_count: 45, comment_count: 6, created_at: '2026-03-09T20:00:00Z', updated_at: '', author: DEMO_AUTHORS.emma },
  { id: 'fp-9', experience_id: 'exp-4', author_id: 'u3', content: 'Speed painting process video is up — 4 hours condensed into 2 minutes. Link in bio.', images: [], like_count: 33, comment_count: 4, created_at: '2026-03-08T16:30:00Z', updated_at: '', author: DEMO_AUTHORS.jordan },
  { id: 'fp-10', experience_id: 'exp-4', author_id: 'u7', content: 'Painted Luna\'s Midnight Dragon scene on a real canvas — acrylics on 24x36. Thinking about selling prints, would anyone be interested?', images: [], like_count: 78, comment_count: 11, created_at: '2026-03-07T12:15:00Z', updated_at: '', author: DEMO_AUTHORS.nina },
  // Feedback & Ideas (exp-7)
  { id: 'fp-11', experience_id: 'exp-7', author_id: 'u2', content: 'Feature request: It would be amazing to have a monthly art challenge with community voting. Could drive a lot of engagement!', images: [], like_count: 41, comment_count: 7, created_at: '2026-03-10T07:00:00Z', updated_at: '', author: DEMO_AUTHORS.alex },
  { id: 'fp-12', experience_id: 'exp-7', author_id: 'u5', content: 'The course platform is great but I\'d love offline downloads for the video lessons. Sometimes I study on the train with no signal.', images: [], like_count: 29, comment_count: 4, created_at: '2026-03-09T13:45:00Z', updated_at: '', author: DEMO_AUTHORS.sofia },
]

const DEMO_COMMENTS: (ForumPostComment & { author?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'> })[] = [
  { id: 'fc-1', post_id: 'fp-1', author_id: 'u2', content: 'These are amazing! My favorite is the rooftop scene.', created_at: '2026-03-10T11:00:00Z', author: DEMO_AUTHORS.alex },
  { id: 'fc-2', post_id: 'fp-1', author_id: 'u3', content: 'The color palette is next level!', created_at: '2026-03-10T12:30:00Z', author: DEMO_AUTHORS.jordan },
  { id: 'fc-3', post_id: 'fp-1', author_id: 'u4', content: 'Can we get a timelapse of your process? 🤩', created_at: '2026-03-10T14:00:00Z', author: DEMO_AUTHORS.mia },
  { id: 'fc-4', post_id: 'fp-3', author_id: 'demo-user-001', content: 'Great idea! I\'ll do a live stream breakdown this weekend. Stay tuned!', created_at: '2026-03-08T10:30:00Z', author: DEMO_AUTHORS.creator },
  { id: 'fc-5', post_id: 'fp-3', author_id: 'u5', content: 'Yes please! The glitch effect tutorial would be incredible.', created_at: '2026-03-08T11:15:00Z', author: DEMO_AUTHORS.sofia },
  { id: 'fc-6', post_id: 'fp-4', author_id: 'u6', content: 'I\'m in! Let me know the details.', created_at: '2026-03-07T19:30:00Z', author: DEMO_AUTHORS.emma },
  { id: 'fc-7', post_id: 'fp-7', author_id: 'demo-user-001', content: 'This is fantastic for a first attempt! Love the light reflections. Keep going! 🔥', created_at: '2026-03-10T09:00:00Z', author: DEMO_AUTHORS.creator },
  { id: 'fc-8', post_id: 'fp-7', author_id: 'u2', content: 'The composition is really strong. Try adding some volumetric fog for extra depth.', created_at: '2026-03-10T09:30:00Z', author: DEMO_AUTHORS.alex },
  { id: 'fc-9', post_id: 'fp-10', author_id: 'u2', content: 'I\'d buy a print in a heartbeat!', created_at: '2026-03-07T13:00:00Z', author: DEMO_AUTHORS.alex },
  { id: 'fc-10', post_id: 'fp-10', author_id: 'u4', content: 'The detail on the dragon scales is insane. What brushes did you use?', created_at: '2026-03-07T14:00:00Z', author: DEMO_AUTHORS.mia },
]

// ── Experience CRUD ─────────────────────────────────────────────

export async function listExperiences(workspaceId: string): Promise<WorkspaceExperience[]> {
  if (IS_DEMO) return DEMO_EXPERIENCES
  const { data, error } = await supabase
    .from('workspace_experiences')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('position')
  if (error) throw error
  return data || []
}

export async function getExperience(experienceId: string): Promise<WorkspaceExperience | null> {
  if (IS_DEMO) return DEMO_EXPERIENCES.find((e) => e.id === experienceId) || null
  const { data, error } = await supabase
    .from('workspace_experiences')
    .select('*')
    .eq('id', experienceId)
    .single()
  if (error) return null
  return data
}

export async function createExperience(
  workspaceId: string,
  type: ExperienceType,
  name: string,
  config?: Record<string, any>
): Promise<WorkspaceExperience> {
  const { data: maxPos } = await supabase
    .from('workspace_experiences')
    .select('position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('workspace_experiences')
    .insert({
      workspace_id: workspaceId,
      type,
      name,
      config_json: config || {},
      position,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExperience(
  experienceId: string,
  updates: Partial<Pick<WorkspaceExperience, 'name' | 'icon' | 'cover' | 'config_json' | 'position' | 'visibility' | 'status'>>
): Promise<WorkspaceExperience> {
  const { data, error } = await supabase
    .from('workspace_experiences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', experienceId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExperience(experienceId: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_experiences')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', experienceId)
  if (error) throw error
}

// ── Access Control ──────────────────────────────────────────────

export async function getAccessibleExperiences(
  userId: string,
  workspaceId: string
): Promise<WorkspaceExperience[]> {
  const all = await listExperiences(workspaceId)

  // Get user's active purchases for this workspace
  const { data: purchases } = await supabase
    .from('consumer_purchases')
    .select('product_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  const purchasedProductIds = new Set((purchases || []).map((p) => p.product_id))

  // Get product-experience mappings for purchased products
  let gatedExperienceIds = new Set<string>()
  if (purchasedProductIds.size > 0) {
    const { data: mappings } = await supabase
      .from('workspace_product_experiences')
      .select('experience_id')
      .in('product_id', Array.from(purchasedProductIds))
    gatedExperienceIds = new Set((mappings || []).map((m) => m.experience_id))
  }

  return all.filter((exp) => {
    if (exp.visibility === 'public') return true
    if (exp.visibility === 'members_only') return purchasedProductIds.size > 0
    if (exp.visibility === 'product_gated') return gatedExperienceIds.has(exp.id)
    return false
  })
}

export async function canAccessExperience(
  userId: string,
  experienceId: string
): Promise<boolean> {
  const exp = await getExperience(experienceId)
  if (!exp) return false
  if (exp.visibility === 'public') return true

  const { data: purchases } = await supabase
    .from('consumer_purchases')
    .select('product_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!purchases?.length) return false
  if (exp.visibility === 'members_only') return true

  // product_gated: check if any purchased product includes this experience
  const { data: mappings } = await supabase
    .from('workspace_product_experiences')
    .select('product_id')
    .eq('experience_id', experienceId)
    .in('product_id', purchases.map((p) => p.product_id))

  return (mappings?.length ?? 0) > 0
}

// ── Forum ───────────────────────────────────────────────────────

export type ForumPostWithAuthor = ForumPost & { author?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'> }

export async function getForumPosts(experienceId: string): Promise<ForumPostWithAuthor[]> {
  if (IS_DEMO) return DEMO_FORUM_POSTS.filter((p) => p.experience_id === experienceId)
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, author:users!author_id(id, name, handle, avatar_img, avatar_color, initials)')
    .eq('experience_id', experienceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createForumPost(
  experienceId: string,
  authorId: string,
  content: string,
  images?: string[]
): Promise<ForumPost> {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ experience_id: experienceId, author_id: authorId, content, images: images || [] })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getForumPostComments(postId: string): Promise<(ForumPostComment & { author?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'> })[]> {
  if (IS_DEMO) return DEMO_COMMENTS.filter((c) => c.post_id === postId)
  const { data, error } = await supabase
    .from('forum_post_comments')
    .select('*, author:users!author_id(id, name, handle, avatar_img, avatar_color, initials)')
    .eq('post_id', postId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function createForumPostComment(
  postId: string,
  authorId: string,
  content: string
): Promise<ForumPostComment> {
  const { data, error } = await supabase
    .from('forum_post_comments')
    .insert({ post_id: postId, author_id: authorId, content })
    .select()
    .single()
  if (error) throw error

  // Increment comment count
  await supabase.rpc('increment_forum_comment_count', { post_id_param: postId })

  return data
}

export async function toggleForumPostLike(
  postId: string,
  userId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('forum_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase
      .from('forum_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    await supabase.rpc('decrement_forum_like_count', { post_id_param: postId })
    return false
  } else {
    await supabase
      .from('forum_post_likes')
      .insert({ post_id: postId, user_id: userId })
    await supabase.rpc('increment_forum_like_count', { post_id_param: postId })
    return true
  }
}
