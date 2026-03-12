import { supabase } from '../../lib/supabase'
import type {
  WorkspaceProduct,
  WorkspaceProductPlan,
  ConsumerPurchase,
  WorkspaceHomeConfig,
  WorkspaceHomeTab,
} from '../../lib/supabase'

// ── Product CRUD ────────────────────────────────────────────────

export async function listProducts(workspaceId: string): Promise<WorkspaceProduct[]> {
  const { data, error } = await supabase
    .from('workspace_products')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('position')
  if (error) throw error
  return data || []
}

export async function getProduct(productId: string): Promise<WorkspaceProduct | null> {
  const { data, error } = await supabase
    .from('workspace_products')
    .select('*')
    .eq('id', productId)
    .single()
  if (error) return null
  return data
}

export async function createProduct(
  workspaceId: string,
  name: string,
  accessType: 'free' | 'paid',
  description?: string
): Promise<WorkspaceProduct> {
  const { data: maxPos } = await supabase
    .from('workspace_products')
    .select('position')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('workspace_products')
    .insert({
      workspace_id: workspaceId,
      name,
      access_type: accessType,
      description: description || null,
      position,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(
  productId: string,
  updates: Partial<Pick<WorkspaceProduct, 'name' | 'description' | 'access_type' | 'status' | 'position'>>
): Promise<WorkspaceProduct> {
  const { data, error } = await supabase
    .from('workspace_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Plans ───────────────────────────────────────────────────────

export async function listPlans(productId: string): Promise<WorkspaceProductPlan[]> {
  const { data, error } = await supabase
    .from('workspace_product_plans')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'active')
  if (error) throw error
  return data || []
}

export async function createPlan(
  productId: string,
  billingType: 'one_time' | 'recurring',
  price: number,
  interval?: 'week' | 'month' | 'year' | null,
  currency?: string
): Promise<WorkspaceProductPlan> {
  const { data, error } = await supabase
    .from('workspace_product_plans')
    .insert({
      product_id: productId,
      billing_type: billingType,
      price,
      interval: interval || null,
      currency: currency || 'USD',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlan(
  planId: string,
  updates: Partial<Pick<WorkspaceProductPlan, 'price' | 'currency' | 'interval' | 'trial_days' | 'status'>>
): Promise<WorkspaceProductPlan> {
  const { data, error } = await supabase
    .from('workspace_product_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Product ↔ Experience Linking ────────────────────────────────

export async function linkExperienceToProduct(
  productId: string,
  experienceId: string
): Promise<void> {
  const { error } = await supabase
    .from('workspace_product_experiences')
    .upsert({ product_id: productId, experience_id: experienceId })
  if (error) throw error
}

export async function unlinkExperienceFromProduct(
  productId: string,
  experienceId: string
): Promise<void> {
  const { error } = await supabase
    .from('workspace_product_experiences')
    .delete()
    .eq('product_id', productId)
    .eq('experience_id', experienceId)
  if (error) throw error
}

export async function getProductExperienceIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('workspace_product_experiences')
    .select('experience_id')
    .eq('product_id', productId)
  if (error) throw error
  return (data || []).map((row) => row.experience_id)
}

// ── Purchases ───────────────────────────────────────────────────

export async function purchaseProduct(
  userId: string,
  productId: string,
  planId?: string
): Promise<ConsumerPurchase> {
  const { data, error } = await supabase
    .from('consumer_purchases')
    .insert({
      user_id: userId,
      product_id: productId,
      plan_id: planId || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelPurchase(purchaseId: string): Promise<void> {
  const { error } = await supabase
    .from('consumer_purchases')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', purchaseId)
  if (error) throw error
}

export async function getUserPurchases(
  userId: string,
  workspaceId?: string
): Promise<ConsumerPurchase[]> {
  let query = supabase
    .from('consumer_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (workspaceId) {
    // Filter by workspace through products
    const { data: products } = await supabase
      .from('workspace_products')
      .select('id')
      .eq('workspace_id', workspaceId)
    const productIds = (products || []).map((p) => p.id)
    if (productIds.length === 0) return []
    query = query.in('product_id', productIds)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ── Home Config ─────────────────────────────────────────────────

export async function getHomeConfig(workspaceId: string): Promise<WorkspaceHomeConfig | null> {
  const { data, error } = await supabase
    .from('workspace_home_configs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()
  if (error) return null
  return data
}

export async function upsertHomeConfig(
  workspaceId: string,
  updates: { cover?: string | null; headline?: string | null; tabs?: WorkspaceHomeTab[] }
): Promise<WorkspaceHomeConfig> {
  const { data, error } = await supabase
    .from('workspace_home_configs')
    .upsert({
      workspace_id: workspaceId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Product with Plans (convenience) ────────────────────────────

export type ProductWithPlans = WorkspaceProduct & {
  plans: WorkspaceProductPlan[]
  experience_ids: string[]
}

export async function getProductsWithPlans(workspaceId: string): Promise<ProductWithPlans[]> {
  const products = await listProducts(workspaceId)
  return Promise.all(
    products.map(async (product) => {
      const [plans, experienceIds] = await Promise.all([
        listPlans(product.id),
        getProductExperienceIds(product.id),
      ])
      return { ...product, plans, experience_ids: experienceIds }
    })
  )
}
