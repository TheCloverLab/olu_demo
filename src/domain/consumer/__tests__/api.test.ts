import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCommunityMembershipSnapshot,
  getConsumerExperience,
  getCourseLibrarySnapshot,
  getCourseSnapshotBySlug,
  resolveFeaturedCommunityCreator,
} from '../api'
import * as ConsumerData from '../data'
import * as ProfileApi from '../../profile/api'

vi.mock('../data', () => ({
  getCommunityFans: vi.fn(),
  getCommunityMembershipTiers: vi.fn(),
  getConsumerCourseDetail: vi.fn(),
  getConsumerCourseDetailSections: vi.fn(),
  getPublishedConsumerCourses: vi.fn(),
}))

vi.mock('../../profile/api', () => ({
  getProfileById: vi.fn(),
  getPublicCreators: vi.fn(),
}))

describe('consumer domain api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the preferred creator ID when provided', async () => {
    vi.mocked(ProfileApi.getProfileById).mockResolvedValue({
      id: 'creator-1',
      name: 'Luna',
    } as any)

    const result = await resolveFeaturedCommunityCreator(
      { id: 'viewer-1' } as any,
      'creator-1'
    )

    expect(result?.id).toBe('creator-1')
  })

  it('falls back to the first public creator', async () => {
    vi.mocked(ProfileApi.getPublicCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna' },
      { id: 'creator-2', name: 'Kai' },
    ] as any)

    const result = await resolveFeaturedCommunityCreator(
      { id: 'viewer-1' } as any
    )

    expect(ProfileApi.getPublicCreators).toHaveBeenCalled()
    expect(result?.id).toBe('creator-1')
  })

  it('builds a membership snapshot from real tiers and fans', async () => {
    vi.mocked(ProfileApi.getPublicCreators).mockResolvedValue([
      { id: 'creator-1', role: 'creator', name: 'Luna' },
    ] as any)
    vi.mocked(ConsumerData.getCommunityMembershipTiers).mockResolvedValue([
      {
        id: 'tier-1',
        creator_id: 'creator-1',
        name: 'Core',
        price: 9.99,
        description: 'Members-only drops',
        perks: ['Drops', 'Comments'],
        subscriber_count: 42,
      },
      {
        id: 'tier-2',
        creator_id: 'creator-1',
        name: 'VIP',
        price: 29.99,
        description: 'Direct feedback',
        perks: ['Priority'],
        subscriber_count: 10,
      },
    ] as any)
    vi.mocked(ConsumerData.getCommunityFans).mockResolvedValue([
      { id: 'fan-1', status: 'active' },
      { id: 'fan-2', status: 'active' },
      { id: 'fan-3', status: 'churned' },
    ] as any)

    const result = await getCommunityMembershipSnapshot({
      id: 'fan-1',
      role: 'fan',
    } as any)

    expect(result.creator?.id).toBe('creator-1')
    expect(result.tiers[0].name).toBe('Core')
    expect(result.totalMembers).toBe(52)
    expect(result.activeFans).toBe(2)
  })

  it('builds a course library snapshot from persisted course records', async () => {
    vi.mocked(ConsumerData.getPublishedConsumerCourses).mockResolvedValue([
      {
        id: 'course-1',
        slug: 'community-growth',
        title: 'Build a Paid Fan Community',
        subtitle: 'Turn audience attention into a durable membership business.',
        instructor: 'Luna Chen',
        price: 129,
        level: 'Intermediate',
        hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
        headline: 'From casual audience to paying members in 30 days.',
        description: 'Course description',
        outcomes: ['Outcome 1'],
        lessons_count: 2,
        students_count: 100,
        completion_rate: '68%',
      },
    ] as any)
    vi.mocked(ConsumerData.getConsumerCourseDetailSections).mockResolvedValue([
      {
        id: 'sec-1',
        section_key: 'cg-1',
        title: 'Positioning',
        duration: '14 min',
        summary: 'Summary',
        preview: true,
        position: 1,
      },
    ] as any)

    const snapshot = await getCourseLibrarySnapshot()

    expect(snapshot.courses).toHaveLength(1)
    expect(snapshot.featuredCourse.slug).toBe('community-growth')
    expect(snapshot.courses[0].sections[0].id).toBe('cg-1')
  })

  it('loads a single course snapshot by slug', async () => {
    vi.mocked(ConsumerData.getConsumerCourseDetail).mockResolvedValue({
      id: 'course-1',
      slug: 'community-growth',
      title: 'Build a Paid Fan Community',
      subtitle: 'Turn audience attention into a durable membership business.',
      instructor: 'Luna Chen',
      price: 129,
      level: 'Intermediate',
      hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
      headline: 'From casual audience to paying members in 30 days.',
      description: 'Course description',
      outcomes: ['Outcome 1'],
      lessons_count: 2,
      students_count: 100,
      completion_rate: '68%',
    } as any)
    vi.mocked(ConsumerData.getConsumerCourseDetailSections).mockResolvedValue([
      {
        id: 'sec-1',
        section_key: 'cg-1',
        title: 'Positioning',
        duration: '14 min',
        summary: 'Summary',
        preview: true,
        position: 1,
      },
    ] as any)

    const snapshot = await getCourseSnapshotBySlug('community-growth')

    expect(snapshot?.slug).toBe('community-growth')
    expect(snapshot?.sections).toHaveLength(1)
  })

  it('applies workspace consumer config overrides to the experience copy', () => {
    const experience = getConsumerExperience('fan_community', 'Alice', {
      community_hero_title: 'Members first, feed second.',
      community_membership_title: 'Join the inner circle',
      community_topics_title: 'Top discussions',
      community_topic_entries: [
        { name: 'Office Hours', members: '320', description: 'Weekly live critique.' },
      ],
      courses_storefront_title: 'Structured learning storefront',
      courses_catalog_subtitle: 'Outcome-led catalog copy',
    } as any)

    expect(experience.community.hero.title).toBe('Members first, feed second.')
    expect(experience.community.membership.title).toBe('Join the inner circle')
    expect(experience.community.topics.title).toBe('Top discussions')
    expect(experience.community.topics.entries[0].name).toBe('Office Hours')
    expect(experience.courses.storefront.title).toBe('Structured learning storefront')
    expect(experience.courses.catalog.subtitle).toBe('Outcome-led catalog copy')
  })
})
