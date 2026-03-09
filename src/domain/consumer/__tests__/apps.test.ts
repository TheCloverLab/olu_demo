import { describe, expect, it } from 'vitest'
import {
  buildAcademyConsumerApps,
  buildCommunityConsumerApp,
  buildOwnedConsumerApps,
  getConsumerAppTypeForTemplate,
  getPrimaryConsumerApp,
  getTemplateKeyForConsumerAppType,
  hasCommunityAppConfig,
} from '../apps'
import type { ConsumerCourse, WorkspaceConsumerConfig } from '../../../lib/supabase'

const owner = {
  id: 'creator-1',
  name: 'Luna Chen',
  handle: '@lunachen',
  username: 'lunachen',
}

const communityConfig: WorkspaceConsumerConfig = {
  id: 'cfg-1',
  workspace_id: 'ws-1',
  template_key: 'fan_community',
  config_json: {
    featured_template: 'fan_community',
    community_hero_description: 'Private reviews and weekly drops.',
  },
}

const publishedCourse: ConsumerCourse = {
  id: 'course-1',
  creator_id: owner.id,
  slug: 'launch-academy',
  title: 'Launch Academy',
  subtitle: 'Ship your first cohort course.',
  instructor: owner.name,
  price: 129,
  level: 'Beginner',
  hero: '/images/covers/course.jpg',
  headline: 'Launch with a small team.',
  description: 'Detailed curriculum for first-time creators.',
  outcomes: [],
  lessons_count: 8,
  students_count: 124,
  completion_rate: '71%',
  status: 'published',
}

describe('consumer app domain helpers', () => {
  it('maps template keys to app types', () => {
    expect(getConsumerAppTypeForTemplate('fan_community')).toBe('community')
    expect(getConsumerAppTypeForTemplate('sell_courses')).toBe('academy')
    expect(getTemplateKeyForConsumerAppType('community')).toBe('fan_community')
    expect(getTemplateKeyForConsumerAppType('academy')).toBe('sell_courses')
  })

  it('detects community app config', () => {
    expect(hasCommunityAppConfig(communityConfig)).toBe(true)
    expect(hasCommunityAppConfig({
      ...communityConfig,
      template_key: 'sell_courses',
      config_json: {},
    })).toBe(false)
  })

  it('builds a community app from workspace config', () => {
    expect(buildCommunityConsumerApp(owner, communityConfig)).toMatchObject({
      owner_user_id: owner.id,
      app_type: 'community',
      title: 'Luna Chen Community',
      slug: 'lunachen-community',
      source: 'workspace_config',
    })
  })

  it('builds academy apps from courses', () => {
    expect(buildAcademyConsumerApps([publishedCourse])).toEqual([
      expect.objectContaining({
        owner_user_id: owner.id,
        app_type: 'academy',
        title: 'Launch Academy',
        slug: 'launch-academy',
        linked_course_id: publishedCourse.id,
      }),
    ])
  })

  it('builds owned apps without fabricating missing surfaces', () => {
    const apps = buildOwnedConsumerApps(owner, null, [publishedCourse])

    expect(apps).toHaveLength(1)
    expect(apps[0].app_type).toBe('academy')
  })

  it('resolves the primary app from the preferred template', () => {
    const apps = buildOwnedConsumerApps(owner, communityConfig, [publishedCourse])

    expect(getPrimaryConsumerApp(apps, 'sell_courses')?.app_type).toBe('academy')
    expect(getPrimaryConsumerApp(apps, 'fan_community')?.app_type).toBe('community')
  })
})
