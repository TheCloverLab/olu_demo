import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoleSwitcher from '../RoleSwitcher'
import * as AppContext from '../../../context/AppContext'

vi.mock('../../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('RoleSwitcher', () => {
  const mockSwitchRole = vi.fn()
  const mockSetShowRoleSwitcher = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: false,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator'],
      currentUser: {},
    })

    const { container } = render(<RoleSwitcher />)
    expect(container.innerHTML).toBe('')
  })

  it('renders role options when open', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Switch Role')).toBeInTheDocument()
    expect(screen.getByText('Creator')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
  })

  it('only shows available roles', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.queryByText('Creator')).not.toBeInTheDocument()
    expect(screen.queryByText('Advertiser')).not.toBeInTheDocument()
  })

  it('calls switchRole when a role card is clicked', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    await userEvent.click(screen.getByText('Creator'))
    expect(mockSwitchRole).toHaveBeenCalledWith('creator')
  })

  it('shows all 4 roles when user has all roles', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'creator',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator', 'advertiser', 'supplier'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Creator')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('Advertiser')).toBeInTheDocument()
    expect(screen.getByText('Supplier')).toBeInTheDocument()
    expect(screen.getByText('You have 4 roles')).toBeInTheDocument()
  })

  it('shows "Add more roles" when only one role', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Add more roles in Settings')).toBeInTheDocument()
  })
})
