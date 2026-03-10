import { supabase } from '../../lib/supabase'
import type { User, Workspace, WorkspaceConsumerConfig } from '../../lib/supabase'

const CREATOR_COVER_IMG_FIXTURES: Record<string, string> = {
  '/images/covers/marcus.jpg': '/images/covers/marcuschen.jpg',
  '/images/covers/zara.jpg': '/images/covers/zaranova.jpg',
}

export function normalizeCreatorCoverImg<T extends { cover_img?: string | null }>(record: T): T {
  if (!record.cover_img) return record

  const normalized = CREATOR_COVER_IMG_FIXTURES[record.cover_img]
  if (!normalized) return record

  return {
    ...record,
    cover_img: normalized,
  }
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((user) => normalizeCreatorCoverImg(user)) as User[]
}

export async function getUserByHandle(handle: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle)
    .single()

  if (error) throw error
  return normalizeCreatorCoverImg(data as User)
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizeCreatorCoverImg(data as User)
}

export async function getCreators() {
  // Creators are verified users with a meaningful following (public-facing query, no RLS-blocked workspace tables)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('verified', true)
    .gt('followers', 10000)
    .order('followers', { ascending: false })

  if (error) throw error
  return (data || []).map((creator) => normalizeCreatorCoverImg(creator)) as User[]
}

function buildDiscoverPattern(query?: string) {
  return (query || '').trim().replaceAll(',', ' ').replaceAll('%', '').replaceAll('*', '')
}

async function getWorkspaceConsumerConfigsForOwnerIds(ownerUserIds: string[]) {
  if (ownerUserIds.length === 0) return [] as Array<Pick<WorkspaceConsumerConfig, 'workspace_id' | 'template_key' | 'config_json'> & { workspace: Pick<Workspace, 'owner_user_id'> | null }>

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, owner_user_id')
    .in('owner_user_id', ownerUserIds)

  if (workspaceError) throw workspaceError
  if (!workspaces || workspaces.length === 0) return []

  const workspaceById = new Map(workspaces.map((workspace) => [workspace.id, workspace]))
  const { data: configs, error: configError } = await supabase
    .from('workspace_consumer_configs')
    .select('workspace_id, template_key, config_json')
    .in('workspace_id', workspaces.map((workspace) => workspace.id))

  if (configError) throw configError

  return (configs || []).map((config) => ({
    ...config,
    workspace: workspaceById.get(config.workspace_id) || null,
  })) as Array<Pick<WorkspaceConsumerConfig, 'workspace_id' | 'template_key' | 'config_json'> & { workspace: Pick<Workspace, 'owner_user_id'> | null }>
}

export async function getPublicCommunityCreatorIds(ownerUserIds: string[]) {
  const configMap = await getPublicCommunityConfigsByOwner(ownerUserIds)
  return new Set(configMap.keys())
}

export async function getPublicCommunityConfigsByOwner(ownerUserIds: string[]) {
  const configs = await getWorkspaceConsumerConfigsForOwnerIds(ownerUserIds)

  const map = new Map<string, WorkspaceConsumerConfig['config_json']>()
  for (const config of configs) {
    const ownerUserId = config.workspace?.owner_user_id
    if (!ownerUserId) continue
    if (
      config.template_key === 'fan_community' ||
      config.config_json?.featured_template === 'fan_community' ||
      config.config_json?.featured_creator_id === ownerUserId
    ) {
      map.set(ownerUserId, config.config_json || null)
    }
  }
  return map
}

export async function getPublicConsumerAppsForUser(userId: string) {
  const [communityOwnerIds, courses] = await Promise.all([
    getPublicCommunityCreatorIds([userId]),
    getConsumerCourses(),
  ])

  return {
    hasCommunity: communityOwnerIds.has(userId),
    courses: courses.filter((course) => course.creator_id === userId),
  }
}

export async function getCreatorsForDiscover(options: { query?: string; page?: number; pageSize?: number } = {}) {
  const page = options.page ?? 0
  const pageSize = options.pageSize ?? 6
  const pattern = buildDiscoverPattern(options.query)

  // Get all creator_ops users
  const allCreators = await getCreators()
  if (allCreators.length === 0) return []

  let creators = allCreators
  if (pattern) {
    const lc = pattern.toLowerCase()
    creators = creators.filter((c) =>
      c.name.toLowerCase().includes(lc) ||
      c.handle.toLowerCase().includes(lc) ||
      (c.bio || '').toLowerCase().includes(lc)
    )
  }

  const from = page * pageSize
  const to = from + pageSize
  return creators.slice(from, to)
}

// Used by getPublicConsumerAppsForUser - import locally to avoid circular dep
import type { ConsumerCourse } from '../../lib/supabase'

async function getConsumerCourses() {
  const { data, error } = await supabase
    .from('consumer_courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ConsumerCourse[]
}
