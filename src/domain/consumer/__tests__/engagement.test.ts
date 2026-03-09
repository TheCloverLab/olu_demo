import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeCourseProgress,
  getMembershipStatus,
  hasPurchasedCourse,
  joinMembership,
  markLessonComplete,
  purchaseCourse,
} from '../engagement'
import * as ConsumerData from '../data'

vi.mock('../data', () => ({
  createConsumerCoursePurchase: vi.fn(),
  getConsumerCoursePurchase: vi.fn(),
  getConsumerCoursePurchases: vi.fn(),
  getConsumerLessonProgress: vi.fn(),
  getConsumerMembership: vi.fn(),
  upsertConsumerLessonProgress: vi.fn(),
  upsertConsumerMembership: vi.fn(),
}))

const course = {
  id: 'course-1',
  slug: 'community-growth',
  sections: [
    { id: 'cg-1', title: 'One' },
    { id: 'cg-2', title: 'Two' },
    { id: 'cg-3', title: 'Three' },
  ],
} as any

describe('consumer engagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('stores guest membership in localStorage', async () => {
    await joinMembership(null, 'creator-1', 'vip', 'VIP')
    const result = await getMembershipStatus(null, 'creator-1')

    expect(result?.tier_key).toBe('vip')
  })

  it('stores guest course purchase in localStorage', async () => {
    await purchaseCourse(null, course)
    const result = await hasPurchasedCourse(null, course)

    expect(result).toBe(true)
  })

  it('stores guest lesson progress in localStorage', async () => {
    await markLessonComplete(null, course, 'cg-1')
    const progress = JSON.parse(window.localStorage.getItem('olu.consumer.courseProgress') || '{}')

    expect(progress['community-growth'][0].section_key).toBe('cg-1')
  })

  it('uses backend membership APIs for authenticated users', async () => {
    vi.mocked(ConsumerData.upsertConsumerMembership).mockResolvedValue({
      id: 'membership-1',
      tier_key: 'vip',
    } as any)

    await joinMembership({ id: 'user-1' } as any, 'creator-1', 'vip', 'VIP')

    expect(ConsumerData.upsertConsumerMembership).toHaveBeenCalledWith('user-1', 'creator-1', 'vip', 'VIP')
  })

  it('computes progress summary from completed sections', () => {
    const result = computeCourseProgress(course, [
      { section_key: 'cg-1', completed: true },
      { section_key: 'cg-2', completed: true },
    ] as any)

    expect(result.completedCount).toBe(2)
    expect(result.percent).toBe(67)
    expect(result.nextSection?.id).toBe('cg-3')
  })
})
