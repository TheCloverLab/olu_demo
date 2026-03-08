import type { ConsumerTemplateKey } from '../../apps/consumer/templateConfig'
import type { Course } from '../../apps/consumer/courseData'
import type { Fan, MembershipTier, User } from '../../lib/supabase'
import {
  getConsumerCourseBySlug,
  getConsumerCourses,
  getConsumerCourseSections,
  getCreators,
  getFansByCreator,
  getMembershipTiersByCreator,
  getUserById,
} from '../../services/api'
import { COURSE_LIBRARY } from '../../apps/consumer/courseData'

export type CommunityTier = {
  name: string
  price: string
  note: string
  perks: string[]
}

export type CommunityTopic = {
  id: string
  name: string
  members: string
  description: string
}

export type LearningStep = {
  label: string
  note: string
}

export type ConsumerExperience = {
  templateKey: ConsumerTemplateKey
  profile: {
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
  }
  community: {
    hero: {
      eyebrow: string
      title: string
      description: string
      stats: Array<{ label: string; value: string }>
    }
    membership: {
      title: string
      subtitle: string
      ctaLabel: string
      tiers: CommunityTier[]
    }
    topics: {
      title: string
      subtitle: string
      whyItExists: string
      entries: CommunityTopic[]
    }
    spaces: {
      title: string
      subtitle: string
    }
    feed: {
      title: string
      subtitle: string
    }
  }
  courses: {
    storefront: {
      eyebrow: string
      title: string
      description: string
      primaryCta: string
      secondaryCta: string
    }
    catalog: {
      title: string
      subtitle: string
    }
    detail: {
      learnTitle: string
      actionsTitle: string
      buyLabel: string
      catalogLabel: string
    }
    learning: {
      title: string
      subtitle: string
      steps: LearningStep[]
      shortcuts: Array<{ label: string; href: string }>
    }
  }
}

export type CommunityMembershipSnapshot = {
  creator: User | null
  tiers: CommunityTier[]
  totalMembers: number
  activeFans: number
  topFans: Fan[]
}

export type CourseLibrarySnapshot = {
  courses: Course[]
  featuredCourse: Course
}

const COMMUNITY_TIERS: CommunityTier[] = [
  {
    name: 'Free',
    price: '$0',
    note: 'Public posts, comments, community lobby',
    perks: ['Public posts', 'Community lobby', 'Weekly digest'],
  },
  {
    name: 'Core',
    price: '$9.99',
    note: 'Members-only drops, event access, private threads',
    perks: ['Members-only posts', 'Circle access', 'Early drops'],
  },
  {
    name: 'VIP',
    price: '$29.99',
    note: 'Direct feedback, live Q&A priority, backstage updates',
    perks: ['Direct feedback', 'Live Q&A priority', 'Merch pre-sale'],
  },
]

const COMMUNITY_TOPICS: CommunityTopic[] = [
  {
    id: 'critique-room',
    name: 'Weekly Critique Room',
    members: '1.8K',
    description: 'Members post work-in-progress and get structured feedback every Friday.',
  },
  {
    id: 'drop-watch',
    name: 'Drop Watch',
    members: '920',
    description: 'Track new releases, early-access content, and private merch drops.',
  },
  {
    id: 'creator-qna',
    name: 'Creator Q&A',
    members: '2.4K',
    description: 'Ask the host about process, tools, and behind-the-scenes decisions.',
  },
]

const LEARNING_STEPS: LearningStep[] = [
  {
    label: 'Start with positioning',
    note: 'Clarify the promise and target learner first.',
  },
  {
    label: 'Map modules and lessons',
    note: 'Turn expertise into a clear chapter flow.',
  },
  {
    label: 'Launch and track completion',
    note: 'Use progress and retention milestones as product signals.',
  },
]

export function getConsumerExperience(
  templateKey: ConsumerTemplateKey,
  viewerName?: string
): ConsumerExperience {
  const name = viewerName || 'Guest'

  return {
    templateKey,
    profile: {
      title: templateKey === 'sell_courses' ? 'Course Template' : 'Community Template',
      description:
        templateKey === 'sell_courses'
          ? `${name} is currently browsing the course storefront experience.`
          : `${name} is currently browsing the fan community experience.`,
      ctaLabel: templateKey === 'sell_courses' ? 'Open catalog' : 'Open membership',
      ctaHref: templateKey === 'sell_courses' ? '/courses' : '/membership',
    },
    community: {
      hero: {
        eyebrow: 'Fan Community',
        title: 'A place for members, rituals, and conversations that stay alive every week.',
        description:
          'Join creator spaces built around access, identity, discussion, and recurring drops instead of one-off purchases.',
        stats: [
          { label: 'Active members', value: '8.4K' },
          { label: 'Live circles', value: '24' },
          { label: 'Member renewals', value: '81%' },
        ],
      },
      membership: {
        title: 'Join a creator circle',
        subtitle: 'A clear ladder from casual follower to committed member.',
        ctaLabel: 'Open membership tiers',
        tiers: COMMUNITY_TIERS,
      },
      topics: {
        title: 'Browse active circles',
        subtitle: 'Recurring discussions, creator rituals, and member-only threads.',
        whyItExists:
          'The community template needs a first-class topic layer. This page gives members a place to enter circles instead of treating everything as a flat feed.',
        entries: COMMUNITY_TOPICS,
      },
      spaces: {
        title: 'Creator spaces',
        subtitle: 'The rooms members actually come back to every week.',
      },
      feed: {
        title: 'Recent member drops',
        subtitle: 'Locked posts, weekly updates, and creator notes.',
      },
    },
    courses: {
      storefront: {
        eyebrow: 'Course Storefront',
        title: 'Sell structured knowledge, not merch.',
        description:
          'This template replaces the merch shop with a course catalog, checkout flow, and learning hub.',
        primaryCta: 'Open catalog',
        secondaryCta: 'View learning hub',
      },
      catalog: {
        title: 'Course Catalog',
        subtitle: 'Structured offers with clear outcomes and chapter flow.',
      },
      detail: {
        learnTitle: 'What you will learn',
        actionsTitle: 'Next actions',
        buyLabel: 'Buy course',
        catalogLabel: 'View catalog',
      },
      learning: {
        title: 'Learning',
        subtitle: 'Progress, recent lessons, and continue-learning entry.',
        steps: LEARNING_STEPS,
        shortcuts: [
          { label: 'Catalog', href: '/courses' },
          { label: 'My learning', href: '/learning' },
        ],
      },
    },
  }
}

function mapMembershipTier(tier: MembershipTier): CommunityTier {
  return {
    name: tier.name,
    price: tier.price === 0 ? '$0' : `$${tier.price}`,
    note: tier.description || 'Membership tier',
    perks: tier.perks || [],
  }
}

export async function resolveFeaturedCommunityCreator(
  viewer?: Pick<User, 'id' | 'role'> | null,
  preferredCreatorId?: string | null
) {
  if (preferredCreatorId) {
    try {
      return await getUserById(preferredCreatorId)
    } catch (error) {
      console.error('Failed to load preferred featured creator', error)
    }
  }

  if (viewer?.id && viewer.role === 'creator') {
    try {
      return await getUserById(viewer.id)
    } catch (error) {
      console.error('Failed to load viewer as featured creator', error)
    }
  }

  const creators = await getCreators()
  return creators[0] || null
}

export async function getCommunityMembershipSnapshot(
  viewer?: Pick<User, 'id' | 'role'> | null,
  preferredCreatorId?: string | null
): Promise<CommunityMembershipSnapshot> {
  const creator = await resolveFeaturedCommunityCreator(viewer, preferredCreatorId)
  if (!creator) {
    return {
      creator: null,
      tiers: COMMUNITY_TIERS,
      totalMembers: 0,
      activeFans: 0,
      topFans: [],
    }
  }

  const [tiers, fans] = await Promise.all([
    getMembershipTiersByCreator(creator.id).catch((error) => {
      console.error('Failed to load membership tiers', error)
      return [] as MembershipTier[]
    }),
    getFansByCreator(creator.id).catch((error) => {
      console.error('Failed to load fans', error)
      return [] as Fan[]
    }),
  ])

  const mappedTiers = tiers.length > 0 ? tiers.map(mapMembershipTier) : COMMUNITY_TIERS
  const totalMembers = tiers.length > 0
    ? tiers.reduce((sum, tier) => sum + (tier.subscriber_count || 0), 0)
    : 0
  const activeFans = fans.filter((fan) => fan.status === 'active').length

  return {
    creator,
    tiers: mappedTiers,
    totalMembers,
    activeFans,
    topFans: fans.slice(0, 3),
  }
}

function mapCourseRecord(
  course: Awaited<ReturnType<typeof getConsumerCourses>>[number],
  sections: Awaited<ReturnType<typeof getConsumerCourseSections>>
): Course {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    instructor: course.instructor,
    price: Number(course.price),
    level: course.level,
    hero: course.hero,
    headline: course.headline,
    description: course.description,
    outcomes: course.outcomes || [],
    stats: {
      lessons: course.lessons_count,
      students: course.students_count,
      completionRate: course.completion_rate,
    },
    sections: sections.map((section) => ({
      id: section.section_key,
      title: section.title,
      duration: section.duration,
      preview: section.preview,
      summary: section.summary,
    })),
  }
}

export async function getCourseLibrarySnapshot(preferredCourseSlug?: string | null): Promise<CourseLibrarySnapshot> {
  try {
    const courses = (await getConsumerCourses()) || []
    if (!courses.length) {
      return {
        courses: COURSE_LIBRARY,
        featuredCourse: COURSE_LIBRARY[0],
      }
    }

    const sectionsByCourse = await Promise.all(
      courses.map(async (course) => ({
        course,
        sections: await getConsumerCourseSections(course.id).catch(() => []),
      }))
    )

    const mapped = sectionsByCourse.map(({ course, sections }) => mapCourseRecord(course, sections))
    const featuredCourse = preferredCourseSlug
      ? mapped.find((course) => course.slug === preferredCourseSlug || course.id === preferredCourseSlug) || mapped[0]
      : mapped[0]
    return {
      courses: mapped,
      featuredCourse,
    }
  } catch (error) {
    console.error('Failed to load course library snapshot', error)
    return {
      courses: COURSE_LIBRARY,
      featuredCourse: COURSE_LIBRARY[0],
    }
  }
}

export async function getCourseSnapshotBySlug(slug: string | null | undefined, preferredCourseSlug?: string | null) {
  try {
    const lookupSlug = slug || preferredCourseSlug
    if (!lookupSlug) return null
    const course = await getConsumerCourseBySlug(lookupSlug)
    if (!course) {
      return COURSE_LIBRARY.find((item) => item.slug === lookupSlug || item.id === lookupSlug) || null
    }

    const sections = await getConsumerCourseSections(course.id)
    return mapCourseRecord(course, sections)
  } catch (error) {
    console.error('Failed to load course snapshot', error)
    const lookupSlug = slug || preferredCourseSlug
    return COURSE_LIBRARY.find((item) => item.slug === lookupSlug || item.id === lookupSlug) || null
  }
}
