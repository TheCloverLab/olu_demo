import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Discover from '../../apps/consumer/pages/Discover'
import * as Api from '../../services/api'
import * as ConsumerApi from '../../domain/consumer/api'

vi.mock('../../services/api', () => ({
  getCreators: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
  getCourseLibrarySnapshot: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Api.getCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen', handle: '@luna', bio: 'Membership-first digital artist community' },
      { id: 'creator-2', name: 'Ryu Codes', handle: '@ryu', bio: 'Course launches for indie builders' },
    ] as any)
    vi.mocked(ConsumerApi.getCourseLibrarySnapshot).mockResolvedValue({
      courses: [
        {
          id: 'course-1',
          slug: 'community-growth',
          title: 'Build a Paid Fan Community',
          subtitle: 'Turn audience attention into a membership business.',
          instructor: 'Luna Chen',
          price: 129,
        },
      ],
      featuredCourse: null,
    } as any)
  })

  it('renders recommended apps across community and academy', async () => {
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Recommended apps across OLU')).toBeInTheDocument()
      expect(screen.getAllByText('Luna Chen Inner Circle').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Luna Chen Academy').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Community').length).toBeGreaterThan(0)
      expect(screen.getAllByText('$129').length).toBeGreaterThan(0)
    })
  })

  it('filters app results by search query', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await user.type(await screen.findByPlaceholderText(/Search app/i), 'academy')

    await waitFor(() => {
      expect(screen.queryByText('Luna Chen Inner Circle')).not.toBeInTheDocument()
      expect(screen.getAllByText('Luna Chen Academy').length).toBeGreaterThan(0)
    })
  })
})
