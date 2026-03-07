import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider, useApp } from '../AppContext'
import * as AuthContext from '../AuthContext'

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}))

function TestConsumer() {
  const { currentRole, availableRoles, switchRole, showRoleSwitcher, setShowRoleSwitcher } = useApp()
  return (
    <div>
      <span data-testid="role">{currentRole}</span>
      <span data-testid="roles">{availableRoles.join(',')}</span>
      <span data-testid="switcher">{showRoleSwitcher ? 'open' : 'closed'}</span>
      <button onClick={() => switchRole('creator')}>Switch to Creator</button>
      <button onClick={() => switchRole('advertiser')}>Switch to Advertiser</button>
      <button onClick={() => setShowRoleSwitcher(true)}>Open Switcher</button>
    </div>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to fan role when no user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('role')).toHaveTextContent('fan')
    expect(screen.getByTestId('roles')).toHaveTextContent('fan')
  })

  it('sets initial role from user profile', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['creator', 'fan'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('role')).toHaveTextContent('creator')
    expect(screen.getByTestId('roles')).toHaveTextContent('creator,fan')
  })

  it('switches role when user has permission', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['fan', 'creator'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await userEvent.click(screen.getByText('Switch to Creator'))
    expect(screen.getByTestId('role')).toHaveTextContent('creator')
  })

  it('does not switch to unauthorized role', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['fan'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await userEvent.click(screen.getByText('Switch to Advertiser'))
    expect(screen.getByTestId('role')).toHaveTextContent('fan')
  })

  it('toggles role switcher visibility', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('switcher')).toHaveTextContent('closed')
    await userEvent.click(screen.getByText('Open Switcher'))
    expect(screen.getByTestId('switcher')).toHaveTextContent('open')
  })

  it('closes role switcher after switching role', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['fan', 'creator'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await userEvent.click(screen.getByText('Open Switcher'))
    expect(screen.getByTestId('switcher')).toHaveTextContent('open')

    await userEvent.click(screen.getByText('Switch to Creator'))
    expect(screen.getByTestId('switcher')).toHaveTextContent('closed')
  })

  it('provides guest user when not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    function GuestCheck() {
      const { currentUser } = useApp()
      return <span data-testid="name">{currentUser.name}</span>
    }

    render(
      <AppProvider>
        <GuestCheck />
      </AppProvider>
    )

    expect(screen.getByTestId('name')).toHaveTextContent('Guest')
  })

  it('throws when useApp is used outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useApp must be used within AppProvider')
  })
})
