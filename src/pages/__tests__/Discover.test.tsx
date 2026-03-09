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
        title: 'Build a Paid Fan Community',
        owner_name: 'Luna Chen',
        summary: 'Turn audience attention into a membership business.',
        price_label: '$129',
        href: '/courses/community-growth',
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
      expect(screen.getAllByText('Build a Paid Fan Community').length).toBeGreaterThan(0)
      expect(screen.getByText('Recommended for you')).toBeInTheDocument()
      expect(screen.getAllByText('$129').length).toBeGreaterThan(0)
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
