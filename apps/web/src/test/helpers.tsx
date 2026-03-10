import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { AppProvider } from '../context/AppContext'

interface WrapperProps {
  children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    auth_id: 'auth-1',
    username: 'testuser',
    handle: '@testuser',
    email: 'test@example.com',
    name: 'Test User',
    initials: 'TU',
    avatar_color: 'from-blue-500 to-purple-600',
    followers: 0,
    following: 0,
    posts: 0,
    verified: false,
    onboarding_completed: true,
    ...overrides,
  }
}
