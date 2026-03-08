import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '../Profile'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerApi from '../../domain/consumer/api'
import * as Engagement from '../../domain/consumer/engagement'
import * as ServicesApi from '../../services/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
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
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  handle: '@testuser',
  bio: 'Hello world',
  verified: true,
  initials: 'TU',
  avatar_color: 'from-blue-500 to-purple-600',
}

const mockCreators = [
  { id: 'creator-1', name: 'Luna Chen', bio: 'Digital artist & gamer' },
  { id: 'creator-2', name: 'Ryu Codes', bio: 'Build and launch courses' },
]

const mockCourse = {
  id: 'course-1',
  slug: 'community-growth',
  title: 'Build a Paid Fan Community',
  subtitle: 'Turn attention into recurring revenue.',
  instructor: 'Luna Chen',
  sections: [{ id: 'cg-1' }, { id: 'cg-2' }],
} as any

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)
    vi.mocked(ServicesApi.getCreators).mockResolvedValue(mockCreators as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [mockCourse],
      featuredCourse: mockCourse,
    } as any)
    vi.mocked(Engagement.getMembershipStatus).mockImplementation(async (_viewer, creatorId) => (
      creatorId === 'creator-1'
        ? { tier_name: 'VIP', tier_key: 'vip', status: 'active' } as any
        : null
    ))
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue(['community-growth'])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([
      { section_key: 'cg-1', completed: true },
    ] as any)
    vi.mocked(Engagement.computeCourseProgress).mockReturnValue({
      completedCount: 1,
      percent: 50,
      nextSection: { id: 'cg-2' },
      completedKeys: new Set(['cg-1']),
    })
  })

  it('shows loading state when no user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('renders consumer asset sections', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Memberships, learning, and settings')).toBeInTheDocument()
      expect(screen.getByText('Subscriptions & account settings')).toBeInTheDocument()
      expect(screen.getByText('Public profile')).toBeInTheDocument()
      expect(screen.getByText('Your communities')).toBeInTheDocument()
      expect(screen.getAllByText('Academies in progress').length).toBeGreaterThan(0)
      expect(screen.getByText('Jump back in')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Inner Circle')).toBeInTheDocument()
      expect(screen.getAllByText('Build a Paid Fan Community').length).toBeGreaterThan(0)
      expect(screen.getAllByText('VIP').length).toBeGreaterThan(0)
      expect(screen.getAllByText('1/2 lessons completed').length).toBeGreaterThan(0)
    })
  })

  it('shows empty-state guidance when there is no consumer activity', async () => {
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue(null)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([])

    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('No active memberships yet.')).toBeInTheDocument()
      expect(screen.getByText('No academy activity yet.')).toBeInTheDocument()
      expect(screen.getByText('Nothing recent yet. Start in Discover.')).toBeInTheDocument()
    })
  })

  it('shows account-center copy when no bio is set', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { ...mockUser, bio: undefined } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('Your memberships, learning, and account settings.')).toBeInTheDocument()
  })

  it('shows initials when no avatar image', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { ...mockUser, avatar_img: undefined } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('TU')).toBeInTheDocument()
  })
})
