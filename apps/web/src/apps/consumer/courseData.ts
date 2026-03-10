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
    id: 'course-digital-art-masterclass',
    slug: 'digital-art-masterclass',
    title: 'Digital Art Masterclass',
    subtitle: 'From sketch to stunning — learn digital painting from zero to portfolio-ready.',
    instructor: 'Luna Chen',
    price: 49,
    level: 'Beginner',
    hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
    headline: 'The complete guide to digital illustration',
    description: 'Learn professional digital painting techniques, color theory, and composition.',
    outcomes: [
      'Master digital brushwork and layering',
      'Build a polished art portfolio',
      'Sell prints and commissions',
    ],
    stats: {
      lessons: 24,
      students: 3400,
      completionRate: '78%',
    },
    sections: [
      { id: 'dam-1', title: 'Getting Started with Digital Tools', duration: '15 min', preview: true, summary: 'Set up your workspace and pick the right brushes.' },
      { id: 'dam-2', title: 'Color Theory & Palettes', duration: '20 min', summary: 'Understand hue, saturation, and value for digital painting.' },
      { id: 'dam-3', title: 'Layering & Composition', duration: '22 min', summary: 'Build depth with layers and frame your subject.' },
      { id: 'dam-4', title: 'Building Your Portfolio', duration: '18 min', summary: 'Curate and present your work for clients and prints.' },
    ],
  },
  {
    id: 'course-lofi-production-101',
    slug: 'lofi-production-101',
    title: 'Lo-fi Production 101',
    subtitle: 'Craft chill beats from scratch using free tools and analog textures.',
    instructor: 'Kai Vibe',
    price: 39,
    level: 'Beginner',
    hero: 'from-sky-600 via-cyan-500 to-emerald-400',
    headline: 'Make your first lo-fi track in a weekend',
    description: 'Step-by-step music production for lo-fi, chillhop, and ambient beats.',
    outcomes: [
      'Set up a free production environment',
      'Layer samples and synths',
      'Publish on streaming platforms',
    ],
    stats: {
      lessons: 18,
      students: 5100,
      completionRate: '82%',
    },
    sections: [
      { id: 'lf-1', title: 'Your First Beat', duration: '12 min', preview: true, summary: 'Build a simple lo-fi loop from scratch.' },
      { id: 'lf-2', title: 'Sampling & Textures', duration: '18 min', summary: 'Layer vinyl crackle, tape hiss, and ambient pads.' },
      { id: 'lf-3', title: 'Mixing & Mastering', duration: '16 min', summary: 'Balance your track for streaming platforms.' },
      { id: 'lf-4', title: 'Publishing Your Music', duration: '14 min', summary: 'Distribute to Spotify, Apple Music, and Bandcamp.' },
    ],
  },
]

export const FEATURED_COURSE = COURSE_LIBRARY[0]

export function getCourseBySlug(slugOrId: string) {
  return COURSE_LIBRARY.find((course) => course.slug === slugOrId || course.id === slugOrId)
}
