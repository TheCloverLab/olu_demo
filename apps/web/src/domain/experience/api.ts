import { supabase } from '../../lib/supabase'
import type {
  WorkspaceExperience,
  ExperienceType,
  ForumPost,
  ForumPostComment,
  User,
} from '../../lib/supabase'

// ── Batch Insert (onboarding presets) ───────────────────────────

export async function insertPresetExperiences(
  experiences: Array<{
    workspace_id: string
    name: string
    type: string
    description?: string
    position: number
    status: string
    visibility: string
  }>
): Promise<void> {
  if (experiences.length === 0) return
  const { error } = await supabase
    .from('workspace_experiences')
    .insert(experiences)
  if (error) throw error
}

// ── Experience CRUD ─────────────────────────────────────────────

export async function listExperiences(workspaceId: string): Promise<WorkspaceExperience[]> {
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

  // Get all product-experience mappings for this workspace
  const { data: allMappings } = await supabase
    .from('workspace_product_experiences')
    .select('experience_id, product_id')

  const expProductMap = new Map<string, string[]>()
  for (const m of allMappings || []) {
    const arr = expProductMap.get(m.experience_id) || []
    arr.push(m.product_id)
    expProductMap.set(m.experience_id, arr)
  }

  // Get user's active purchases
  const { data: purchases } = await supabase
    .from('consumer_purchases')
    .select('product_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  const purchasedProductIds = new Set((purchases || []).map((p) => p.product_id))

  return all.filter((exp) => {
    const linkedProducts = expProductMap.get(exp.id)
    if (!linkedProducts || linkedProducts.length === 0) return true // no linked products = free
    return linkedProducts.some((pid) => purchasedProductIds.has(pid)) // bought any linked product
  })
}

export async function canAccessExperience(
  userId: string,
  experienceId: string
): Promise<boolean> {
  const exp = await getExperience(experienceId)
  if (!exp) return false

  // Check if this experience is linked to any products
  const { data: mappings } = await supabase
    .from('workspace_product_experiences')
    .select('product_id')
    .eq('experience_id', experienceId)

  // No linked products = free for all joined members
  if (!mappings?.length) return true

  // Has linked products = check if user purchased any of them
  const { data: purchases } = await supabase
    .from('consumer_purchases')
    .select('product_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('product_id', mappings.map((m) => m.product_id))

  return (purchases?.length ?? 0) > 0
}

// ── Forum ───────────────────────────────────────────────────────

export type ForumPostWithAuthor = ForumPost & { author?: Pick<User, 'id' | 'name' | 'handle' | 'avatar_img' | 'avatar_color' | 'initials'> }

export async function getForumPosts(experienceId: string): Promise<ForumPostWithAuthor[]> {
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

// ---------- Experience video ----------

import type { ExperienceVideoItem } from '../../lib/supabase'

export async function getVideoItems(experienceId: string): Promise<ExperienceVideoItem[]> {
  const { data, error } = await supabase
    .from('experience_video_items')
    .select('*')
    .eq('experience_id', experienceId)
    .order('position')
  if (error) throw error
  return data || []
}

export async function addVideoItem(
  experienceId: string,
  title: string,
  videoUrl: string,
  authorId?: string,
  description?: string,
): Promise<ExperienceVideoItem> {
  const { data: maxPos } = await supabase
    .from('experience_video_items')
    .select('position')
    .eq('experience_id', experienceId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position ?? -1) + 1
  const thumbnailUrl = extractYouTubeThumbnail(videoUrl)

  const { data, error } = await supabase
    .from('experience_video_items')
    .insert({ experience_id: experienceId, title, video_url: videoUrl, thumbnail_url: thumbnailUrl, description, position, author_id: authorId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVideoItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('experience_video_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  return match ? match[1] : null
}

function extractYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
