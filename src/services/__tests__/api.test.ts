import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../../lib/supabase'
import {
  getUsers,
  getUserByHandle,
  getUserById,
  getCreators,
  getPosts,
  getPostsByCreator,
  getPostById,
  getAgentsByUser,
  getAgentsWithTasks,
  getAgentTasks,
  getConversations,
  getProductsByCreator,
  getFansByCreator,
  getIPLicensesByCreator,
  getIPInfringementsByCreator,
  getRevenueAnalytics,
  getViewsAnalytics,
  getCampaignsByAdvertiser,
  getMembershipTiersByCreator,
  getMyRoleApplications,
  submitRoleApplication,
} from '../api'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

function mockChain(resolvedData: any = [], resolvedError: any = null) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError })
  // Make the chain thenable for await
  chain.then = (resolve: any, reject?: any) => {
    if (resolvedError && reject) return reject(resolvedError)
    return resolve({ data: resolvedData, error: resolvedError })
  }
  return chain
}

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User queries', () => {
    it('getUsers fetches all users ordered by created_at desc', async () => {
      const users = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]
      const chain = mockChain(users)
      vi.mocked(supabase.from).mockReturnValue(chain)

      const result = await getUsers()
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(users)
    })

    it('getUserByHandle queries by handle', async () => {
      const user = { id: '1', handle: '@alice' }
      const chain = mockChain(user)
      vi.mocked(supabase.from).mockReturnValue(chain)

      const result = await getUserByHandle('@alice')
      expect(chain.eq).toHaveBeenCalledWith('handle', '@alice')
      expect(chain.single).toHaveBeenCalled()
    })

    it('getUserById queries by id', async () => {
      const user = { id: 'user-1' }
      const chain = mockChain(user)
      vi.mocked(supabase.from).mockReturnValue(chain)

      const result = await getUserById('user-1')
      expect(chain.eq).toHaveBeenCalledWith('id', 'user-1')
      expect(chain.single).toHaveBeenCalled()
    })

    it('getCreators fetches creators ordered by followers', async () => {
      const creators = [{ id: '1', role: 'creator', followers: 100 }]
      const chain = mockChain(creators)
      vi.mocked(supabase.from).mockReturnValue(chain)

      const result = await getCreators()
      expect(chain.eq).toHaveBeenCalledWith('role', 'creator')
      expect(chain.order).toHaveBeenCalledWith('followers', { ascending: false })
    })

    it('throws on error', async () => {
      const chain = mockChain(null, { message: 'DB error' })
      vi.mocked(supabase.from).mockReturnValue(chain)

      await expect(getUsers()).rejects.toEqual({ message: 'DB error' })
    })
  })

  describe('Post queries', () => {
    it('getPosts fetches with creator join and limit', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getPosts(10)
      expect(supabase.from).toHaveBeenCalledWith('posts')
      expect(chain.select).toHaveBeenCalled()
      expect(chain.limit).toHaveBeenCalledWith(10)
    })

    it('getPostsByCreator filters by creator_id', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getPostsByCreator('creator-1')
      expect(chain.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    })

    it('getPostById fetches single post with creator join', async () => {
      const chain = mockChain({ id: 'post-1' })
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getPostById('post-1')
      expect(chain.eq).toHaveBeenCalledWith('id', 'post-1')
      expect(chain.single).toHaveBeenCalled()
    })
  })

  describe('AI Agent queries', () => {
    it('getAgentsByUser queries by user_id', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getAgentsByUser('user-1')
      expect(supabase.from).toHaveBeenCalledWith('ai_agents')
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('getAgentsWithTasks includes tasks relation', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getAgentsWithTasks('user-1')
      expect(supabase.from).toHaveBeenCalledWith('ai_agents')
      // Check select includes tasks join
      const selectCall = chain.select.mock.calls[0][0]
      expect(selectCall).toContain('tasks:agent_tasks')
    })

    it('getAgentTasks queries by agent_id', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getAgentTasks('agent-1')
      expect(supabase.from).toHaveBeenCalledWith('agent_tasks')
      expect(chain.eq).toHaveBeenCalledWith('agent_id', 'agent-1')
    })

    it('getConversations queries by agent_id asc', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getConversations('agent-1')
      expect(supabase.from).toHaveBeenCalledWith('conversations')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('Product queries', () => {
    it('getProductsByCreator filters by creator_id', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getProductsByCreator('creator-1')
      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(chain.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    })
  })

  describe('Fan queries', () => {
    it('getFansByCreator orders by total_spend desc', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getFansByCreator('creator-1')
      expect(supabase.from).toHaveBeenCalledWith('fans')
      expect(chain.order).toHaveBeenCalledWith('total_spend', { ascending: false })
    })
  })

  describe('IP Management queries', () => {
    it('getIPLicensesByCreator queries licenses', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getIPLicensesByCreator('creator-1')
      expect(supabase.from).toHaveBeenCalledWith('ip_licenses')
      expect(chain.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    })

    it('getIPInfringementsByCreator queries infringements', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getIPInfringementsByCreator('creator-1')
      expect(supabase.from).toHaveBeenCalledWith('ip_infringements')
      expect(chain.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    })
  })

  describe('Analytics queries', () => {
    it('getRevenueAnalytics queries by user_id asc', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getRevenueAnalytics('user-1')
      expect(supabase.from).toHaveBeenCalledWith('analytics_revenue')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('getViewsAnalytics queries by user_id asc', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getViewsAnalytics('user-1')
      expect(supabase.from).toHaveBeenCalledWith('analytics_views')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('Campaign queries', () => {
    it('getCampaignsByAdvertiser queries by advertiser_id', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getCampaignsByAdvertiser('adv-1')
      expect(supabase.from).toHaveBeenCalledWith('campaigns')
      expect(chain.eq).toHaveBeenCalledWith('advertiser_id', 'adv-1')
    })
  })

  describe('Membership queries', () => {
    it('getMembershipTiersByCreator orders by price asc', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getMembershipTiersByCreator('creator-1')
      expect(supabase.from).toHaveBeenCalledWith('membership_tiers')
      expect(chain.order).toHaveBeenCalledWith('price', { ascending: true })
    })
  })

  describe('Role Applications', () => {
    it('getMyRoleApplications fetches all applications', async () => {
      const chain = mockChain([])
      vi.mocked(supabase.from).mockReturnValue(chain)

      await getMyRoleApplications()
      expect(supabase.from).toHaveBeenCalledWith('role_applications')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('submitRoleApplication invokes edge function', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { applicationId: 'app-1' },
        error: null,
      } as any)

      const result = await submitRoleApplication('creator', 'I create content')
      expect(supabase.functions.invoke).toHaveBeenCalledWith('upgrade-role', {
        body: { targetRole: 'creator', reason: 'I create content' },
      })
      expect(result).toBe('app-1')
    })

    it('submitRoleApplication throws on error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      } as any)

      await expect(submitRoleApplication('creator')).rejects.toEqual({
        message: 'Unauthorized',
      })
    })
  })
})
