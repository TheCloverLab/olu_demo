import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../Home'
import * as AppContext from '../../context/AppContext'
import * as api from '../../services/api'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getCreators: vi.fn(),
  getPosts: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockCreators = [
  { id: 'c1', name: 'Luna Chen', handle: '@luna', bio: 'Digital artist', role: 'creator', followers: 5000, avatar_color: 'from-violet-500 to-purple-700', initials: 'LC', verified: true },
  { id: 'c2', name: 'Alex Park', handle: '@alex', bio: 'Gamer', role: 'creator', followers: 3000, avatar_color: 'from-pink-500 to-rose-600', initials: 'AP', verified: false },
  { id: 'user-1', name: 'Current User', handle: '@me', bio: 'Tech creator', role: 'creator', followers: 1500, avatar_color: 'from-sky-500 to-cyan-700', initials: 'CU', verified: false },
]

const mockPosts = [
  { id: 'p1', creator_id: 'c1', title: 'My Latest Art', preview: 'A new piece', type: 'image', likes: 42, comments: 5, tips: 10, locked: false, allow_fan_creation: true, sponsored: false, tags: ['art'], creator: mockCreators[0] },
]

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'fan',
      currentUser: { id: 'user-1' },
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })
    vi.mocked(api.getCreators).mockResolvedValue(mockCreators as any)
    vi.mocked(api.getPosts).mockResolvedValue(mockPosts as any)
  })

  it('renders search bar and filter chips', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Search for creators or topics')).toBeInTheDocument()
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Art')).toBeInTheDocument()
    expect(screen.getByText('Gaming')).toBeInTheDocument()
  })

  it('shows Discover and Following tabs', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Following')).toBeInTheDocument()
  })

  it('loads and displays creators', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getAllByText('Luna Chen').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Alex Park').length).toBeGreaterThan(0)
    })
  })

  it('shows section headings on Discover tab', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Recently visited')).toBeInTheDocument()
      expect(screen.getByText('Creators for you')).toBeInTheDocument()
      expect(screen.getByText('Popular this week')).toBeInTheDocument()
    })
  })

  it('filters discover lists and excludes the current user from recently visited', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Home /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Recently visited')).toBeInTheDocument()
    })

    expect(screen.queryByText('Current User')).not.toBeInTheDocument()

    await user.click(screen.getByText('Music'))

    await waitFor(() => {
      expect(screen.getAllByText('No creators match this filter yet.').length).toBeGreaterThan(0)
      expect(screen.queryByText('Luna Chen')).not.toBeInTheDocument()
      expect(screen.queryByText('Alex Park')).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Gaming'))

    await waitFor(() => {
      expect(screen.getAllByText('Alex Park').length).toBeGreaterThan(0)
      expect(screen.queryByText('Current User')).not.toBeInTheDocument()
    })
  })

  it('switches to Following tab and shows posts', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    await userEvent.click(screen.getByText('Following'))

    await waitFor(() => {
      expect(screen.getByText('My Latest Art')).toBeInTheDocument()
    })
  })

  it('shows empty state when no posts', async () => {
    vi.mocked(api.getPosts).mockResolvedValue([])

    render(<MemoryRouter><Home /></MemoryRouter>)
    await userEvent.click(screen.getByText('Following'))

    await waitFor(() => {
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    vi.mocked(api.getCreators).mockRejectedValue(new Error('Network error'))
    vi.mocked(api.getPosts).mockRejectedValue(new Error('Network error'))

    render(<MemoryRouter><Home /></MemoryRouter>)
    // Should not crash
    await waitFor(() => {
      expect(screen.getByText('Discover')).toBeInTheDocument()
    })
  })

  it('calls API functions on mount', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(api.getCreators).toHaveBeenCalledOnce()
      expect(api.getPosts).toHaveBeenCalledWith(20)
    })
  })
})
