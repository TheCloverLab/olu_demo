import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../../lib/supabase'
import {
  getBusinessCreators,
  getCreatorCustomers,
  getCreatorInfringements,
  getCreatorLicenses,
  getCreatorRevenueAnalytics,
  getCreatorStoreProducts,
  getCreatorViewsAnalytics,
  getMarketingCampaignsForAdvertiser,
  getSupplierCatalog,
  getSupplierCreatorLinks,
} from '../api'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function createChain({ data = null, error = null }: { data?: any; error?: any } = {}) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: any, reject?: any) => {
    if (error && reject) return reject(error)
    return resolve({ data, error })
  }
  return chain
}

describe('business domain api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads creators for business CRM', async () => {
    const chain = createChain({ data: [{ id: 'creator-1', role: 'creator' }] })
    vi.mocked(supabase.from).mockReturnValue(chain)

    await getBusinessCreators()

    expect(supabase.from).toHaveBeenCalledWith('users')
    expect(chain.eq).toHaveBeenCalledWith('role', 'creator')
  })

  it('loads advertiser campaigns from the marketing dataset', async () => {
    const chain = createChain({ data: [{ id: 'campaign-1', advertiser_id: 'adv-1' }] })
    vi.mocked(supabase.from).mockReturnValue(chain)

    await getMarketingCampaignsForAdvertiser('adv-1')

    expect(supabase.from).toHaveBeenCalledWith('campaigns')
    expect(chain.eq).toHaveBeenCalledWith('advertiser_id', 'adv-1')
  })

  it('loads creator ops datasets from creator-scoped tables', async () => {
    const revenue = createChain({ data: [] })
    const views = createChain({ data: [] })
    const fans = createChain({ data: [] })
    const licenses = createChain({ data: [] })
    const infringements = createChain({ data: [] })
    const products = createChain({ data: [] })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(revenue)
      .mockReturnValueOnce(views)
      .mockReturnValueOnce(fans)
      .mockReturnValueOnce(licenses)
      .mockReturnValueOnce(infringements)
      .mockReturnValueOnce(products)

    await getCreatorRevenueAnalytics('creator-1')
    await getCreatorViewsAnalytics('creator-1')
    await getCreatorCustomers('creator-1')
    await getCreatorLicenses('creator-1')
    await getCreatorInfringements('creator-1')
    await getCreatorStoreProducts('creator-1')

    expect(revenue.eq).toHaveBeenCalledWith('user_id', 'creator-1')
    expect(views.eq).toHaveBeenCalledWith('user_id', 'creator-1')
    expect(fans.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    expect(licenses.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    expect(infringements.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
    expect(products.eq).toHaveBeenCalledWith('creator_id', 'creator-1')
  })

  it('loads supplier catalog and creator links', async () => {
    const products = createChain({ data: [] })
    const links = createChain({ data: [] })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(products)
      .mockReturnValueOnce(links)

    await getSupplierCatalog('supplier-1')
    await getSupplierCreatorLinks('supplier-1')

    expect(supabase.from).toHaveBeenNthCalledWith(1, 'supplier_products')
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'supplier_creator_partnerships')
    expect(products.eq).toHaveBeenCalledWith('supplier_id', 'supplier-1')
    expect(links.eq).toHaveBeenCalledWith('supplier_id', 'supplier-1')
  })
})
