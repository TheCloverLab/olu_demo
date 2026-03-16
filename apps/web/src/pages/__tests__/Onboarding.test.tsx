import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Onboarding from '../Onboarding'
import * as AuthContext from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/avatar.jpg' } }),
      })),
    },
  },
}))

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', auth_id: 'auth-1', name: 'Test', handle: '@test' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('renders onboarding form', () => {
    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    expect(screen.getByText('Complete your profile')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your_handle')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('pre-fills name and handle from user', () => {
    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Test')
    expect(screen.getByPlaceholderText('your_handle')).toHaveValue('test')
  })

  it('shows error when user session is missing', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '', name: 'Test', handle: '@test' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    await userEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(screen.getByText('User session not found. Please sign in again.')).toBeInTheDocument()
    })
  })

  it('submits profile update on valid form', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    })

    render(<MemoryRouter><Onboarding /></MemoryRouter>)

    await userEvent.clear(screen.getByPlaceholderText('Your name'))
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Luna Chen')
    await userEvent.clear(screen.getByPlaceholderText('your_handle'))
    await userEvent.type(screen.getByPlaceholderText('your_handle'), 'lunachen')

    await userEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Luna Chen',
          handle: '@lunachen',
          onboarding_completed: true,
        })
      )
    })

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  it('shows saving state during submission', async () => {
    const mockEq = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq }),
    } as any)

    render(<MemoryRouter><Onboarding /></MemoryRouter>)
    await userEvent.click(screen.getByText('Continue'))

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })
})
