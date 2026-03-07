import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'

// Re-mock supabase with controllable behavior per test
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.name : 'none'}</span>
      <button onClick={() => signIn('test@test.com', 'pass')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any)
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any)
  })

  it('starts in loading state then resolves', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('loads user profile when session exists', async () => {
    const mockSession = {
      user: { id: 'auth-123' },
      access_token: 'token',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
    } as any)

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-1', name: 'Test User', role: 'fan' },
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
  })

  it('calls signInWithPassword on signIn', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: {}, session: {} },
      error: null,
    } as any)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    await userEvent.click(screen.getByText('Sign In'))

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass',
    })
  })

  it('signIn rejects on error', async () => {
    const error = new Error('Invalid credentials')
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error,
    } as any)

    // Test the signIn function directly through the context
    let signInFn: (email: string, password: string) => Promise<void>

    function CaptureSignIn() {
      const { signIn, loading } = useAuth()
      signInFn = signIn
      return <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
    }

    render(
      <AuthProvider>
        <CaptureSignIn />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    await expect(signInFn!('test@test.com', 'pass')).rejects.toThrow('Invalid credentials')
  })

  it('calls supabase signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    await userEvent.click(screen.getByText('Sign Out'))
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('unsubscribes from auth changes on unmount', async () => {
    const unsubscribe = vi.fn()
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe } },
    } as any)

    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('throws when useAuth is used outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useAuth must be used within AuthProvider')
  })
})
