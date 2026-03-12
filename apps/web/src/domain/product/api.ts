import { supabase } from '../../lib/supabase'
import type {
  WorkspaceProduct,
  WorkspaceProductPlan,
  ConsumerPurchase,
  WorkspaceHomeConfig,
  WorkspaceHomeTab,
} from '../../lib/supabase'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_PRODUCTS: WorkspaceProduct[] = [
  { id: 'prod-1', workspace_id: 'ws-demo', name: 'Free Community', description: 'Access to public forums and content', access_type: 'free', status: 'active', position: 0, created_at: '', updated_at: '' },
  { id: 'prod-2', workspace_id: 'ws-demo', name: 'Pro Membership', description: 'Unlock all courses, VIP chat, and exclusive content', access_type: 'paid', status: 'active', position: 1, created_at: '', updated_at: '' },
  { id: 'prod-3', workspace_id: 'ws-demo', name: 'Animation Bundle', description: 'Animation Fundamentals course + exclusive assets pack', access_type: 'paid', status: 'active', position: 2, created_at: '', updated_at: '' },
]

const DEMO_PLANS: WorkspaceProductPlan[] = [
  { id: 'plan-1', product_id: 'prod-2', billing_type: 'recurring', price: 9.99, currency: 'USD', interval: 'month', trial_days: 7, status: 'active', created_at: '', updated_at: '' },
  { id: 'plan-2', product_id: 'prod-2', billing_type: 'recurring', price: 89.99, currency: 'USD', interval: 'year', trial_days: 0, status: 'active', created_at: '', updated_at: '' },
  { id: 'plan-3', product_id: 'prod-3', billing_type: 'one_time', price: 49.99, currency: 'USD', interval: null, trial_days: 0, status: 'active', created_at: '', updated_at: '' },
]

const DEMO_PURCHASES: ConsumerPurchase[] = [
  { id: 'purch-1', user_id: 'u2', product_id: 'prod-2', plan_id: 'plan-1', status: 'active', started_at: '2026-02-15T00:00:00Z', expires_at: null, created_at: '2026-02-15T00:00:00Z', updated_at: '' },
  { id: 'purch-2', user_id: 'u3', product_id: 'prod-2', plan_id: 'plan-2', status: 'active', started_at: '2026-01-10T00:00:00Z', expires_at: null, created_at: '2026-01-10T00:00:00Z', updated_at: '' },
  { id: 'purch-3', user_id: 'u4', product_id: 'prod-1', plan_id: null, status: 'active', started_at: '2026-03-01T00:00:00Z', expires_at: null, created_at: '2026-03-01T00:00:00Z', updated_at: '' },
  { id: 'purch-4', user_id: 'u5', product_id: 'prod-3', plan_id: 'plan-3', status: 'active', started_at: '2026-02-20T00:00:00Z', expires_at: null, created_at: '2026-02-20T00:00:00Z', updated_at: '' },
  { id: 'purch-5', user_id: 'u6', product_id: 'prod-2', plan_id: 'plan-1', status: 'active', started_at: '2026-03-05T00:00:00Z', expires_at: null, created_at: '2026-03-05T00:00:00Z', updated_at: '' },
  { id: 'purch-6', user_id: 'u7', product_id: 'prod-1', plan_id: null, status: 'active', started_at: '2026-02-28T00:00:00Z', expires_at: null, created_at: '2026-02-28T00:00:00Z', updated_at: '' },
]

const DEMO_HOME_CONFIG: WorkspaceHomeConfig = {
  workspace_id: 'ws-demo',
  cover: '/images/covers/lunachen.jpg',
  headline: 'Welcome to the Pixel Realm — where art meets community',
  tabs: [
    { key: 'community', label: 'Community', display_mode: 'tile', experience_ids: ['exp-1', 'exp-4', 'exp-7'] },
    { key: 'learn', label: 'Learn', display_mode: 'featured', experience_ids: ['exp-2', 'exp-6'] },
    { key: 'connect', label: 'Connect', display_mode: 'list', experience_ids: ['exp-3', 'exp-5'] },
  ],
  created_at: '',
  updated_at: '',
}

const DEMO_PRODUCT_EXPERIENCE_MAP: Record<string, string[]> = {
  'prod-1': ['exp-1', 'exp-4', 'exp-7'],
  'prod-2': ['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-7'],
  'prod-3': ['exp-6'],
}

// ── Product CRUD ────────────────────────────────────────────────

export async function listProducts(workspaceId: string): Promise<WorkspaceProduct[]> {
  if (IS_DEMO) return DEMO_PRODUCTS
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
  if (IS_DEMO) return DEMO_PRODUCTS.find((p) => p.id === productId) || null
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
  if (IS_DEMO) return DEMO_PLANS.filter((p) => p.product_id === productId)
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
  if (IS_DEMO) return DEMO_PRODUCT_EXPERIENCE_MAP[productId] || []
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
  if (IS_DEMO) return DEMO_PURCHASES.filter((p) => p.user_id === userId)
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
  buyer_initials: string
}

export async function getWorkspacePurchases(workspaceId: string): Promise<PurchaseWithDetails[]> {
  if (IS_DEMO) {
    const names: Record<string, { name: string; handle: string; color: string; initials: string }> = {
      u2: { name: 'Alex Park', handle: '@alexpark', color: 'from-pink-500 to-rose-600', initials: 'AP' },
      u3: { name: 'Jordan Lee', handle: '@jordanlee', color: 'from-blue-500 to-blue-700', initials: 'JL' },
      u4: { name: 'Mia Zhang', handle: '@miazhang', color: 'from-violet-500 to-purple-600', initials: 'MZ' },
      u5: { name: 'Sofia Martinez', handle: '@sofiamartinez', color: 'from-rose-500 to-pink-600', initials: 'SM' },
      u6: { name: 'Emma Wilson', handle: '@emmawilson', color: 'from-sky-500 to-blue-600', initials: 'EW' },
      u7: { name: 'Nina Patel', handle: '@ninapatel', color: 'from-yellow-500 to-amber-600', initials: 'NP' },
    }
    return DEMO_PURCHASES.map((p) => {
      const product = DEMO_PRODUCTS.find((pr) => pr.id === p.product_id)
      const plan = DEMO_PLANS.find((pl) => pl.id === p.plan_id)
      const buyer = names[p.user_id] || { name: 'Unknown', handle: '@unknown', color: 'from-gray-400 to-gray-500', initials: '??' }
      return {
        ...p,
        product_name: product?.name || 'Unknown',
        plan_label: plan ? `$${plan.price}/${plan.interval || 'once'}` : 'Free',
        buyer_name: buyer.name,
        buyer_handle: buyer.handle,
        buyer_avatar_color: buyer.color,
        buyer_initials: buyer.initials,
      }
    })
  }

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

  return (purchases || []).map((p: any) => ({
    ...p,
    product_name: productMap[p.product_id]?.name || 'Unknown',
    plan_label: p.plan_id && planMap[p.plan_id] ? `$${planMap[p.plan_id].price}/${planMap[p.plan_id].interval || 'once'}` : 'Free',
    buyer_name: p.buyer?.name || 'Unknown',
    buyer_handle: p.buyer?.handle || '',
    buyer_avatar_color: p.buyer?.avatar_color || 'from-gray-400 to-gray-500',
    buyer_initials: p.buyer?.initials || '??',
  }))
}

// ── Home Config ─────────────────────────────────────────────────

export async function getHomeConfig(workspaceId: string): Promise<WorkspaceHomeConfig | null> {
  if (IS_DEMO) return DEMO_HOME_CONFIG
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
