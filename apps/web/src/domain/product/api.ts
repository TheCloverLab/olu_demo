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

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_products')
    .delete()
    .eq('id', productId)
  if (error) throw error
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

export async function deletePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_product_plans')
    .delete()
    .eq('id', planId)
  if (error) throw error
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

export async function getProductsForExperience(experienceId: string): Promise<WorkspaceProduct[]> {
  const { data: links, error: linkErr } = await supabase
    .from('workspace_product_experiences')
    .select('product_id')
    .eq('experience_id', experienceId)
  if (linkErr) throw linkErr
  if (!links || links.length === 0) return []

  const productIds = links.map((l) => l.product_id)
  const { data, error } = await supabase
    .from('workspace_products')
    .select('*')
    .in('id', productIds)
    .eq('status', 'active')
  if (error) throw error
  return (data || []) as WorkspaceProduct[]
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

export type PurchaseWithDetails = ConsumerPurchase & {
  product_name: string
  plan_label: string
  buyer_name: string
  buyer_handle: string
  buyer_avatar_color: string
  buyer_avatar_img?: string
  buyer_initials: string
}

export async function getWorkspacePurchases(workspaceId: string): Promise<PurchaseWithDetails[]> {
  const products = await listProducts(workspaceId)
  if (products.length === 0) return []
  const productIds = products.map((p) => p.id)

  const { data: purchases, error } = await supabase
    .from('consumer_purchases')
    .select('*, buyer:users!user_id(name, handle, avatar_color, initials)')
    .in('product_id', productIds)
    .order('created_at', { ascending: false })
  if (error) throw error

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))
  const plans = await Promise.all(products.map((p) => listPlans(p.id)))
  const planMap = Object.fromEntries(plans.flat().map((pl) => [pl.id, pl]))

  return (purchases || []).map((p: ConsumerPurchase & { buyer?: { name: string; handle: string; avatar_color: string; initials: string } }) => ({
    ...p,
    product_name: productMap[p.product_id]?.name || 'Unknown',
    plan_label: p.plan_id && planMap[p.plan_id] ? `$${planMap[p.plan_id].price}/${planMap[p.plan_id].interval || 'once'}` : 'Free',
    buyer_name: p.buyer?.name || 'Unknown',
    buyer_handle: p.buyer?.handle || '',
    buyer_avatar_color: p.buyer?.avatar_color || 'from-gray-400 to-gray-500',
    buyer_initials: p.buyer?.initials || '??',
  }))
}

// ── Consumer Courses ────────────────────────────────────────────

export async function updateConsumerCourse(
  courseId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('consumer_courses')
    .update(updates)
    .eq('id', courseId)
  if (error) throw error
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
  updates: { cover?: string | null; headline?: string | null; layout?: string | null; tabs?: WorkspaceHomeTab[] }
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

export async function setAiSupportEnabled(workspaceId: string, enabled: boolean) {
  const { error } = await supabase
    .from('workspace_home_configs')
    .upsert({
      workspace_id: workspaceId,
      ai_support_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function getAiSupportEnabled(workspaceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('workspace_home_configs')
    .select('ai_support_enabled')
    .eq('workspace_id', workspaceId)
    .single()
  return data?.ai_support_enabled ?? false
}

export async function setAiSupportModel(workspaceId: string, model: string | null) {
  const { error } = await supabase
    .from('workspace_home_configs')
    .upsert({
      workspace_id: workspaceId,
      ai_support_model: model,
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function getAiSupportModel(workspaceId: string): Promise<string | null> {
  const { data } = await supabase
    .from('workspace_home_configs')
    .select('ai_support_model')
    .eq('workspace_id', workspaceId)
    .single()
  return data?.ai_support_model ?? null
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
