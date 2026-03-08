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

describe('BusinessSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', username: 'alice', handle: '@alice', name: 'Alice', email: 'alice@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'creator',
      currentUser: { name: 'Alice' },
      availableRoles: ['creator', 'advertiser'],
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerTemplate: 'fan_community',
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })
    vi.mocked(WorkspaceApi.getWorkspaceSettingsForUser).mockResolvedValue({
      workspace: { id: 'ws-1', name: 'Alice Workspace', slug: 'alice-workspace', owner_user_id: 'user-1', status: 'active' },
      membership: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
      modules: [
        { id: 'm1', workspace_id: 'ws-1', module_key: 'creator_ops', enabled: true },
        { id: 'm2', workspace_id: 'ws-1', module_key: 'marketing', enabled: true },
      ],
      permissions: [
        { id: 'p1', workspace_id: 'ws-1', membership_role: 'owner', resource: 'campaign', action: 'publish', allowed: true },
      ],
      integrations: [
        { id: 'i1', workspace_id: 'ws-1', provider: 'Shopify', status: 'connected', config_json: {}, last_sync_at: null },
      ],
      policies: {
        id: 'po1',
        workspace_id: 'ws-1',
        approval_policy: { publish_requires_marketer_approval: true, budget_change_review_threshold: 500 },
        sandbox_policy: { takeover_mode: 'manual' },
        notification_policy: { route_publish_events_to_workspace: true },
      },
      billing: { id: 'b1', workspace_id: 'ws-1', plan: 'starter', status: 'trial', billing_email: 'alice@example.com' },
      consumerConfig: { id: 'cc1', workspace_id: 'ws-1', template_key: 'fan_community', config_json: { featured_template: 'fan_community' } },
    } as any)
  })

  it('renders workspace-backed settings data', async () => {
    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Alice Workspace')).toBeInTheDocument()
      expect(screen.getByText('Shopify')).toBeInTheDocument()
      expect(screen.getByText(/Budget changes above \$500/)).toBeInTheDocument()
      expect(screen.getByText(/Current plan: starter/)).toBeInTheDocument()
    })
  })

  it('updates a workspace capability from settings', async () => {
    const user = userEvent.setup()
    const reloadBusinessModules = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'creator',
      currentUser: { name: 'Alice' },
      availableRoles: ['creator', 'advertiser'],
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerTemplate: 'fan_community',
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules,
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })
    vi.mocked(WorkspaceApi.updateWorkspaceModuleForUser).mockResolvedValue({
      id: 'm3',
      workspace_id: 'ws-1',
      module_key: 'supply_chain',
      enabled: true,
    } as any)

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

  it('switches the consumer template from settings', async () => {
    const user = userEvent.setup()
    const setConsumerTemplate = vi.fn()
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentRole: 'creator',
      currentUser: { name: 'Alice' },
      availableRoles: ['creator', 'advertiser'],
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerTemplate: 'fan_community',
      setConsumerTemplate,
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
      switchRole: vi.fn(),
      showRoleSwitcher: false,
      setShowRoleSwitcher: vi.fn(),
    })

    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await user.click(await screen.findByRole('button', { name: /Sell Courses/i }))

    await waitFor(() => {
      expect(setConsumerTemplate).toHaveBeenCalledWith('sell_courses')
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })
})
