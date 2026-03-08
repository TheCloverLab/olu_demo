import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Discover from '../../apps/consumer/pages/Discover'
import * as AppContext from '../../context/AppContext'
import * as Api from '../../services/api'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getCreators: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AppContext.useApp).mockReturnValue({
      consumerTemplate: 'fan_community',
    } as any)
    vi.mocked(Api.getCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen', handle: '@luna', bio: 'Membership-first digital artist community' },
      { id: 'creator-2', name: 'Ryu Codes', handle: '@ryu', bio: 'Course launches for indie builders' },
    ] as any)
  })

  it('renders discover creators for the current app shape', async () => {
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Discover community apps')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen')).toBeInTheDocument()
      expect(screen.getAllByText('Community app').length).toBeGreaterThan(0)
    })
  })

  it('filters creators by search query', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await user.type(await screen.findByPlaceholderText(/Search creator/i), 'ryu')

    await waitFor(() => {
      expect(screen.queryByText('Luna Chen')).not.toBeInTheDocument()
      expect(screen.getByText('Ryu Codes')).toBeInTheDocument()
    })
  })
})
