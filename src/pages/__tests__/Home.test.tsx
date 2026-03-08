import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../Home'
import * as AppContext from '../../context/AppContext'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerApi from '../../domain/consumer/api'
import * as Engagement from '../../domain/consumer/engagement'
import * as ServicesApi from '../../services/api'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
  getCommunityMembershipSnapshot: vi.fn(),
  getCourseLibrarySnapshot: vi.fn(),
}))

vi.mock('../../domain/consumer/engagement', () => ({
  computeCourseProgress: vi.fn(),
  getMembershipStatus: vi.fn(),
  getProgressForCourse: vi.fn(),
  getPurchasedCourseSlugs: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getCreators: vi.fn(),
  getPosts: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const communityExperience = {
  profile: {
    title: 'Community Template',
    description: 'Community browsing',
    ctaLabel: 'Open membership',
    ctaHref: '/membership',
  },
  community: {
    hero: {
      eyebrow: 'Fan Community',
      title: 'A place for members, rituals, and conversations that stay alive every week.',
      description: 'Join creator spaces.',
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
      tiers: [
        { key: 'free', name: 'Free', price: '$0', note: 'Public posts', perks: [] },
        { key: 'creator_club', name: 'Core', price: '$9', note: 'Members-only', perks: [] },
      ],
    },
    topics: {
      title: 'Browse active circles',
      subtitle: 'Recurring discussions.',
      whyItExists: 'Topic layer',
      entries: [
        { id: 'critique-room', name: 'Weekly Critique Room', members: '1.8K', description: 'Feedback every Friday.' },
      ],
    },
    spaces: {
      title: 'Creator spaces',
      subtitle: 'Rooms members return to.',
    },
    feed: {
      title: 'Recent member drops',
      subtitle: 'Locked posts and updates.',
    },
  },
  courses: {
    storefront: {
      eyebrow: 'Course Storefront',
      title: 'Sell structured knowledge, not merch.',
      description: 'Course storefront.',
      primaryCta: 'Open catalog',
      secondaryCta: 'View learning hub',
    },
    catalog: {
      title: 'Course Catalog',
      subtitle: 'Structured offers.',
    },
    detail: {
      learnTitle: 'What you will learn',
      actionsTitle: 'Next actions',
      buyLabel: 'Buy course',
      catalogLabel: 'View catalog',
    },
    learning: {
      title: 'Learning',
      subtitle: 'Progress and continue-learning entry.',
      steps: [
        { label: 'Start with positioning', note: 'Clarify the promise.' },
      ],
      shortcuts: [
        { label: 'Catalog', href: '/courses' },
        { label: 'My learning', href: '/learning' },
      ],
    },
  },
} as const

const mockCreators = [
  { id: 'creator-1', name: 'Luna Chen', bio: 'Digital artist', verified: true, avatar_color: 'from-pink-500 to-orange-500' },
]

const mockPosts = [
  { id: 'post-1', title: 'Member drop', preview: 'New members-only update', type: 'post', locked: true, creator: { name: 'Luna Chen' } },
]

const mockCourse = {
  id: 'course-1',
  slug: 'community-growth',
  title: 'Build a Paid Fan Community',
  subtitle: 'Turn audience attention into a membership business.',
  instructor: 'Luna Chen',
  price: 129,
  level: 'Intermediate',
  hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
  headline: 'From casual audience to paying members in 30 days.',
  description: 'Structured knowledge for community operators.',
  outcomes: ['Outcome 1'],
  stats: {
    lessons: 18,
    students: 1240,
    completionRate: '68%',
  },
  sections: [
    { id: 'cg-1', title: 'Positioning Your Community', duration: '14 min', preview: true, summary: 'Define positioning.' },
    { id: 'cg-2', title: 'Pricing and Tier Design', duration: '21 min', summary: 'Price well.' },
  ],
} as any

function mockCommunityApp() {
  vi.mocked(AppContext.useApp).mockReturnValue({
    consumerTemplate: 'fan_community',
    consumerConfig: {
      featured_creator_id: 'creator-1',
      featured_course_slug: 'community-growth',
    },
    consumerExperience: communityExperience,
  } as any)
}

function mockCoursesApp() {
  vi.mocked(AppContext.useApp).mockReturnValue({
    consumerTemplate: 'sell_courses',
    consumerConfig: {
      featured_creator_id: 'creator-1',
      featured_course_slug: 'community-growth',
    },
    consumerExperience: communityExperience,
  } as any)
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1' },
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)
    vi.mocked(ServicesApi.getCreators).mockResolvedValue(mockCreators as any)
    vi.mocked(ServicesApi.getPosts).mockResolvedValue(mockPosts as any)
    vi.mocked(ConsumerApi.getCommunityMembershipSnapshot).mockResolvedValue({
      creator: { id: 'creator-1', name: 'Luna Chen' },
      tiers: communityExperience.community.membership.tiers,
      totalMembers: 4200,
      activeFans: 1800,
      topFans: [],
    } as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [mockCourse],
      featuredCourse: mockCourse,
    })
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue({
      tier_key: 'creator_club',
      tier_name: 'Core',
    } as any)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([])
    vi.mocked(Engagement.computeCourseProgress).mockReturnValue({
      completedCount: 0,
      percent: 0,
      nextSection: mockCourse.sections[0],
      completedKeys: new Set(),
    })
  })

  it('shows current community plan when membership exists', async () => {
    mockCommunityApp()

    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Your Community Home')).toBeInTheDocument()
      expect(screen.getAllByText('Core').length).toBeGreaterThan(0)
      expect(screen.getByText('You already joined as Core.')).toBeInTheDocument()
    })
  })

  it('shows buy CTA when featured course is not purchased', async () => {
    mockCoursesApp()

    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Buy course')).toBeInTheDocument()
      expect(screen.getByText('View course')).toBeInTheDocument()
    })
  })

  it('shows continue-learning state when featured course is purchased', async () => {
    mockCoursesApp()
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue(['community-growth'])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([
      { section_key: 'cg-1', completed: true },
    ] as any)
    vi.mocked(Engagement.computeCourseProgress).mockReturnValue({
      completedCount: 1,
      percent: 50,
      nextSection: mockCourse.sections[1],
      completedKeys: new Set(['cg-1']),
    })

    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getAllByText('Continue learning').length).toBeGreaterThan(0)
      expect(screen.getByText('Purchased already · 1/2 lessons completed.')).toBeInTheDocument()
      expect(screen.getByText('Purchased')).toBeInTheDocument()
      expect(screen.getByText('Continue · 50%')).toBeInTheDocument()
    })
  })
})
