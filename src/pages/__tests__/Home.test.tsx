import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../Home'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerApi from '../../domain/consumer/api'
import * as Engagement from '../../domain/consumer/engagement'
import * as ProfileApi from '../../domain/profile/api'
import * as ConsumerData from '../../domain/consumer/data'
import * as ProfileData from '../../domain/profile/data'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
  getCourseLibrarySnapshot: vi.fn(),
}))

vi.mock('../../domain/profile/api', () => ({
  getPublicCreators: vi.fn(),
}))

vi.mock('../../domain/consumer/engagement', () => ({
  computeCourseProgress: vi.fn(),
  getMembershipStatus: vi.fn(),
  getProgressForCourse: vi.fn(),
  getPurchasedCourseSlugs: vi.fn(),
}))

vi.mock('../../domain/consumer/data', () => ({
  getPosts: vi.fn(),
}))

vi.mock('../../domain/profile/data', () => ({
  getPublicCommunityCreatorIds: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockCreators = [
  { id: 'creator-1', name: 'Luna Chen', bio: 'Digital artist', verified: true, avatar_color: 'from-pink-500 to-orange-500' },
  { id: 'creator-2', name: 'Ryu Codes', bio: 'Cohort-based teacher', verified: false, avatar_color: 'from-sky-500 to-cyan-500' },
]

const mockPosts = [
  { id: 'post-1', title: 'Member drop', preview: 'New members-only update', type: 'post', locked: true, creator: { id: 'creator-1', name: 'Luna Chen' } },
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
    vi.mocked(ProfileApi.getPublicCreators).mockResolvedValue(mockCreators as any)
    vi.mocked(ProfileData.getPublicCommunityCreatorIds).mockResolvedValue(new Set(['creator-1', 'creator-2']))
    vi.mocked(ConsumerData.getPosts).mockResolvedValue(mockPosts as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [mockCourse],
      featuredCourse: mockCourse,
    } as any)
    vi.mocked(Engagement.getMembershipStatus).mockImplementation(async (_viewer, creatorId) => (
      creatorId === 'creator-1'
        ? { tier_key: 'creator_club', tier_name: 'Core' } as any
        : null
    ))
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
  })

  it('aggregates joined communities and purchased academies into home', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Welcome back.')).toBeInTheDocument()
      expect(screen.getAllByText('Continue learning').length).toBeGreaterThan(0)
      expect(screen.getByText('Your communities')).toBeInTheDocument()
      expect(screen.getByText('New for you')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Community')).toBeInTheDocument()
      expect(screen.getByText('Build a Paid Fan Community')).toBeInTheDocument()
      expect(screen.getAllByText('Core').length).toBeGreaterThan(0)
    })
  })

  it('shows empty-state direction when user has not joined or purchased anything', async () => {
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue(null)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([])

    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Find something worth joining.')).toBeInTheDocument()
      expect(screen.getByText('Find a new community')).toBeInTheDocument()
      expect(screen.getByText('Pick your next academy')).toBeInTheDocument()
    })
  })
})
