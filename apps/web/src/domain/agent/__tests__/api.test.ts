import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../../lib/supabase'
import { getAgentTemplates, getWorkspaceAgentsForUser, getWorkspaceAgentsWithTasksForUser, hireWorkspaceAgent } from '../api'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../../workspace/api', () => ({
  ensureWorkspaceForUser: vi.fn().mockResolvedValue({
    id: 'wm-1',
    workspace_id: 'ws-1',
    user_id: 'user-1',
    membership_role: 'owner',
    status: 'active',
  }),
}))

function createChain({ data = null, error = null }: { data?: any; error?: any } = {}) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  chain.then = (resolve: any, reject?: any) => {
    if (error && reject) return reject(error)
    return resolve({ data, error })
  }
  return chain
}

describe('agent api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads active marketplace templates', async () => {
    const templateLookup = createChain({ data: [{ id: 'tpl-1', name: 'IP Manager' }] })
    vi.mocked(supabase.from).mockReturnValue(templateLookup)

    const result = await getAgentTemplates()

    expect(supabase.from).toHaveBeenCalledWith('agent_templates')
    expect(templateLookup.eq).toHaveBeenCalledWith('status', 'active')
    expect(result[0].name).toBe('IP Manager')
  })

  it('loads workspace agents for a user workspace', async () => {
    const agentLookup = createChain({ data: [{ id: 'wa-1', workspace_id: 'ws-1', name: 'Lisa' }] })
    vi.mocked(supabase.from).mockReturnValue(agentLookup)

    const result = await getWorkspaceAgentsForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(supabase.from).toHaveBeenCalledWith('workspace_agents')
    expect(agentLookup.eq).toHaveBeenCalledWith('workspace_id', 'ws-1')
    expect(result[0].name).toBe('Lisa')
  })

  it('loads workspace agents with tasks', async () => {
    const agentLookup = createChain({ data: [{ id: 'wa-1', tasks: [{ id: 'task-1' }] }] })
    vi.mocked(supabase.from).mockReturnValue(agentLookup)

    const result = await getWorkspaceAgentsWithTasksForUser({
      id: 'user-1',
      username: 'alice',
      handle: '@alice',
      name: 'Alice',
      email: 'alice@example.com',
    } as any)

    expect(supabase.from).toHaveBeenCalledWith('workspace_agents')
    expect(agentLookup.select.mock.calls[0][0]).toContain('tasks:workspace_agent_tasks')
    expect(result[0].tasks).toHaveLength(1)
  })

  it('hires a workspace agent and seeds onboarding task', async () => {
    const insertAgent = createChain({ data: { id: 'wa-1', name: 'Lisa', workspace_id: 'ws-1' } })
    const insertTask = createChain({ data: [] })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertAgent)
      .mockReturnValueOnce(insertTask)

    const result = await hireWorkspaceAgent(
      {
        id: 'user-1',
        username: 'alice',
        handle: '@alice',
        name: 'Alice',
        email: 'alice@example.com',
      } as any,
      {
        id: 'tpl-1',
        template_key: 'ip_manager',
        name: 'IP Manager',
        role: 'IP Manager',
        avatar_img: '/images/agents/lisa.jpg',
        color: 'from-zinc-600 to-zinc-500',
        description: 'Manages IP licensing',
      },
      'Lisa'
    )

    expect(insertAgent.insert).toHaveBeenCalled()
    expect(insertTask.insert).toHaveBeenCalled()
    expect(result.id).toBe('wa-1')
  })
})
