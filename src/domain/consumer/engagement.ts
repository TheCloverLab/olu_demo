import type { Course } from '../../apps/consumer/courseData'
import type { ConsumerLessonProgress, User } from '../../lib/supabase'
import {
  createConsumerCoursePurchase,
  getConsumerCoursePurchase,
  getConsumerCoursePurchases,
  getConsumerLessonProgress,
  getConsumerMembership,
  upsertConsumerLessonProgress,
  upsertConsumerMembership,
} from '../../services/api'

const COURSE_PURCHASES_KEY = 'olu.consumer.coursePurchases'
const COURSE_PROGRESS_KEY = 'olu.consumer.courseProgress'
const MEMBERSHIPS_KEY = 'olu.consumer.memberships'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export async function joinMembership(
  viewer: Pick<User, 'id'> | null | undefined,
  creatorId: string,
  tierKey: string,
  tierName: string
) {
  if (viewer?.id) {
    return await upsertConsumerMembership(viewer.id, creatorId, tierKey, tierName)
  }

  const current = readJson<Record<string, { tier_key: string; tier_name: string; status: 'active' }>>(MEMBERSHIPS_KEY, {})
  current[creatorId] = {
    tier_key: tierKey,
    tier_name: tierName,
    status: 'active',
  }
  writeJson(MEMBERSHIPS_KEY, current)
  return current[creatorId]
}

export async function getMembershipStatus(
  viewer: Pick<User, 'id'> | null | undefined,
  creatorId: string
) {
  if (viewer?.id) {
    return await getConsumerMembership(viewer.id, creatorId)
  }

  const current = readJson<Record<string, { tier_key: string; tier_name: string; status: 'active' }>>(MEMBERSHIPS_KEY, {})
  return current[creatorId] || null
}

export async function purchaseCourse(
  viewer: Pick<User, 'id'> | null | undefined,
  course: Pick<Course, 'id' | 'slug'>
) {
  if (viewer?.id) {
    return await createConsumerCoursePurchase(viewer.id, course.id)
  }

  const current = readJson<Record<string, true>>(COURSE_PURCHASES_KEY, {})
  current[course.slug] = true
  writeJson(COURSE_PURCHASES_KEY, current)
  return current
}

export async function hasPurchasedCourse(
  viewer: Pick<User, 'id'> | null | undefined,
  course: Pick<Course, 'id' | 'slug'>
) {
  if (viewer?.id) {
    const purchase = await getConsumerCoursePurchase(viewer.id, course.id)
    return purchase?.status === 'purchased'
  }

  const current = readJson<Record<string, true>>(COURSE_PURCHASES_KEY, {})
  return !!current[course.slug]
}

export async function getPurchasedCourseSlugs(
  viewer: Pick<User, 'id'> | null | undefined,
  library: Course[]
) {
  if (viewer?.id) {
    const purchases = await getConsumerCoursePurchases(viewer.id)
    const purchaseIds = new Set(purchases.map((item) => item.course_id))
    return library.filter((course) => purchaseIds.has(course.id)).map((course) => course.slug)
  }

  const current = readJson<Record<string, true>>(COURSE_PURCHASES_KEY, {})
  return Object.keys(current)
}

export async function getProgressForCourse(
  viewer: Pick<User, 'id'> | null | undefined,
  course: Pick<Course, 'id' | 'slug'> & { sections: Array<{ id: string }> }
) {
  if (viewer?.id) {
    return await getConsumerLessonProgress(viewer.id, course.id)
  }

  const current = readJson<Record<string, ConsumerLessonProgress[]>>(COURSE_PROGRESS_KEY, {})
  return current[course.slug] || []
}

export async function markLessonComplete(
  viewer: Pick<User, 'id'> | null | undefined,
  course: Pick<Course, 'id' | 'slug'>,
  sectionKey: string
) {
  if (viewer?.id) {
    return await upsertConsumerLessonProgress(viewer.id, course.id, sectionKey, true)
  }

  const current = readJson<Record<string, ConsumerLessonProgress[]>>(COURSE_PROGRESS_KEY, {})
  const existing = current[course.slug] || []
  const next = [
    ...existing.filter((item) => item.section_key !== sectionKey),
    {
      id: `${course.slug}-${sectionKey}`,
      user_id: 'guest',
      course_id: course.id,
      section_key: sectionKey,
      completed: true,
      completed_at: new Date().toISOString(),
    },
  ]
  current[course.slug] = next
  writeJson(COURSE_PROGRESS_KEY, current)
  return next.find((item) => item.section_key === sectionKey) || null
}

export function computeCourseProgress(course: Course, progress: ConsumerLessonProgress[]) {
  const completedKeys = new Set(progress.filter((item) => item.completed).map((item) => item.section_key))
  const completedCount = course.sections.filter((section) => completedKeys.has(section.id)).length
  const percent = course.sections.length > 0 ? Math.round((completedCount / course.sections.length) * 100) : 0
  const nextSection = course.sections.find((section) => !completedKeys.has(section.id)) || course.sections[course.sections.length - 1]

  return {
    completedCount,
    percent,
    nextSection,
    completedKeys,
  }
}
