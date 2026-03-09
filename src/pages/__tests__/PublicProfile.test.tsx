import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicProfile from '../../apps/consumer/pages/PublicProfile'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerApps from '../../domain/consumer/apps'
import * as ProfileApi from '../../domain/profile/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/apps', () => ({
  getPublicProfileConsumerApps: vi.fn(),
}))

vi.mock('../../domain/profile/api', () => ({
  getProfileById: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })),
    storage: { from: vi.fn(() => ({ upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }) })) },
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
      role: 'creator',
      bio: 'Digital artist & gamer',
      followers: 4200,
      verified: true,
      initials: 'LC',
      avatar_color: 'from-rose-500 to-orange-500',
    } as any)
    vi.mocked(ConsumerApps.getPublicProfileConsumerApps).mockResolvedValue([
      {
        id: 'community:creator-1',
        owner_user_id: 'creator-1',
        app_type: 'community',
        title: 'Luna Chen Community',
        summary: 'Digital artist & gamer',
        price_label: 'Open community',
        href: '/communities/creator-1',
      },
      {
        id: 'academy:course-1',
        owner_user_id: 'creator-1',
        app_type: 'academy',
        title: 'Build a Paid Fan Community',
        summary: 'Turn audience attention into a membership business.',
        price_label: '$129',
        href: '/courses/community-growth',
      },
    ] as any)
  })

  it('shows the creator public profile and open apps', async () => {
    render(
      <MemoryRouter initialEntries={['/people/creator-1']}>
        <Routes>
          <Route path="/people/:id" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Luna Chen')).toBeInTheDocument()
      expect(screen.getByText('Open with Luna Chen')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Community')).toBeInTheDocument()
      expect(screen.getAllByText('Build a Paid Fan Community').length).toBeGreaterThan(0)
    })
  })

  it('does not invent creator apps for a pure consumer', async () => {
    vi.mocked(ProfileApi.getProfileById).mockResolvedValue({
      id: 'fan-1',
      name: 'Alex Park',
      handle: '@alexpark',
      bio: 'Superfan of Luna Chen',
      followers: 89,
      verified: false,
      initials: 'AP',
      avatar_color: 'from-pink-500 to-rose-600',
      role: 'fan',
    } as any)
    vi.mocked(ConsumerApps.getPublicProfileConsumerApps).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/people/fan-1']}>
        <Routes>
          <Route path="/people/:id" element={<PublicProfile />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Alex Park')).toBeInTheDocument()
      expect(screen.getByText('No public communities or academies yet')).toBeInTheDocument()
      expect(screen.queryByText('Alex Park Community')).not.toBeInTheDocument()
      expect(screen.queryByText('Open with Alex Park')).not.toBeInTheDocument()
    })
  })
})
