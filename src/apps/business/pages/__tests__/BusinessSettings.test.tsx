import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BusinessSettings from '../BusinessSettings'
import * as AuthContext from '../../../../context/AuthContext'
import * as AppContext from '../../../../context/AppContext'
import * as WorkspaceApi from '../../../../domain/workspace/api'

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../context/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('../../../../domain/workspace/api', () => ({
  getWorkspaceSettingsForUser: vi.fn(),
  updateWorkspaceModuleForUser: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const MOCK_SETTINGS = {
  workspace: { id: 'ws-1', name: 'Alice Workspace', slug: 'alice-workspace', owner_user_id: 'user-1', status: 'active' },
  membership: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
  modules: [
    { id: 'm1', workspace_id: 'ws-1', module_key: 'creator_ops', enabled: true },
    { id: 'm2', workspace_id: 'ws-1', module_key: 'marketing', enabled: true },
  ],
  permissions: [],
  integrations: [],
  policies: {
    id: 'po1',
    workspace_id: 'ws-1',
    approval_policy: { publish_requires_marketer_approval: true, budget_change_review_threshold: 500 },
    sandbox_policy: { takeover_mode: 'manual' },
    notification_policy: { route_publish_events_to_workspace: true },
  },
  billing: { id: 'b1', workspace_id: 'ws-1', plan: 'starter', status: 'trial', billing_email: 'alice@example.com' },
} as any

describe('BusinessSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: () => true,
      enabledBusinessModules: ['creator_ops', 'marketing'],
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
    } as any)
    vi.mocked(WorkspaceApi.getWorkspaceSettingsForUser).mockResolvedValue(MOCK_SETTINGS)
  })

  it('renders modules, billing, notifications, and security sections', async () => {
    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Modules')).toBeInTheDocument()
      expect(screen.getByText('Creator Ops')).toBeInTheDocument()
      expect(screen.getByText('Marketing')).toBeInTheDocument()
      expect(screen.getByText('Supply Chain')).toBeInTheDocument()
      expect(screen.getByText('Billing')).toBeInTheDocument()
      expect(screen.getByText('starter')).toBeInTheDocument()
      expect(screen.getByText('trial')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('On')).toBeInTheDocument()
      expect(screen.getByText('Security')).toBeInTheDocument()
      expect(screen.getByText('owner')).toBeInTheDocument()
      expect(screen.getByText('manual')).toBeInTheDocument()
    })
  })

  it('toggles a workspace module', async () => {
    const user = userEvent.setup()
    const reloadBusinessModules = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: () => true,
      enabledBusinessModules: ['creator_ops', 'marketing'],
      reloadBusinessModules,
    } as any)
    vi.mocked(WorkspaceApi.updateWorkspaceModuleForUser).mockResolvedValue({} as any)

    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await user.click(await screen.findByRole('button', { name: 'Enable' }))

    await waitFor(() => {
      expect(WorkspaceApi.updateWorkspaceModuleForUser).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' }),
        'supply_chain',
        true
      )
      expect(reloadBusinessModules).toHaveBeenCalled()
    })
  })

  it('does not show consumer app config or connectors (moved to dedicated pages)', async () => {
    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Modules')).toBeInTheDocument()
    })

    expect(screen.queryByText('Consumer app')).not.toBeInTheDocument()
    expect(screen.queryByText('Connected platforms')).not.toBeInTheDocument()
    expect(screen.queryByText('Approval policy')).not.toBeInTheDocument()
  })
})
