export type CourseSection = {
  id: string
  title: string
  duration: string
  preview?: boolean
  summary: string
}

export type Course = {
  id: string
  creator_id?: string
  slug: string
  title: string
  subtitle: string
  instructor: string
  price: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  hero: string
  headline: string
  description: string
  outcomes: string[]
  stats: {
    lessons: number
    students: number
    completionRate: string
  }
  sections: CourseSection[]
}

export const COURSE_LIBRARY: Course[] = [
  {
    id: 'course-community-growth',
    slug: 'community-growth',
    title: 'Build a Paid Fan Community',
    subtitle: 'Turn audience attention into a durable membership business.',
    instructor: 'Luna Chen',
    price: 129,
    level: 'Intermediate',
    hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
    headline: 'From casual audience to paying members in 30 days.',
    description: 'A practical course on community positioning, membership packaging, and retention loops for creators.',
    outcomes: [
      'Design a community offer people understand in one screen',
      'Build member tiers that drive upgrades',
      'Create a recurring content rhythm that keeps churn low',
    ],
    stats: {
      lessons: 18,
      students: 1240,
      completionRate: '68%',
    },
    sections: [
      { id: 'cg-1', title: 'Positioning Your Community', duration: '14 min', preview: true, summary: 'Define who the community is for and why people stay.' },
      { id: 'cg-2', title: 'Pricing and Tier Design', duration: '21 min', summary: 'Package free, core, and premium tiers without confusing members.' },
      { id: 'cg-3', title: 'Content Rhythm and Events', duration: '19 min', summary: 'Set weekly rituals that create return behavior.' },
      { id: 'cg-4', title: 'Retention and Win-back', duration: '16 min', summary: 'Detect churn signals and build recovery loops.' },
    ],
  },
  {
    id: 'course-launch-playbook',
    slug: 'launch-playbook',
    title: 'Launch Your First Cohort Course',
    subtitle: 'Design, sell, and deliver a course with a small team.',
    instructor: 'Ryu Codes',
    price: 179,
    level: 'Beginner',
    hero: 'from-sky-600 via-cyan-500 to-emerald-400',
    headline: 'A practical launch sequence for creators who want structured teaching revenue.',
    description: 'This course focuses on offer framing, curriculum design, launch sequencing, and student onboarding.',
    outcomes: [
      'Break expertise into a clear curriculum',
      'Build a landing page that sells the transformation',
      'Run a lightweight course launch with clear milestones',
    ],
    stats: {
      lessons: 22,
      students: 860,
      completionRate: '72%',
    },
    sections: [
      { id: 'lp-1', title: 'Choose the Promise', duration: '12 min', preview: true, summary: 'Frame the outcome and who the course is for.' },
      { id: 'lp-2', title: 'Curriculum Mapping', duration: '24 min', summary: 'Turn experience into a simple module structure.' },
      { id: 'lp-3', title: 'Launch Assets', duration: '17 min', summary: 'Build sales assets, social proof, and launch timing.' },
      { id: 'lp-4', title: 'Student Delivery', duration: '20 min', summary: 'Handle onboarding, learning flow, and support.' },
    ],
  },
]

export const FEATURED_COURSE = COURSE_LIBRARY[0]

export function getCourseBySlug(slugOrId: string) {
  return COURSE_LIBRARY.find((course) => course.slug === slugOrId || course.id === slugOrId)
}
