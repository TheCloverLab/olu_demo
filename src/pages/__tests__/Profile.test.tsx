import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '../Profile'
import * as AuthContext from '../../context/AuthContext'
import * as api from '../../services/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getPostsByCreator: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
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
    vi.mocked(api.getPostsByCreator).mockResolvedValue([])
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

  it('renders user profile info', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('shows follower/following/post stats', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('Following')).toBeInTheDocument()
    expect(screen.getAllByText('Posts').length).toBeGreaterThan(0)
    expect(screen.getByText('1.2K')).toBeInTheDocument()
  })

  it('shows empty posts state', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })

  it('loads and displays posts', async () => {
    const posts = [
      { id: 'p1', title: 'Art #1', cover_img: null, gradient_bg: 'from-gray-700 to-gray-900', locked: false },
    ]
    vi.mocked(api.getPostsByCreator).mockResolvedValue(posts as any)
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Profile /></MemoryRouter>)

    await waitFor(() => {
      expect(api.getPostsByCreator).toHaveBeenCalledWith('user-1')
    })
  })

  it('shows default bio when none set', async () => {
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
