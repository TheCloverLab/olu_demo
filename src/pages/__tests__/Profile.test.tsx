import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '../Profile'
import * as AuthContext from '../../context/AuthContext'
import * as AppContext from '../../context/AppContext'
import * as ConsumerApi from '../../domain/consumer/api'
import * as Engagement from '../../domain/consumer/engagement'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  handle: '@testuser',
  bio: 'Hello world',
  followers: 1234,
  following: 56,
  posts: 12,
  verified: true,
  initials: 'TU',
  avatar_color: 'from-blue-500 to-purple-600',
}

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
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'fan_community',
      consumerConfig: {
        featured_creator_id: 'creator-1',
        featured_course_slug: 'community-growth',
      },
    } as any)
    vi.mocked(ConsumerApi.getCommunityMembershipSnapshot).mockResolvedValue({
      creator: { id: 'creator-1', name: 'Luna Chen' },
      activeFans: 1800,
      totalMembers: 4200,
      tiers: [],
      topFans: [],
    } as any)
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue(null)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [
        {
          id: 'course-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          sections: [{ id: 'cg-1' }, { id: 'cg-2' }],
        },
      ],
      featuredCourse: {
        id: 'course-1',
        slug: 'community-growth',
        title: 'Build a Paid Fan Community',
        sections: [{ id: 'cg-1' }, { id: 'cg-2' }],
      },
    } as any)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
    vi.mocked(Engagement.getProgressForCourse).mockResolvedValue([])
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
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('renders user profile info', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('shows consumer access summary for the community app', async () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('My Access')).toBeInTheDocument()
      expect(screen.getByText('Community')).toBeInTheDocument()
      expect(screen.getByText('Membership access')).toBeInTheDocument()
      expect(screen.getByText(/You are browsing the app as a visitor/)).toBeInTheDocument()
      expect(screen.getByText(/1.8K active fans across 4.2K total members/)).toBeInTheDocument()
    })
  })

  it('shows current membership when one exists', async () => {
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue({
      tier_name: 'VIP',
      tier_key: 'vip',
      status: 'active',
    } as any)

    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('VIP member')).toBeInTheDocument()
      expect(screen.getByText(/You currently have access to Luna Chen's member spaces/)).toBeInTheDocument()
    })
  })

  it('shows learning summary for the course app', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'sell_courses',
      consumerConfig: {
        featured_creator_id: 'creator-1',
        featured_course_slug: 'community-growth',
      },
    } as any)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue(['community-growth'])

    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Academy')).toBeInTheDocument()
      expect(screen.getByText('My learning')).toBeInTheDocument()
      expect(screen.getByText('1/2 lessons completed')).toBeInTheDocument()
      expect(screen.getByText('1 purchased course in this app.')).toBeInTheDocument()
    })
  })

  it('shows default bio when none set', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { ...mockUser, bio: undefined } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('No bio yet.')).toBeInTheDocument()
  })

  it('shows initials when no avatar image', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { ...mockUser, avatar_img: undefined } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('TU')).toBeInTheDocument()
  })
})
