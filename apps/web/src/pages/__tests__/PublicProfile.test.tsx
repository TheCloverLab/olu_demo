import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicProfile from '../../apps/consumer/pages/PublicProfile'
import * as AuthContext from '../../context/AuthContext'
import * as ProfileApi from '../../domain/profile/api'
import { supabase } from '../../lib/supabase'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/profile/api', () => ({
  getProfileById: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('PublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'viewer-1' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(ProfileApi.getProfileById).mockResolvedValue({
      id: 'creator-1',
      name: 'Luna Chen',
      handle: '@luna',
      bio: 'Digital artist & gamer',
      followers: 4200,
      verified: true,
      initials: 'LC',
      avatar_color: 'from-rose-500 to-orange-500',
    } as any)
  })

  it('shows the creator public profile', async () => {
    render(
      <MemoryRouter initialEntries={['/people/creator-1']}>
        <Routes>
          <Route path="/people/:id" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Luna Chen')).toBeInTheDocument()
      expect(screen.getByText('@luna')).toBeInTheDocument()
      expect(screen.getByText('Digital artist & gamer')).toBeInTheDocument()
    })
  })

  it('shows profile not found for missing user', async () => {
    vi.mocked(ProfileApi.getProfileById).mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/people/missing-1']}>
        <Routes>
          <Route path="/people/:id" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Profile not found.')).toBeInTheDocument()
    })
  })
})
