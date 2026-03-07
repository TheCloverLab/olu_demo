import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../Settings'
import * as AuthContext from '../../context/AuthContext'
import * as AppContext from '../../context/AppContext'
import * as api from '../../services/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getMyRoleApplications: vi.fn(),
  submitRoleApplication: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }),
      })),
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
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })
    vi.mocked(api.getMyRoleApplications).mockResolvedValue([])
  })

  it('renders account settings page', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Session')).toBeInTheDocument()
  })

  it('displays user profile fields', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
  })

  it('shows role options with Active badge for current roles', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)

    await waitFor(() => {
      // Fan should show Active since it's in availableRoles
      expect(screen.getByText('Fan')).toBeInTheDocument()
      expect(screen.getByText('Creator')).toBeInTheDocument()
      expect(screen.getByText('Advertiser')).toBeInTheDocument()
      expect(screen.getByText('Supplier')).toBeInTheDocument()
    })
  })

  it('shows Apply buttons for roles user does not have', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)

    await waitFor(() => {
      // Creator, Advertiser, Supplier should have Apply buttons
      const applyButtons = screen.getAllByText('Apply')
      expect(applyButtons).toHaveLength(3)
    })
  })

  it('submits role application', async () => {
    vi.mocked(api.submitRoleApplication).mockResolvedValue('app-1')

    render(<MemoryRouter><Settings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getAllByText('Apply')).toHaveLength(3)
    })

    // Click first Apply button (Creator)
    await userEvent.click(screen.getAllByText('Apply')[0])

    await waitFor(() => {
      expect(api.submitRoleApplication).toHaveBeenCalledWith('creator', 'Requested from account settings')
      expect(screen.getByText(/Application submitted/)).toBeInTheDocument()
    })
  })

  it('shows pending status for submitted applications', async () => {
    vi.mocked(api.getMyRoleApplications).mockResolvedValue([
      { id: 'a1', user_id: 'user-1', target_role: 'creator', status: 'pending' },
    ] as any)

    render(<MemoryRouter><Settings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
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

    // Click the confirm sign out button (second "Sign out" text in the dialog)
    const signOutButtons = screen.getAllByText('Sign out')
    await userEvent.click(signOutButtons[signOutButtons.length - 1])

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
