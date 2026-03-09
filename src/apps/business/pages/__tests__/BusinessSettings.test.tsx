import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BusinessSettings from '../BusinessSettings'
import * as AuthContext from '../../../../context/AuthContext'
import * as AppContext from '../../../../context/AppContext'
import * as WorkspaceApi from '../../../../domain/workspace/api'
import * as ConsumerData from '../../../../domain/consumer/data'
import * as ProfileApi from '../../../../domain/profile/api'
import * as ConnectorsApi from '../../../../domain/connectors/api'

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

vi.mock('../../../../domain/consumer/data', () => ({
  getPublishedConsumerCourses: vi.fn(),
}))

vi.mock('../../../../domain/profile/api', () => ({
  getPublicCreators: vi.fn(),
}))

vi.mock('../../../../domain/connectors/api', () => ({
  getWorkspaceConnectorSummariesForUser: vi.fn(),
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
      currentUser: { name: 'Alice' },
      hasModule: (key: string) => ['creator_ops', 'marketing'].includes(key),
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerConfig: {},
      consumerTemplate: 'fan_community',
      setConsumerConfig: vi.fn(),
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(ProfileApi.getPublicCreators).mockResolvedValue([
      { id: 'creator-1', name: 'Luna Chen' },
    ] as any)
    vi.mocked(ConsumerData.getPublishedConsumerCourses).mockResolvedValue([
      { id: 'course-1', slug: 'community-growth', title: 'Build a Paid Fan Community' },
    ] as any)
    vi.mocked(ConnectorsApi.getWorkspaceConnectorSummariesForUser).mockResolvedValue([
      { provider: 'Shopify', status: 'connected', label: 'Shopify' },
    ] as any)
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

  it('updates a workspace module from settings', async () => {
    const user = userEvent.setup()
    const reloadBusinessModules = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: (key: string) => ['creator_ops', 'marketing'].includes(key),
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerConfig: {},
      consumerTemplate: 'fan_community',
      setConsumerConfig: vi.fn(),
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules,
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

  it('shows template selector with active indicator', async () => {
    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('Consumer app')).toBeInTheDocument()
      expect(screen.getByText('Community')).toBeInTheDocument()
      expect(screen.getByText('Academy')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('updates featured consumer content selections', async () => {
    const user = userEvent.setup()
    const setConsumerConfig = vi.fn()
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: (key: string) => ['creator_ops', 'marketing'].includes(key),
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerConfig: {},
      consumerTemplate: 'fan_community',
      setConsumerConfig,
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
    })

    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await user.selectOptions(await screen.findByLabelText(/Featured creator/i), 'creator-1')
    await user.selectOptions(await screen.findByLabelText(/Featured course/i), 'community-growth')

    expect(setConsumerConfig).toHaveBeenCalledWith({ featured_creator_id: 'creator-1' })
    expect(setConsumerConfig).toHaveBeenCalledWith({ featured_course_slug: 'community-growth' })
  })

  it('updates consumer copy fields and topic overrides', async () => {
    const user = userEvent.setup()
    const setConsumerConfig = vi.fn()
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: (key: string) => ['creator_ops', 'marketing'].includes(key),
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerConfig: {},
      consumerTemplate: 'fan_community',
      setConsumerConfig,
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
    })

    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await user.type(await screen.findByLabelText(/Community hero title/i), 'Members first')
    await user.type(screen.getByLabelText(/Membership title/i), 'Inner circle')
    await user.click(screen.getByRole('button', { name: /New topic/i }))
    await user.clear(screen.getByLabelText(/Topic name 1/i))
    await user.type(screen.getByLabelText(/Topic name 1/i), 'Office Hours')
    await user.clear(screen.getByLabelText(/Topic members 1/i))
    await user.type(screen.getByLabelText(/Topic members 1/i), '320')
    await user.clear(screen.getByLabelText(/Topic description 1/i))
    await user.type(screen.getByLabelText(/Topic description 1/i), 'Weekly critique')

    expect(setConsumerConfig).toHaveBeenCalledWith({ community_hero_title: 'Members first' })
    expect(setConsumerConfig).toHaveBeenCalledWith({ community_membership_title: 'Inner circle' })
    expect(setConsumerConfig).toHaveBeenLastCalledWith({
      community_topic_entries: [
        {
          id: expect.stringMatching(/^custom-topic-/),
          name: 'Office Hours',
          members: '320',
          description: 'Weekly critique',
        },
      ],
    })
  })

  it('supports reordering and removing configured topics', async () => {
    const user = userEvent.setup()
    const setConsumerConfig = vi.fn()
    vi.mocked(AppContext.useApp).mockReturnValue({
      currentUser: { name: 'Alice' },
      hasModule: (key: string) => ['creator_ops', 'marketing'].includes(key),
      enabledBusinessModules: ['creator_ops', 'marketing'],
      consumerConfig: {
        community_topic_entries: [
          { id: 'topic-1', name: 'Office Hours', members: '320', description: 'Weekly critique' },
          { id: 'topic-2', name: 'Launch Reviews', members: '120', description: 'Shipping feedback' },
        ],
      },
      consumerTemplate: 'fan_community',
      setConsumerConfig,
      setConsumerTemplate: vi.fn(),
      reloadBusinessModules: vi.fn().mockResolvedValue(undefined),
    })
    vi.mocked(WorkspaceApi.getWorkspaceSettingsForUser).mockResolvedValue({
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
      consumerConfig: {
        id: 'cc1',
        workspace_id: 'ws-1',
        template_key: 'fan_community',
        config_json: {
          featured_template: 'fan_community',
          community_topic_entries: [
            { id: 'topic-1', name: 'Office Hours', members: '320', description: 'Weekly critique' },
            { id: 'topic-2', name: 'Launch Reviews', members: '120', description: 'Shipping feedback' },
          ],
        },
      },
    } as any)

    render(<MemoryRouter><BusinessSettings /></MemoryRouter>)

    await user.click((await screen.findAllByRole('button', { name: /^Up$/i }))[1])
    expect(setConsumerConfig).toHaveBeenCalledWith({
      community_topic_entries: [
        { id: 'topic-2', name: 'Launch Reviews', members: '120', description: 'Shipping feedback' },
        { id: 'topic-1', name: 'Office Hours', members: '320', description: 'Weekly critique' },
      ],
    })

    await user.click(screen.getAllByRole('button', { name: /Remove/i })[0])
    expect(setConsumerConfig).toHaveBeenLastCalledWith({
      community_topic_entries: [
        { id: 'topic-1', name: 'Office Hours', members: '320', description: 'Weekly critique' },
      ],
    })
  })
})
