import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCommunityMembershipSnapshot,
  getCourseLibrarySnapshot,
  getCourseSnapshotBySlug,
  resolveFeaturedCommunityCreator,
} from '../api'
import * as Api from '../../../services/api'

vi.mock('../../../services/api', () => ({
  getCreators: vi.fn(),
  getConsumerCourseBySlug: vi.fn(),
  getConsumerCourses: vi.fn(),
  getConsumerCourseSections: vi.fn(),
  getFansByCreator: vi.fn(),
  getMembershipTiersByCreator: vi.fn(),
  getUserById: vi.fn(),
}))

describe('consumer domain api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the viewer when the viewer is a creator', async () => {
    vi.mocked(Api.getUserById).mockResolvedValue({
      id: 'creator-1',
      role: 'creator',
      name: 'Luna',
    } as any)

    const result = await resolveFeaturedCommunityCreator({
      id: 'creator-1',
      role: 'creator',
    } as any)

    expect(Api.getUserById).toHaveBeenCalledWith('creator-1')
    expect(result?.id).toBe('creator-1')
  })

  it('falls back to the first creator when the viewer is not a creator', async () => {
    vi.mocked(Api.getCreators).mockResolvedValue([
      { id: 'creator-1', role: 'creator', name: 'Luna' },
      { id: 'creator-2', role: 'creator', name: 'Kai' },
    ] as any)

    const result = await resolveFeaturedCommunityCreator({
      id: 'fan-1',
      role: 'fan',
    } as any)

    expect(Api.getCreators).toHaveBeenCalled()
    expect(result?.id).toBe('creator-1')
  })

  it('builds a membership snapshot from real tiers and fans', async () => {
    vi.mocked(Api.getCreators).mockResolvedValue([
      { id: 'creator-1', role: 'creator', name: 'Luna' },
    ] as any)
    vi.mocked(Api.getMembershipTiersByCreator).mockResolvedValue([
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
    vi.mocked(Api.getFansByCreator).mockResolvedValue([
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
    vi.mocked(Api.getConsumerCourses).mockResolvedValue([
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
    vi.mocked(Api.getConsumerCourseSections).mockResolvedValue([
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
    vi.mocked(Api.getConsumerCourseBySlug).mockResolvedValue({
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
    vi.mocked(Api.getConsumerCourseSections).mockResolvedValue([
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
})
