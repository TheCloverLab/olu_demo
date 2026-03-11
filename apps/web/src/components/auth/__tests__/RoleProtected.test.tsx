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

function mockApp(overrides: Record<string, any> = {}) {
  vi.mocked(AppContext.useApp).mockReturnValue({
    currentUser: {},
    enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
    hasModule: (key: string) => (overrides.enabledBusinessModules || ['creator_ops', 'marketing', 'supply_chain']).includes(key),
    ...overrides,
  } as any)
}

function renderProtected(
  props: { requireAuth?: boolean; requiredModule?: any; bypassOnboarding?: boolean } = {},
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
        <Route path="/business" element={<div>Business Page</div>} />
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
    mockApp()

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
    mockApp()

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
    mockApp()

    renderProtected()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects when missing required module', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: true } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    mockApp({ enabledBusinessModules: ['marketing'] })

    renderProtected({ requiredModule: 'creator_ops' })
    // Should redirect to / since path doesn't start with /business
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has required module', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', onboarding_completed: true } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    mockApp({ enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'] })

    renderProtected({ requiredModule: 'creator_ops' })
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
    mockApp()

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
    mockApp()

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
    mockApp()

    renderProtected({ requireAuth: false })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
