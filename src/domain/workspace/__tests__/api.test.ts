import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../../lib/supabase'
import {
  ensureWorkspaceForUser,
  getConsumerTemplateForUser,
  getEnabledBusinessModulesForUser,
  getWorkspaceSettingsForUser,
  updateWorkspaceConsumerTemplateForUser,
  updateWorkspaceModuleForUser,
} from '../api'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function createChain({ data = null, error = null }: { data?: any; error?: any } = {}) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data, error })
  chain.then = (resolve: any, reject?: any) => {
    if (error && reject) return reject(error)
    return resolve({ data, error })
  }
  return chain
}

describe('workspace api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provisions a default workspace when the user has none', async () => {
    const membershipLookup = createChain({ data: null })
    const workspaceInsert = createChain({ data: { id: 'ws-1' } })
    const membershipInsert = createChain({ data: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' } })
    const modulesInsert = createChain({ data: [] })
    const permissionsInsert = createChain({ data: [] })
    const integrationsInsert = createChain({ data: [] })
    const policiesInsert = createChain({ data: [] })
    const billingInsert = createChain({ data: [] })
    const consumerConfigInsert = createChain({ data: [] })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(workspaceInsert)
      .mockReturnValueOnce(membershipInsert)
      .mockReturnValueOnce(modulesInsert)
      .mockReturnValueOnce(permissionsInsert)
      .mockReturnValueOnce(integrationsInsert)
      .mockReturnValueOnce(policiesInsert)
      .mockReturnValueOnce(billingInsert)
      .mockReturnValueOnce(consumerConfigInsert)

    const result = await ensureWorkspaceForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(supabase.from).toHaveBeenCalledWith('workspaces')
    expect(workspaceInsert.insert).toHaveBeenCalled()
    expect(result.workspace_id).toBe('ws-1')
  })

  it('returns enabled workspace modules for a user', async () => {
    const membershipLookup = createChain({ data: { workspace_id: 'ws-1' } })
    const modulesLookup = createChain({
      data: [
        { module_key: 'creator_ops', enabled: true },
        { module_key: 'marketing', enabled: true },
        { module_key: 'supply_chain', enabled: false },
      ],
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(modulesLookup)

    const result = await getEnabledBusinessModulesForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(result).toEqual(['creator_ops', 'marketing'])
  })

  it('loads workspace settings aggregates', async () => {
    const membershipLookup = createChain({
      data: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
    })
    const workspaceLookup = createChain({ data: { id: 'ws-1', name: 'Alice Workspace', slug: 'alice-workspace', owner_user_id: 'user-1', status: 'active' } })
    const modulesLookup = createChain({ data: [{ id: 'm1', workspace_id: 'ws-1', module_key: 'marketing', enabled: true }] })
    const permissionsLookup = createChain({ data: [{ id: 'p1', workspace_id: 'ws-1', membership_role: 'owner', resource: 'campaign', action: 'publish', allowed: true }] })
    const integrationsLookup = createChain({ data: [{ id: 'i1', workspace_id: 'ws-1', provider: 'Shopify', status: 'connected', config_json: {}, last_sync_at: null }] })
    const policiesLookup = createChain({ data: { id: 'po1', workspace_id: 'ws-1', approval_policy: { publish_requires_marketer_approval: true }, sandbox_policy: { takeover_mode: 'manual' }, notification_policy: { route_publish_events_to_workspace: true } } })
    const billingLookup = createChain({ data: { id: 'b1', workspace_id: 'ws-1', plan: 'starter', status: 'trial', billing_email: 'alice@example.com' } })
    const consumerConfigLookup = createChain({ data: { id: 'cc1', workspace_id: 'ws-1', template_key: 'sell_courses', config_json: { featured_template: 'sell_courses' } } })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(workspaceLookup)
      .mockReturnValueOnce(modulesLookup)
      .mockReturnValueOnce(permissionsLookup)
      .mockReturnValueOnce(integrationsLookup)
      .mockReturnValueOnce(policiesLookup)
      .mockReturnValueOnce(billingLookup)
      .mockReturnValueOnce(consumerConfigLookup)

    const result = await getWorkspaceSettingsForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(result.workspace.name).toBe('Alice Workspace')
    expect(result.modules).toHaveLength(1)
    expect(result.integrations[0].provider).toBe('Shopify')
    expect(result.billing?.plan).toBe('starter')
    expect(result.consumerConfig?.template_key).toBe('sell_courses')
  })

  it('updates a workspace module for the current user', async () => {
    const membershipLookup = createChain({
      data: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
    })
    const moduleUpdate = createChain({
      data: { id: 'm1', workspace_id: 'ws-1', module_key: 'marketing', enabled: false },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(moduleUpdate)

    const result = await updateWorkspaceModuleForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any, 'marketing', false)

    expect(moduleUpdate.update).toHaveBeenCalledWith({ enabled: false })
    expect(result.enabled).toBe(false)
  })

  it('returns the consumer template configured for the workspace', async () => {
    const membershipLookup = createChain({
      data: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
    })
    const consumerConfigLookup = createChain({
      data: { id: 'cc1', workspace_id: 'ws-1', template_key: 'sell_courses', config_json: { featured_template: 'sell_courses' } },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(consumerConfigLookup)

    const result = await getConsumerTemplateForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(result).toBe('sell_courses')
  })

  it('updates workspace consumer template for the current user', async () => {
    const membershipLookup = createChain({
      data: { id: 'wm-1', workspace_id: 'ws-1', user_id: 'user-1', membership_role: 'owner', status: 'active' },
    })
    const currentConfigLookup = createChain({
      data: { id: 'cc1', workspace_id: 'ws-1', template_key: 'fan_community', config_json: { featured_template: 'fan_community' } },
    })
    const consumerConfigUpdate = createChain({
      data: { id: 'cc1', workspace_id: 'ws-1', template_key: 'sell_courses', config_json: { featured_template: 'sell_courses' } },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(membershipLookup)
      .mockReturnValueOnce(currentConfigLookup)
      .mockReturnValueOnce(consumerConfigUpdate)

    const result = await updateWorkspaceConsumerTemplateForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any, 'sell_courses')

    expect(consumerConfigUpdate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: 'ws-1',
        template_key: 'sell_courses',
      }),
      { onConflict: 'workspace_id' }
    )
    expect(result.template_key).toBe('sell_courses')
  })
})
