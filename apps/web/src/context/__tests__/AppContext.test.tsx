import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider, useApp } from '../AppContext'
import * as AuthContext from '../AuthContext'
import * as WorkspaceApi from '../../domain/workspace/api'
import * as ConsumerApps from '../../domain/consumer/apps'
import * as ConsumerApi from '../../domain/consumer/api'

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../domain/workspace/api', () => ({
  ensureWorkspaceForUser: vi.fn(),
  getWorkspaceById: vi.fn(),
  getEnabledBusinessModulesForUser: vi.fn(),
  getConsumerTemplateForUser: vi.fn(),
  getWorkspaceConsumerConfigForUser: vi.fn(),
  updateWorkspaceConsumerConfigForUser: vi.fn(),
  updateWorkspaceConsumerTemplateForUser: vi.fn(),
}))

vi.mock('../../domain/consumer/apps', () => ({
  getOwnedConsumerApps: vi.fn(),
  getPrimaryConsumerApp: vi.fn(),
}))

vi.mock('../../domain/consumer/api', () => ({
  getConsumerExperience: vi.fn().mockResolvedValue({
    feed: [],
    courses: [],
    memberships: [],
    gallery: [],
  }),
}))

function TestConsumer() {
  const {
    enabledBusinessModules,
    hasModule,
    consumerTemplate,
    consumerApps,
    primaryConsumerApp,
    reloadBusinessModules,
    setConsumerTemplate,
  } = useApp()
  return (
    <div>
      <span data-testid="modules">{enabledBusinessModules.join(',')}</span>
      <span data-testid="has-creator">{hasModule('creator_ops') ? 'yes' : 'no'}</span>
      <span data-testid="has-marketing">{hasModule('marketing') ? 'yes' : 'no'}</span>
      <span data-testid="template">{consumerTemplate}</span>
      <span data-testid="consumer-apps">{consumerApps.map((app) => app.app_type).join(',')}</span>
      <span data-testid="primary-app">{primaryConsumerApp?.app_type || 'none'}</span>
      <button onClick={() => reloadBusinessModules()}>Reload Modules</button>
      <button onClick={() => setConsumerTemplate('sell_courses')}>Switch to Courses</button>
    </div>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    // Default: workspace api returns modules
    vi.mocked(WorkspaceApi.ensureWorkspaceForUser).mockResolvedValue({
      workspace_id: 'ws-1',
      user_id: '1',
      role: 'owner',
    } as any)
    vi.mocked(WorkspaceApi.getWorkspaceById).mockResolvedValue({
      id: 'ws-1',
      name: 'Test Workspace',
      slug: 'test',
      owner_user_id: '1',
      status: 'active',
    } as any)
    vi.mocked(WorkspaceApi.getEnabledBusinessModulesForUser).mockResolvedValue(['creator_ops', 'marketing', 'supply_chain'])
    vi.mocked(WorkspaceApi.getConsumerTemplateForUser).mockResolvedValue('fan_community')
    vi.mocked(WorkspaceApi.getWorkspaceConsumerConfigForUser).mockResolvedValue({
      id: 'cfg-1',
      workspace_id: 'ws-1',
      template_key: 'fan_community',
      config_json: { featured_template: 'fan_community' },
    } as any)
    vi.mocked(ConsumerApps.getOwnedConsumerApps).mockResolvedValue([
      {
        id: 'community:1',
        owner_user_id: '1',
        app_type: 'community',
        title: 'Creator Community',
        slug: 'creator-community',
        status: 'published',
        visibility: 'public',
        source: 'workspace_config',
      },
    ] as any)
    vi.mocked(ConsumerApps.getPrimaryConsumerApp).mockImplementation((apps) => apps[0] || null)
    vi.mocked(WorkspaceApi.updateWorkspaceConsumerTemplateForUser).mockResolvedValue({
      id: 'cfg-1',
      workspace_id: 'ws-1',
      template_key: 'sell_courses',
      config_json: { featured_template: 'sell_courses' },
    } as any)
    vi.mocked(WorkspaceApi.updateWorkspaceConsumerConfigForUser).mockResolvedValue({
      id: 'cfg-1',
      workspace_id: 'ws-1',
      template_key: 'sell_courses',
      config_json: { featured_template: 'sell_courses' },
    } as any)
  })

  it('defaults to empty modules when no user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('modules')).toHaveTextContent('')
    expect(screen.getByTestId('has-creator')).toHaveTextContent('no')
    expect(screen.getByTestId('template')).toHaveTextContent('')
    expect(screen.getByTestId('consumer-apps')).toHaveTextContent('')
    expect(screen.getByTestId('primary-app')).toHaveTextContent('none')
  })

  it('loads modules for authenticated user', async () => {
    vi.mocked(WorkspaceApi.getEnabledBusinessModulesForUser).mockResolvedValue(['creator_ops', 'marketing'])
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['creator', 'fan'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByTestId('modules')).toHaveTextContent('creator_ops,marketing')
    expect(screen.getByTestId('has-creator')).toHaveTextContent('yes')
    expect(screen.getByTestId('has-marketing')).toHaveTextContent('yes')
  })

  it('hasModule returns false for disabled modules', async () => {
    vi.mocked(WorkspaceApi.getEnabledBusinessModulesForUser).mockResolvedValue(['creator_ops'])
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', roles: ['fan'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByTestId('has-creator')).toHaveTextContent('yes')
    expect(screen.getByTestId('has-marketing')).toHaveTextContent('no')
  })

  it('provides guest user when not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    function GuestCheck() {
      const { currentUser } = useApp()
      return <span data-testid="name">{currentUser.name}</span>
    }

    render(
      <AppProvider>
        <GuestCheck />
      </AppProvider>
    )

    expect(screen.getByTestId('name')).toHaveTextContent('Guest')
  })

  it('throws when useApp is used outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useSession must be used within SessionProvider')
  })

  it('reloads workspace modules on demand', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', handle: '@alice', name: 'Alice', email: 'alice@example.com', roles: ['creator'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(WorkspaceApi.getEnabledBusinessModulesForUser)
      .mockResolvedValueOnce(['creator_ops'])
      .mockResolvedValueOnce(['creator_ops', 'marketing'])

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(screen.getByTestId('modules')).toHaveTextContent('creator_ops')

    await userEvent.click(screen.getByText('Reload Modules'))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(screen.getByTestId('modules')).toHaveTextContent('creator_ops,marketing')
  })

  it('persists consumer template selection', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('template')).toHaveTextContent('')
    await userEvent.click(screen.getByText('Switch to Courses'))
    expect(screen.getByTestId('template')).toHaveTextContent('sell_courses')
    expect(window.localStorage.getItem('olu.consumerTemplate')).toBe('sell_courses')
  })

  it('hydrates consumer template from workspace config for authenticated users', async () => {
    vi.mocked(WorkspaceApi.getConsumerTemplateForUser).mockResolvedValue('sell_courses')
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', handle: '@alice', name: 'Alice', email: 'alice@example.com', roles: ['creator'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByTestId('template')).toHaveTextContent('sell_courses')
  })

  it('hydrates owned consumer apps for authenticated users', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', username: 'maya', handle: '@maya', name: 'Maya', email: 'maya@example.com', roles: ['creator'] } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByTestId('consumer-apps')).toHaveTextContent('community')
    expect(screen.getByTestId('primary-app')).toHaveTextContent('community')
  })
})
