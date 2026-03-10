import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../Settings'
import * as AuthContext from '../../context/AuthContext'
import * as AppContext from '../../context/AppContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Settings', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', name: 'Test User', handle: '@testuser', email: 'test@example.com', bio: 'Hello' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: {},
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      hasModule: () => true,
    })
  })

  it('renders account settings with email, handle, and password sections', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('Session')).toBeInTheDocument()
  })

  it('does not show profile editing fields (moved to public profile)', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.queryByText('Display Name')).not.toBeInTheDocument()
    expect(screen.queryByText('Bio')).not.toBeInTheDocument()
    expect(screen.queryByText('Avatar (optional)')).not.toBeInTheDocument()
  })

  it('shows business workspace link when modules are enabled', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText('Business workspace')).toBeInTheDocument()
  })

  it('shows sign out confirmation dialog', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    await userEvent.click(screen.getByText('Sign out'))
    await waitFor(() => {
      expect(screen.getByText('Sign out?')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  it('calls signOut and navigates to login', async () => {
    mockSignOut.mockResolvedValue(undefined)
    render(<MemoryRouter><Settings /></MemoryRouter>)
    await userEvent.click(screen.getByText('Sign out'))

    await waitFor(() => {
      expect(screen.getByText('Sign out?')).toBeInTheDocument()
    })

    const signOutButtons = screen.getAllByText('Sign out')
    await userEvent.click(signOutButtons[signOutButtons.length - 1])

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
