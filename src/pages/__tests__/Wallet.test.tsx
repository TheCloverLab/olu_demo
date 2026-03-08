import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Wallet from '../../apps/consumer/pages/Wallet'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerApi from '../../domain/consumer/api'
import * as Engagement from '../../domain/consumer/engagement'
import * as ServicesApi from '../../services/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
  getCourseLibrarySnapshot: vi.fn(),
}))

vi.mock('../../domain/consumer/engagement', () => ({
  getMembershipStatus: vi.fn(),
  getPurchasedCourseSlugs: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getCreators: vi.fn(),
  getMembershipTiersByCreator: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('Wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any)
    vi.mocked(ServicesApi.getCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen' },
    ] as any)
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue({
      tier_name: 'VIP',
      tier_key: 'vip',
      status: 'active',
    } as any)
    vi.mocked(ServicesApi.getMembershipTiersByCreator).mockResolvedValue([
      { id: 'tier-1', key: 'vip', name: 'VIP', price: 29.99 },
    ] as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [
        {
          id: 'course-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          instructor: 'Luna Chen',
          price: 129,
          sections: [],
        },
      ],
      featuredCourse: null,
    } as any)
    vi.mocked(Engagement.getPurchasedCourseSlugs).mockResolvedValue(['community-growth'])
  })

  it('renders memberships and purchases', async () => {
    render(<MemoryRouter><Wallet /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Payments and purchases')).toBeInTheDocument()
      expect(screen.getByText('Recurring support')).toBeInTheDocument()
      expect(screen.getByText('Academy purchases')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Inner Circle')).toBeInTheDocument()
      expect(screen.getByText('Build a Paid Fan Community')).toBeInTheDocument()
      expect(screen.getByText('$29.99/mo')).toBeInTheDocument()
      expect(screen.getByText('$129')).toBeInTheDocument()
    })
  })
})
