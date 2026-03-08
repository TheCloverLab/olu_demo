import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../../lib/supabase'
import { startBusinessCampaignDemo } from '../api'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../../workspace/api', () => ({
  ensureWorkspaceForUser: vi.fn().mockImplementation(async ({ id }: { id: string }) => ({
    id: `wm-${id}`,
    workspace_id: `ws-${id}`,
    user_id: id,
    membership_role: 'owner',
    status: 'active',
  })),
}))

function createChain({ data = null, error = null }: { data?: any; error?: any } = {}) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
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

describe('campaign api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts a business campaign using workspace agents instead of legacy ai agents', async () => {
    const advertiserAgentLookup = createChain({ data: { id: 'wa-adv-max' } })
    const creatorLookup = createChain({ data: { id: 'creator-1', name: 'Luna Chen' } })
    const creatorAgentLookup = createChain({ data: { id: 'wa-creator-lisa' } })
    const campaignInsert = createChain({ data: { id: 'campaign-1' } })
    const targetInsert = createChain({ data: { id: 'target-1' } })
    const eventInsert = createChain({ data: {} })
    const latestCampaignLookup = createChain({
      data: {
        id: 'campaign-1',
        advertiser_id: 'advertiser-1',
        status: 'sourcing',
      },
    })
    const targetsLookup = createChain({
      data: [{
        id: 'target-1',
        campaign_id: 'campaign-1',
        creator_id: 'creator-1',
        creator: { id: 'creator-1', name: 'Luna Chen', handle: '@luna' },
      }],
    })
    const eventsLookup = createChain({
      data: [{ id: 'event-1', campaign_id: 'campaign-1', title: 'Campaign brief created' }],
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(advertiserAgentLookup)
      .mockReturnValueOnce(creatorLookup)
      .mockReturnValueOnce(creatorAgentLookup)
      .mockReturnValueOnce(campaignInsert)
      .mockReturnValueOnce(targetInsert)
      .mockReturnValueOnce(eventInsert)
      .mockReturnValueOnce(latestCampaignLookup)
      .mockReturnValueOnce(targetsLookup)
      .mockReturnValueOnce(eventsLookup)

    const result = await startBusinessCampaignDemo('advertiser-1', 'creator-1')

    expect(supabase.from).not.toHaveBeenCalledWith('ai_agents')
    expect(supabase.from).toHaveBeenCalledWith('workspace_agents')
    expect(advertiserAgentLookup.eq).toHaveBeenNthCalledWith(1, 'workspace_id', 'ws-advertiser-1')
    expect(advertiserAgentLookup.eq).toHaveBeenNthCalledWith(2, 'agent_key', 'max')
    expect(creatorAgentLookup.eq).toHaveBeenNthCalledWith(1, 'workspace_id', 'ws-creator-1')
    expect(creatorAgentLookup.eq).toHaveBeenNthCalledWith(2, 'agent_key', 'lisa')
    expect(campaignInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
      advertiser_id: 'advertiser-1',
      agent_id: 'wa-adv-max',
    }))
    expect(targetInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
      creator_id: 'creator-1',
      creator_agent_id: 'wa-creator-lisa',
    }))
    expect(result?.campaign.id).toBe('campaign-1')
  })
})
