import { supabase } from '../../lib/supabase'
import type {
  AnalyticsRevenue,
  AnalyticsViews,
  Campaign,
  Fan,
  IPLicense,
  IPInfringement,
  Product,
  SupplierCreatorPartnership,
  SupplierProduct,
  User,
} from '../../lib/supabase'

export async function getBusinessCreators() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'creator')
    .order('followers', { ascending: false })

  if (error) throw error
  return (data || []) as User[]
}

export async function getMarketingCampaignsForAdvertiser(advertiserId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Campaign[]
}

export async function getCreatorRevenueAnalytics(creatorId: string) {
  const { data, error } = await supabase
    .from('analytics_revenue')
    .select('*')
    .eq('user_id', creatorId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as AnalyticsRevenue[]
}

export async function getCreatorViewsAnalytics(creatorId: string) {
  const { data, error } = await supabase
    .from('analytics_views')
    .select('*')
    .eq('user_id', creatorId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as AnalyticsViews[]
}

export async function getCreatorCustomers(creatorId: string) {
  const { data, error } = await supabase
    .from('fans')
    .select('*')
    .eq('creator_id', creatorId)
    .order('total_spend', { ascending: false })

  if (error) throw error
  return (data || []) as Fan[]
}

export async function getCreatorLicenses(creatorId: string) {
  const { data, error } = await supabase
    .from('ip_licenses')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []) as IPLicense[]
}

export async function getCreatorInfringements(creatorId: string) {
  const { data, error } = await supabase
    .from('ip_infringements')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []) as IPInfringement[]
}

export async function getCreatorStoreProducts(creatorId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Product[]
}

export async function getSupplierCatalog(supplierId: string) {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('revenue_month', { ascending: false })

  if (error) throw error
  return (data || []) as SupplierProduct[]
}

export async function getSupplierCreatorLinks(supplierId: string) {
  const { data, error } = await supabase
    .from('supplier_creator_partnerships')
    .select(`
      *,
      creator:users!supplier_creator_partnerships_creator_id_fkey (
        id,
        name,
        handle,
        avatar_img,
        avatar_color,
        initials
      )
    `)
    .eq('supplier_id', supplierId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []) as SupplierCreatorPartnership[]
}
