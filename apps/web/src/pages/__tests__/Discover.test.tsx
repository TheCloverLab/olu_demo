import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Discover from '../../apps/consumer/pages/Discover'
import * as WorkspaceApi from '../../domain/workspace/api'

vi.mock('../../domain/workspace/api', () => ({
  getDiscoverWorkspaces: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(WorkspaceApi.getDiscoverWorkspaces).mockResolvedValue([
      {
        id: 'ws-1',
        name: 'Luna Chen Studio',
        slug: 'luna-chen-studio',
        headline: 'Digital art & community',
        status: 'active',
        owner_user_id: 'creator-1',
      },
      {
        id: 'ws-2',
        name: 'Cooking Academy',
        slug: 'cooking-academy',
        headline: 'Learn to cook',
        status: 'active',
        owner_user_id: 'creator-2',
      },
    ] as any)
  })

  it('renders discover page with workspace cards', async () => {
    render(<MemoryRouter><Discover /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Find something new.')).toBeInTheDocument()
      expect(screen.getByText('Luna Chen Studio')).toBeInTheDocument()
      expect(screen.getByText('Cooking Academy')).toBeInTheDocument()
      expect(screen.getByText('Recommended for you')).toBeInTheDocument()
    })
  })

  it('searches workspaces when query changes', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Discover /></MemoryRouter>)

    const input = await screen.findByPlaceholderText(/Search creator, community, academy, or topic/i)
    await user.type(input, 'academy')

    await waitFor(() => {
      expect(WorkspaceApi.getDiscoverWorkspaces).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: 'academy' })
      )
    })
  })
})
