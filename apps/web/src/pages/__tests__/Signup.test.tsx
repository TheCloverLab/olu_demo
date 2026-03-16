import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../Signup'
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

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  )
}

describe('Signup', () => {
  const mockSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: mockSignUp,
      signOut: vi.fn(),
    })
  })

  it('renders signup form', () => {
    renderSignup()
    expect(screen.getByText('Create your OLU account')).toBeInTheDocument()
    expect(screen.getByText('Create account')).toBeInTheDocument()
  })

  it('calls signUp and navigates on success', async () => {
    mockSignUp.mockResolvedValue({ needsEmailConfirmation: false })
    renderSignup()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await userEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows email confirmation message', async () => {
    mockSignUp.mockResolvedValue({ needsEmailConfirmation: true })
    renderSignup()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await userEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(screen.getByText(/Please verify your email/)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('displays error on failed signup', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already registered'))
    renderSignup()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'existing@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await userEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    let resolveSignUp: (v: any) => void
    mockSignUp.mockReturnValue(new Promise((resolve) => { resolveSignUp = resolve }))
    renderSignup()

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password (min 6 characters)'), 'password123')
    await userEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
    })

    resolveSignUp!({ needsEmailConfirmation: false })
  })

  it('has link to login page', () => {
    renderSignup()
    const link = screen.getByText('Sign in')
    expect(link).toHaveAttribute('href', '/login')
  })
})
