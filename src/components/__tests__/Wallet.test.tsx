import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WalletModal from '../Wallet'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('WalletModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when closed', () => {
    const { container } = render(<WalletModal open={false} onClose={mockOnClose} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders wallet when open', () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)
    expect(screen.getByText('Wallet')).toBeInTheDocument()
    expect(screen.getByText('Manage your earnings')).toBeInTheDocument()
  })

  it('shows total balance', () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
    expect(screen.getByText('$2080.81')).toBeInTheDocument()
  })

  it('shows fiat and stablecoin balances', () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)
    expect(screen.getByText('$1234.56')).toBeInTheDocument()
    expect(screen.getByText('846.25 USDC')).toBeInTheDocument()
  })

  it('navigates to method selection on withdraw click', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))

    expect(screen.getByText('Select withdrawal method')).toBeInTheDocument()
    expect(screen.getByText('Fiat Currency')).toBeInTheDocument()
    expect(screen.getByText('Stablecoin (USDC)')).toBeInTheDocument()
  })

  it('navigates to amount step after selecting method', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))
    await userEvent.click(screen.getByText('Fiat Currency'))

    expect(screen.getByText('Withdraw USD')).toBeInTheDocument()
    expect(screen.getByText(/Available: \$1234.56/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })

  it('shows USDC method details', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))
    await userEvent.click(screen.getByText('Stablecoin (USDC)'))

    expect(screen.getByText('Withdraw USDC')).toBeInTheDocument()
    expect(screen.getByText(/Available: 846.25 USDC/)).toBeInTheDocument()
  })

  it('disables confirm button when no amount entered', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))
    await userEvent.click(screen.getByText('Fiat Currency'))

    expect(screen.getByText('Confirm')).toBeDisabled()
  })

  it('enables confirm button with valid amount', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))
    await userEvent.click(screen.getByText('Fiat Currency'))
    await userEvent.type(screen.getByPlaceholderText('0.00'), '100')

    expect(screen.getByText('Confirm')).not.toBeDisabled()
  })

  it('goes back from method to balance', async () => {
    render(<WalletModal open={true} onClose={mockOnClose} />)

    await userEvent.click(screen.getByText('Withdraw'))
    expect(screen.getByText('Select withdrawal method')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
  })
})
