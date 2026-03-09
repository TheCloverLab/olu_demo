import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppLanding from '../../apps/consumer/pages/AppLanding'
import * as AppContext from '../../context/AppContext'
import * as ProfileApi from '../../domain/profile/api'
import * as ConsumerData from '../../domain/consumer/data'
import * as Engagement from '../../domain/consumer/engagement'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../domain/profile/api', () => ({
  getProfileById: vi.fn(),
}))

vi.mock('../../domain/consumer/data', () => ({
  getCommunityMembershipTiers: vi.fn(),
  getCommunityPosts: vi.fn(),
  getCommunityProducts: vi.fn(),
}))

vi.mock('../../domain/consumer/engagement', () => ({
  getMembershipStatus: vi.fn(),
  getPurchasedCourseSlugs: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('AppLanding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ProfileApi.getProfileById).mockResolvedValue({
      id: 'creator-1',
      name: 'Luna Chen',
      handle: '@luna',
      bio: 'Community-first creator',
      followers: 4200,
      verified: true,
      initials: 'LC',
      avatar_color: 'from-rose-500 to-orange-500',
    } as any)
    vi.mocked(ConsumerData.getCommunityPosts).mockResolvedValue([
      { id: 'post-1', title: 'Weekly Drop', preview: 'Critique notes', locked: true },
    ] as any)
    vi.mocked(ConsumerData.getCommunityMembershipTiers).mockResolvedValue([
      { id: 'tier-1', name: 'Core', price: 12, description: 'Member circles', subscriber_count: 320 },
    ] as any)
    vi.mocked(ConsumerData.getCommunityProducts).mockResolvedValue([
      { id: 'product-1', name: 'Course Bundle', price: 129 },
    ] as any)
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue(null)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/communities/creator-1']}>
        <Routes>
          <Route path="/communities/:id" element={<AppLanding />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders community app landing copy', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { id: 'user-1' },
      enabledBusinessModules: [],
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Community')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Community')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Join membership/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recent drops/i })).toBeInTheDocument()
    })
  })

  it('renders course app landing copy', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { id: 'user-1' },
      enabledBusinessModules: [],
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Community')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Community')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Join membership/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recent drops/i })).toBeInTheDocument()
    })
  })

  it('shows owner tools entry for the app owner', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { id: 'creator-1' },
      enabledBusinessModules: ['creator_ops'],
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Manage community/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Message host/i })).not.toBeInTheDocument()
    })
  })
})
