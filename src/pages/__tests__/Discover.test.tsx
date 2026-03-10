import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Discover from '../../apps/consumer/pages/Discover'
import * as ConsumerApps from '../../domain/consumer/apps'

vi.mock('../../domain/consumer/apps', () => ({
  getDiscoverConsumerAppCards: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ConsumerApps.getDiscoverConsumerAppCards).mockResolvedValue([
      {
        id: 'community:creator-1',
        owner_user_id: 'creator-1',
        app_type: 'community',
        title: 'Luna Chen Community',
        owner_name: 'Luna Chen',
        summary: 'Membership-first digital artist community',
        price_label: 'Membership',
        href: '/communities/creator-1',
        highlights: ['Weekly drops', 'Private topics', 'Live sessions'],
      },
      {
        id: 'academy:course-1',
        owner_user_id: 'creator-1',
        app_type: 'academy',
        title: 'Digital Art Masterclass',
        owner_name: 'Luna Chen',
        summary: 'From sketch to stunning...',
        price_label: '$49',
        href: '/courses/digital-art-masterclass',
        outcomes: ['Structured lessons', 'Hands-on frameworks', 'Learning progress'],
        highlights: ['Structured lessons', 'Hands-on frameworks', 'Learning progress'],
      },
    ] as any)
  })

  it('renders a mixed discover feed from server data', async () => {
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Find something new.')).toBeInTheDocument()
      expect(screen.getAllByText('Luna Chen Community').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Digital Art Masterclass').length).toBeGreaterThan(0)
      expect(screen.getByText('Recommended for you')).toBeInTheDocument()
      expect(screen.getAllByText('$49').length).toBeGreaterThan(0)
    })
  })

  it('requests server search when the query changes', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await user.type(await screen.findByPlaceholderText(/Search creator, community, academy, or topic/i), 'academy')

    await waitFor(() => {
      expect(ConsumerApps.getDiscoverConsumerAppCards).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'academy' }))
    })
  })
})
