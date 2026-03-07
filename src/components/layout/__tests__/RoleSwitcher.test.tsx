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
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
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
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Switch Capability')).toBeInTheDocument()
    expect(screen.getByText('Creator Ops')).toBeInTheDocument()
    expect(screen.getByText('Consumer')).toBeInTheDocument()
  })

  it('only shows available roles', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Consumer')).toBeInTheDocument()
    expect(screen.queryByText('Creator Ops')).not.toBeInTheDocument()
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument()
  })

  it('calls switchRole when a role card is clicked', async () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    await userEvent.click(screen.getByText('Creator Ops'))
    expect(mockSwitchRole).toHaveBeenCalledWith('creator')
  })

  it('shows all 4 roles when user has all roles', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'creator',
      switchRole: mockSwitchRole,
      availableRoles: ['fan', 'creator', 'advertiser', 'supplier'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Creator Ops')).toBeInTheDocument()
    expect(screen.getByText('Consumer')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Supply Chain')).toBeInTheDocument()
    expect(screen.getByText('4 capabilities available in this account')).toBeInTheDocument()
  })

  it('shows workspace-level explanation footer', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      showRoleSwitcher: true,
      setShowRoleSwitcher: mockSetShowRoleSwitcher,
      currentRole: 'fan',
      switchRole: mockSwitchRole,
      availableRoles: ['fan'],
      enabledBusinessModules: ['creator_ops', 'marketing', 'supply_chain'],
      currentUser: {},
    })

    render(<RoleSwitcher />)
    expect(screen.getByText('Modules stay visible at workspace level')).toBeInTheDocument()
  })
})
