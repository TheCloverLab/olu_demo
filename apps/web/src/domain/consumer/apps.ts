import type { ConsumerTemplateKey } from '../../apps/consumer/templateConfig'
import { getAppTypeForTemplate, getTemplateKeyForAppType, getTemplateDefinition } from '../../apps/consumer/templateConfig'
import { supabase } from '../../lib/supabase'
import type {
  ConsumerApp,
  ConsumerAppType,
  ConsumerCourse,
  User,
  WorkspaceConsumerConfig,
} from '../../lib/supabase'
import { getCreatorsForDiscover, getPublicCommunityConfigsByOwner } from '../profile/data'
import { getConsumerCoursesForFeed } from './data'
import { getProfileById } from '../profile/api'
import { getWorkspaceConsumerConfigForUser } from '../workspace/api'

type AppOwner = Pick<User, 'id' | 'name' | 'handle' | 'username' | 'email'>
type DiscoverQueryOptions = {
  query?: string
  page?: number
  pageSize?: number
}

export type ConsumerAppCard = ConsumerApp & {
  owner_name: string
  owner_handle: string
  price_label: string
  href: string
  highlights: string[]
}

const COMMUNITY_CONFIG_KEYS = [
  'community_hero_title',
  'community_hero_description',
  'community_membership_title',
  'community_membership_subtitle',
  'community_topics_title',
  'community_topic_entries',
]

export function getConsumerAppTypeForTemplate(templateKey: ConsumerTemplateKey): ConsumerAppType {
  return getAppTypeForTemplate(templateKey)
}

export function getTemplateKeyForConsumerAppType(appType: ConsumerAppType): ConsumerTemplateKey {
  return getTemplateKeyForAppType(appType)
}

export function hasCommunityAppConfig(config: WorkspaceConsumerConfig | null | undefined) {
  if (!config) return false
  if (config.template_key === 'fan_community') return true
  if (config.config_json?.featured_template === 'fan_community') return true
  return COMMUNITY_CONFIG_KEYS.some((key) => key in (config.config_json || {}))
}

function toSlugPart(value: string | undefined | null, fallback: string) {
  const raw = (value || fallback).toLowerCase().replace(/^@/, '')
  return raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback
}

export function getCommunityTitle(
  owner: Pick<User, 'name'>,
  configJson?: WorkspaceConsumerConfig['config_json'] | null
): string {
  if (configJson?.community_hero_title && typeof configJson.community_hero_title === 'string') {
    return configJson.community_hero_title
  }
  return `${owner.name} Community`
}

export function buildCommunityConsumerApp(
  owner: Pick<User, 'id' | 'name' | 'handle' | 'username' | 'cover_img'>,
  config: WorkspaceConsumerConfig
): ConsumerApp | null {
  if (!hasCommunityAppConfig(config)) return null

  return {
    id: `community:${owner.id}`,
    owner_user_id: owner.id,
    app_type: 'community',
    title: getCommunityTitle(owner, config.config_json),
    slug: `${toSlugPart(owner.handle || owner.username, 'community')}-community`,
    summary: typeof config.config_json?.community_hero_description === 'string'
      ? config.config_json.community_hero_description
      : null,
    status: 'published',
    visibility: 'public',
    source: 'workspace_config',
    template_key: config.template_key,
    cover_img: config.config_json?.cover_img || owner.cover_img || null,
    config_json: config.config_json || {},
  }
}

export function buildAcademyConsumerApps(courses: ConsumerCourse[]): ConsumerApp[] {
  return courses.map((course) => ({
    id: `academy:${course.id}`,
    owner_user_id: course.creator_id,
    app_type: 'academy' as const,
    title: course.title,
    slug: course.slug,
    summary: course.subtitle || course.headline,
    status: course.status,
    visibility: course.status === 'published' ? 'public' as const : 'private' as const,
    source: 'course',
    template_key: 'sell_courses',
    linked_course_id: course.id,
    linked_course_slug: course.slug,
    cover_img: course.hero || null,
    config_json: null,
  }))
}

export function buildOwnedConsumerApps(
  owner: Pick<User, 'id' | 'name' | 'handle' | 'username' | 'cover_img'>,
  config: WorkspaceConsumerConfig | null,
  courses: ConsumerCourse[]
): ConsumerApp[] {
  const apps: ConsumerApp[] = []
  const communityApp = config ? buildCommunityConsumerApp(owner, config) : null

  if (communityApp) apps.push(communityApp)
  apps.push(...buildAcademyConsumerApps(courses))

  return apps
}

export function getPrimaryConsumerApp(
  apps: ConsumerApp[],
  templateKey?: ConsumerTemplateKey | null
) {
  if (apps.length === 0) return null

  if (templateKey) {
    const matched = apps.find((app) => app.app_type === getConsumerAppTypeForTemplate(templateKey))
    if (matched) return matched
  }

  return apps[0]
}

export function buildConsumerAppCard(
  app: ConsumerApp,
  owner: Pick<User, 'name' | 'handle'>,
  options?: {
    priceLabel?: string
    href?: string
    highlights?: string[]
  }
): ConsumerAppCard {
  return {
    ...app,
    owner_name: owner.name,
    owner_handle: owner.handle,
    price_label: options?.priceLabel || (app.app_type === 'academy' ? 'Open academy' : 'Membership'),
    href: options?.href || (app.app_type === 'academy' && app.linked_course_slug
      ? `/courses/${app.linked_course_slug}`
      : `/communities/${app.owner_user_id}`),
    highlights: options?.highlights || (
      app.app_type === 'academy'
        ? ['Structured lessons', 'Hands-on frameworks', 'Learning progress']
        : ['Weekly drops', 'Private topics', 'Live sessions']
    ),
  }
}

export function buildCommunityCardFromCreator(
  creator: Pick<User, 'id' | 'name' | 'handle' | 'username' | 'bio' | 'cover_img' | 'avatar_color'>,
  configJson?: WorkspaceConsumerConfig['config_json'] | null
) {
  return buildConsumerAppCard({
    id: `community:${creator.id}`,
    owner_user_id: creator.id,
    app_type: 'community',
    title: getCommunityTitle(creator, configJson),
    slug: `${toSlugPart(creator.handle || creator.username, 'community')}-community`,
    summary: creator.bio || 'Membership, recurring community discussions, and creator-only drops.',
    status: 'published',
    visibility: 'public',
    source: 'workspace_config',
    template_key: 'fan_community',
    cover_img: configJson?.cover_img || creator.cover_img || null,
    config_json: configJson || null,
  }, creator, {
    priceLabel: 'Membership',
    href: `/communities/${creator.id}`,
  })
}

export function buildAcademyCardFromCourse(
  course: ConsumerCourse,
  owner?: Pick<User, 'name' | 'handle'>
) {
  return buildConsumerAppCard({
    id: `academy:${course.id}`,
    owner_user_id: course.creator_id,
    app_type: 'academy',
    title: course.title,
    slug: course.slug,
    summary: course.subtitle || course.headline,
    status: course.status,
    visibility: course.status === 'published' ? 'public' : 'private',
    source: 'course',
    template_key: 'sell_courses',
    linked_course_id: course.id,
    linked_course_slug: course.slug,
    cover_img: course.hero || null,
    config_json: null,
  }, {
    name: owner?.name || course.instructor,
    handle: owner?.handle || `@${toSlugPart(course.instructor, 'creator')}`,
  }, {
    priceLabel: `$${Number(course.price)}`,
    href: `/courses/${course.slug}`,
    highlights: course.outcomes?.slice(0, 3) || ['Structured lessons', 'Hands-on frameworks', 'Learning progress'],
  })
}

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function resolveConsumerAppBySlug(slug: string): Promise<{
  creatorId: string
  appType: ConsumerAppType
  title: string
  configJson: Record<string, any> | null
} | null> {
  // Fetch all community configs
  const { data: configs, error } = await supabase
    .from('workspace_consumer_configs')
    .select('*, workspaces!inner(owner_user_id)')

  if (error || !configs) return null

  for (const config of configs) {
    const title = config.config_json?.community_hero_title || ''
    const configSlug = titleToSlug(title)
    if (configSlug === slug) {
      return {
        creatorId: (config as any).workspaces?.owner_user_id,
        appType: config.template_key === 'sell_courses' ? 'academy' : 'community',
        title,
        configJson: config.config_json,
      }
    }
  }

  // Also check courses
  const { data: courses } = await supabase
    .from('consumer_courses')
    .select('*')
    .eq('slug', slug)
    .limit(1)

  if (courses && courses.length > 0) {
    return {
      creatorId: courses[0].creator_id,
      appType: 'academy',
      title: courses[0].title,
      configJson: null,
    }
  }

  return null
}

async function getOwnedConsumerCourses(ownerUserId: string) {
  const { data, error } = await supabase
    .from('consumer_courses')
    .select('*')
    .eq('creator_id', ownerUserId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as ConsumerCourse[]
}

export async function getOwnedConsumerApps(user: AppOwner) {
  const [consumerConfig, courses] = await Promise.all([
    getWorkspaceConsumerConfigForUser(user),
    getOwnedConsumerCourses(user.id),
  ])

  return buildOwnedConsumerApps(user, consumerConfig, courses)
}

export async function getPublicProfileConsumerApps(userId: string) {
  const owner = await getProfileById(userId)
  const apps = await getOwnedConsumerApps(owner)

  // Only show apps with real content — exclude auto-generated workspace_config apps
  return apps
    .filter((app) => app.visibility === 'public' && app.status === 'published' && app.source !== 'workspace_config')
    .map((app) => buildConsumerAppCard(app, owner, {
      href: app.app_type === 'community' ? `/communities/${owner.id}` : `/courses/${app.linked_course_slug}`,
      priceLabel: app.app_type === 'community' ? 'Open community' : 'Open academy',
    }))
}

export async function getDiscoverConsumerAppCards(options: DiscoverQueryOptions = {}) {
  const [creators, courses] = await Promise.all([
    getCreatorsForDiscover(options),
    getConsumerCoursesForFeed(options.query, options.page, options.pageSize),
  ])

  const communityConfigs = await getPublicCommunityConfigsByOwner(creators.map((c) => c.id)).catch(() => new Map<string, any>())

  const communityCards = creators
    .filter((creator) => communityConfigs.has(creator.id))
    .map((creator) => buildCommunityCardFromCreator(creator, communityConfigs.get(creator.id)))

  const academyCards = courses.map((course) => {
    const owner = creators.find((creator) => creator.id === course.creator_id)
    return buildAcademyCardFromCourse(course, owner || undefined)
  })

  const merged: ConsumerAppCard[] = []
  const max = Math.max(communityCards.length, academyCards.length)

  for (let index = 0; index < max; index += 1) {
    if (communityCards[index]) merged.push(communityCards[index])
    if (academyCards[index]) merged.push(academyCards[index])
  }

  return merged
}
