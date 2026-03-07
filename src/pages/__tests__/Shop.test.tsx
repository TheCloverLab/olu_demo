import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Shop from '../Shop'
import * as AppContext from '../../context/AppContext'

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('Shop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('as Fan (User view)', () => {
    beforeEach(() => {
      vi.mocked(AppContext.useApp).mockReturnValue({
        currentRole: 'fan',
        currentUser: { id: 'user-1' },
        availableRoles: ['fan'],
        switchRole: vi.fn(),
        showRoleSwitcher: false,
        setShowRoleSwitcher: vi.fn(),
      })
    })

    it('renders shop heading with browse description', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('Shop')).toBeInTheDocument()
      expect(screen.getByText('Browse and buy products')).toBeInTheDocument()
    })

    it('shows product cards with Add to Cart buttons', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('Neon City Hoodie')).toBeInTheDocument()
      expect(screen.getByText('Pixel Pin Set')).toBeInTheDocument()
      expect(screen.getAllByText('Add to Cart')).toHaveLength(4)
    })

    it('shows All Products heading', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('All Products')).toBeInTheDocument()
    })

    it('shows low stock badge for items under 20', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      // Chibi Luna Plushie has stock 12
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })
  })

  describe('as Creator', () => {
    beforeEach(() => {
      vi.mocked(AppContext.useApp).mockReturnValue({
        currentRole: 'creator',
        currentUser: { id: 'creator-1' },
        availableRoles: ['fan', 'creator'],
        switchRole: vi.fn(),
        showRoleSwitcher: false,
        setShowRoleSwitcher: vi.fn(),
      })
    })

    it('renders creator shop view with manage description', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('Shop')).toBeInTheDocument()
      expect(screen.getByText('Manage your products')).toBeInTheDocument()
    })

    it('shows stats cards', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('Sold')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('shows Add New Product button', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    it('shows stock info instead of Add to Cart', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument()
      expect(screen.getByText('Stock: 45 units')).toBeInTheDocument()
    })

    it('shows My Products heading', () => {
      render(<MemoryRouter><Shop /></MemoryRouter>)
      expect(screen.getByText('My Products')).toBeInTheDocument()
    })
  })
})
