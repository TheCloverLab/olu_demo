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

const DEMO_EXPERIENCES: WorkspaceExperience[] = [
  { id: 'exp-1', workspace_id: 'ws-demo', type: 'forum', name: 'General Discussion', icon: null, cover: null, config_json: {}, position: 0, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-2', workspace_id: 'ws-demo', type: 'course', name: 'Digital Art Masterclass', icon: null, cover: '/images/covers/dragonart.jpg', config_json: {}, position: 1, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-3', workspace_id: 'ws-demo', type: 'group_chat', name: 'VIP Lounge', icon: null, cover: null, config_json: {}, position: 2, visibility: 'members_only', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-4', workspace_id: 'ws-demo', type: 'forum', name: 'Fan Art Showcase', icon: null, cover: '/images/covers/lunachen.jpg', config_json: {}, position: 3, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
  { id: 'exp-5', workspace_id: 'ws-demo', type: 'support_chat', name: 'Help Center', icon: null, cover: null, config_json: {}, position: 4, visibility: 'public', status: 'active', created_at: '', updated_at: '' },
]

const DEMO_FORUM_POSTS: ForumPostWithAuthor[] = [
  { id: 'fp-1', experience_id: 'exp-1', author_id: 'demo-user-001', content: 'Just dropped my latest pixel art collection — 20 unique pieces inspired by cyberpunk Tokyo. Check them out!', images: [], like_count: 42, comment_count: 5, created_at: '2026-03-10T10:00:00Z', updated_at: '', author: { id: 'demo-user-001', name: 'Demo Creator', handle: '@demo_creator', avatar_img: undefined, avatar_color: 'from-violet-500 to-fuchsia-500', initials: 'DC' } },
  { id: 'fp-2', experience_id: 'exp-1', author_id: 'u2', content: 'Love the new collection! The neon reflections on the rain-soaked streets are incredible. Any plans for prints?', images: [], like_count: 18, comment_count: 2, created_at: '2026-03-09T15:30:00Z', updated_at: '', author: { id: 'u2', name: 'Alex Park', handle: '@alexpark', avatar_img: undefined, avatar_color: 'from-pink-500 to-rose-600', initials: 'AP' } },
  { id: 'fp-3', experience_id: 'exp-1', author_id: 'u3', content: 'Tutorial request: How do you achieve that glitch effect on your latest pieces? Would love a behind-the-scenes breakdown.', images: [], like_count: 31, comment_count: 8, created_at: '2026-03-08T09:15:00Z', updated_at: '', author: { id: 'u3', name: 'Jordan Lee', handle: '@jordanlee', avatar_img: undefined, avatar_color: 'from-blue-500 to-blue-700', initials: 'JL' } },
]

const DEMO_COMMENTS: (ForumPostComment & { author?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'> })[] = [
  { id: 'fc-1', post_id: 'fp-1', author_id: 'u2', content: 'These are amazing! My favorite is the rooftop scene.', created_at: '2026-03-10T11:00:00Z', author: { id: 'u2', name: 'Alex Park', handle: '@alexpark', avatar_img: undefined, avatar_color: 'from-pink-500 to-rose-600', initials: 'AP' } },
  { id: 'fc-2', post_id: 'fp-1', author_id: 'u3', content: 'The color palette is next level!', created_at: '2026-03-10T12:30:00Z', author: { id: 'u3', name: 'Jordan Lee', handle: '@jordanlee', avatar_img: undefined, avatar_color: 'from-blue-500 to-blue-700', initials: 'JL' } },
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
