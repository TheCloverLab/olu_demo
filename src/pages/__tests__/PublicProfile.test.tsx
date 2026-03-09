import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicProfile from '../../apps/consumer/pages/PublicProfile'
import * as ServicesApi from '../../services/api'

vi.mock('../../services/api', () => ({
  getUserById: vi.fn(),
  getPublicConsumerAppsForUser: vi.fn(),
}))

describe('PublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ServicesApi.getUserById).mockResolvedValue({
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
    vi.mocked(ServicesApi.getPublicConsumerAppsForUser).mockResolvedValue({
      hasCommunity: true,
      courses: [
        {
          id: 'course-1',
          creator_id: 'creator-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          subtitle: 'Turn audience attention into a membership business.',
          price: 129,
        },
      ],
    } as any)
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
      expect(screen.getByText('Luna Chen Inner Circle')).toBeInTheDocument()
      expect(screen.getAllByText('Build a Paid Fan Community').length).toBeGreaterThan(0)
    })
  })

  it('does not invent creator apps for a pure consumer', async () => {
    vi.mocked(ServicesApi.getUserById).mockResolvedValue({
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
    vi.mocked(ServicesApi.getPublicConsumerAppsForUser).mockResolvedValue({
      hasCommunity: false,
      courses: [],
    } as any)

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
      expect(screen.queryByText('Alex Park Inner Circle')).not.toBeInTheDocument()
      expect(screen.queryByText('Open with Alex Park')).not.toBeInTheDocument()
    })
  })
})
