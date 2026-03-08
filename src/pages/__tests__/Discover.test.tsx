import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Discover from '../../apps/consumer/pages/Discover'
import * as Api from '../../services/api'

vi.mock('../../services/api', () => ({
  getCreatorsForDiscover: vi.fn(),
  getConsumerCoursesForDiscover: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Api.getCreatorsForDiscover).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen', handle: '@luna', bio: 'Membership-first digital artist community' },
      { id: 'creator-2', name: 'Ryu Codes', handle: '@ryu', bio: 'Course launches for indie builders' },
    ] as any)
    vi.mocked(Api.getConsumerCoursesForDiscover).mockResolvedValue([
      {
        id: 'course-1',
        slug: 'community-growth',
        title: 'Build a Paid Fan Community',
        subtitle: 'Turn audience attention into a membership business.',
        instructor: 'Luna Chen',
        price: 129,
        hero: 'from-rose-600 via-fuchsia-600 to-orange-500',
        outcomes: ['Structured lessons', 'Hands-on frameworks', 'Learning progress'],
      },
    ] as any)
  })

  it('renders a mixed discover feed from server data', async () => {
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Find something new.')).toBeInTheDocument()
      expect(screen.getAllByText('Luna Chen Inner Circle').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Luna Chen Academy').length).toBeGreaterThan(0)
      expect(screen.getByText('Recommended for you')).toBeInTheDocument()
      expect(screen.getAllByText('$129').length).toBeGreaterThan(0)
    })
  })

  it('requests server search when the query changes', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await user.type(await screen.findByPlaceholderText(/Search creator, community, academy, or topic/i), 'academy')

    await waitFor(() => {
      expect(Api.getCreatorsForDiscover).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'academy' }))
      expect(Api.getConsumerCoursesForDiscover).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'academy' }))
    })
  })
})
