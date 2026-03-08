import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppLanding from '../../apps/consumer/pages/AppLanding'
import * as AppContext from '../../context/AppContext'
import * as ServicesApi from '../../services/api'
import * as Engagement from '../../domain/consumer/engagement'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getUserById: vi.fn(),
  getPostsByCreator: vi.fn(),
  getMembershipTiersByCreator: vi.fn(),
  getProductsByCreator: vi.fn(),
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
    vi.mocked(ServicesApi.getUserById).mockResolvedValue({
      id: 'creator-1',
      name: 'Luna Chen',
      handle: '@luna',
      bio: 'Community-first creator',
      followers: 4200,
      verified: true,
      initials: 'LC',
      avatar_color: 'from-rose-500 to-orange-500',
    } as any)
    vi.mocked(ServicesApi.getPostsByCreator).mockResolvedValue([
      { id: 'post-1', title: 'Weekly Drop', preview: 'Critique notes', locked: true },
    ] as any)
    vi.mocked(ServicesApi.getMembershipTiersByCreator).mockResolvedValue([
      { id: 'tier-1', name: 'Core', price: 12, description: 'Member circles', subscriber_count: 320 },
    ] as any)
    vi.mocked(ServicesApi.getProductsByCreator).mockResolvedValue([
      { id: 'product-1', name: 'Course Bundle', price: 129 },
    ] as any)
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue(null)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue([])
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/creator/creator-1']}>
        <Routes>
          <Route path="/creator/:id" element={<AppLanding />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders community app landing copy', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'fan_community',
      currentUser: { id: 'user-1' },
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Community App')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Inner Circle')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Join membership/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recent drops/i })).toBeInTheDocument()
    })
  })

  it('renders course app landing copy', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'sell_courses',
      currentUser: { id: 'user-1' },
    } as any)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Course App')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Academy')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Browse catalog/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Curriculum/i })).toBeInTheDocument()
    })
  })
})
