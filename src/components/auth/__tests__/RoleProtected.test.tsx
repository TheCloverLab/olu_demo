import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RoleProtected from '../RoleProtected'
import * as AuthContext from '../../../context/AuthContext'
import * as AppContext from '../../../context/AppContext'

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

function renderProtected(
  props: { requireAuth?: boolean; requiredRole?: any; bypassOnboarding?: boolean } = {},
  initialPath = '/'
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/"
          element={
            <RoleProtected {...props}>
              <div>Protected Content</div>
            </RoleProtected>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/settings" element={<div>Settings Page</div>} />
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RoleProtected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows nothing while loading', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    const { container } = renderProtected()
    expect(container.innerHTML).toBe('')
  })

  it('redirects to login when not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: true } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to settings when missing required role', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: true } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected({ requiredRole: 'creator' })
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })

  it('renders children when user has required role', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: true } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'creator',
      currentUser: {},
      availableRoles: ['fan', 'creator'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected({ requiredRole: 'creator' })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to onboarding when not completed', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: false } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected()
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument()
  })

  it('bypasses onboarding check when bypassOnboarding is true', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: false } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected({ bypassOnboarding: true })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('allows unauthenticated access when requireAuth is false', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: {},
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    renderProtected({ requireAuth: false })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
