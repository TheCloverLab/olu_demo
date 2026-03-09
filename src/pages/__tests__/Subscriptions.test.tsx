import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Subscriptions from '../../apps/consumer/pages/Subscriptions'
import * as AuthContext from '../../context/AuthContext'
import * as ConsumerData from '../../domain/consumer/data'
import * as Engagement from '../../domain/consumer/engagement'
import * as ProfileApi from '../../domain/profile/api'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/consumer/engagement', () => ({
  getMembershipStatus: vi.fn(),
}))

vi.mock('../../domain/profile/api', () => ({
  getPublicCreators: vi.fn(),
}))

vi.mock('../../domain/consumer/data', () => ({
  getCommunityMembershipTiers: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('Subscriptions', () => {
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
    vi.mocked(ProfileApi.getPublicCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen', bio: 'Digital artist & gamer' },
    ] as any)
    vi.mocked(Engagement.getMembershipStatus).mockResolvedValue({
      tier_name: 'VIP',
      tier_key: 'vip',
      status: 'active',
    } as any)
    vi.mocked(ConsumerData.getCommunityMembershipTiers).mockResolvedValue([
      { id: 'tier-1', key: 'vip', name: 'VIP', price: 29.99 },
    ] as any)
  })

  it('renders active memberships', async () => {
    render(<MemoryRouter><Subscriptions /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Your active memberships')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Community')).toBeInTheDocument()
      expect(screen.getByText('VIP')).toBeInTheDocument()
      expect(screen.getByText('$29.99/mo')).toBeInTheDocument()
    })
  })
})
