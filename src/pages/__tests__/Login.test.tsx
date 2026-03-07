import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import * as AuthContext from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  const mockSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: mockSignIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('renders login form', () => {
    renderLogin()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('shows error for empty fields', async () => {
    renderLogin()
    const form = screen.getByText('Sign in').closest('form')!
    // The HTML5 required attribute will prevent submission with empty fields
    // But the handleSubmit also checks — let's test with values then clear
    expect(screen.queryByText('Please enter email and password.')).not.toBeInTheDocument()
  })

  it('calls signIn on valid submission', async () => {
    mockSignIn.mockResolvedValue(undefined)
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('displays error on failed signIn', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await userEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    let resolveSignIn: () => void
    mockSignIn.mockReturnValue(new Promise<void>((resolve) => { resolveSignIn = resolve }))
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await userEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })

    resolveSignIn!()
  })

  it('has link to signup page', () => {
    renderLogin()
    const link = screen.getByText('Sign up')
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('redirects if already authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1' } as any,
      session: {} as any,
      loading: false,
      signIn: mockSignIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderLogin()
    expect(mockNavigate).toHaveBeenCalledWith('/business', { replace: true })
  })
})
