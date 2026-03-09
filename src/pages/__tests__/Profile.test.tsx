import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '../Profile'
import * as AuthContext from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
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

  it('renders profile card and account menu items', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Public profile')).toBeInTheDocument()
    expect(screen.getByText('Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Wallet & payments')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your account')).toBeInTheDocument()
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

  it('hides bio line when user has no bio', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { ...mockUser, bio: undefined } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument()
  })
})
