import { supabase } from '../../lib/supabase'
import type {
  BusinessModuleKey,
  User,
  UserWallet,
  Workspace,
  WorkspaceBilling,
  WorkspaceConsumerConfig,
  WorkspaceIntegration,
  WorkspaceJoin,
  WorkspaceMembership,
  WorkspaceModule,
  WorkspacePermission,
  WorkspacePolicy,
  WorkspaceSettingsData,
  WorkspaceWallet,
} from '../../lib/supabase'
import type { ConsumerTemplateKey } from '../../apps/consumer/templateConfig'

function buildWorkspaceSlug(user: Pick<User, 'username' | 'handle'>) {
  const raw = (user.username || user.handle || 'workspace').toLowerCase().replace(/^@/, '')
  const safe = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'workspace'
  return `${safe}-workspace`
}

function buildWorkspaceName(user: Pick<User, 'name'>) {
  return `${user.name} Workspace`
}

export async function getWorkspaceMembershipForUser(userId: string) {
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as WorkspaceMembership | null
}

export async function ensureWorkspaceForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const existingMembership = await getWorkspaceMembershipForUser(user.id)
  if (existingMembership) return existingMembership

  const slugBase = buildWorkspaceSlug(user)
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      owner_user_id: user.id,
      name: buildWorkspaceName(user),
      slug: slugBase,
      status: 'active',
    })
    .select('*')
    .single()

  if (workspaceError) throw workspaceError

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_memberships')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      membership_role: 'owner',
      status: 'active',
    })
    .select('*')
    .single()

  if (membershipError) throw membershipError

  const permissionsPayload = [
    { membership_role: 'owner', resource: 'campaign', action: 'publish', allowed: true },
    { membership_role: 'owner', resource: 'billing', action: 'manage', allowed: true },
    { membership_role: 'owner', resource: 'integration', action: 'manage', allowed: true },
  ].map((permission) => ({
    workspace_id: workspace.id,
    ...permission,
  }))

  const [permissionsResult, integrationsResult, policiesResult, billingResult] = await Promise.all([
    supabase.from('workspace_permissions').insert(permissionsPayload),
    supabase.from('workspace_integrations').insert([
      { workspace_id: workspace.id, provider: 'Shopify', status: 'planned', config_json: {} },
      { workspace_id: workspace.id, provider: 'Zendesk', status: 'planned', config_json: {} },
      { workspace_id: workspace.id, provider: 'Mixpanel', status: 'planned', config_json: {} },
    ]),
    supabase.from('workspace_policies').insert({
      workspace_id: workspace.id,
      approval_policy: {
        publish_requires_marketer_approval: true,
        budget_change_review_threshold: 500,
      },
      sandbox_policy: {
        takeover_mode: 'manual',
        high_risk_actions_require_review: true,
      },
      notification_policy: {
        route_creator_approvals_to_workspace: true,
        route_publish_events_to_workspace: true,
      },
    }),
    supabase.from('workspace_billing').insert({
      workspace_id: workspace.id,
      plan: 'starter',
      status: 'trial',
      billing_email: user.email,
    }),
  ])

  if (permissionsResult.error) throw permissionsResult.error
  if (integrationsResult.error) throw integrationsResult.error
  if (policiesResult.error) throw policiesResult.error
  if (billingResult.error) throw billingResult.error

  return membership as WorkspaceMembership
}

export async function getWorkspaceById(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (error) throw error
  return data as Workspace
}

async function getWorkspaceModules(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_modules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspaceModule[]
}

async function getWorkspacePermissions(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_permissions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspacePermission[]
}

async function getWorkspaceIntegrations(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('provider', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspaceIntegration[]
}

async function getWorkspacePolicies(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_policies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return data as WorkspacePolicy | null
}

async function getWorkspaceBilling(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_billing')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return data as WorkspaceBilling | null
}

async function getWorkspaceConsumerConfig(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_consumer_configs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return data as WorkspaceConsumerConfig | null
}

export async function getWorkspaceConsumerConfigForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  return await getWorkspaceConsumerConfig(membership.workspace_id)
}

export async function getEnabledBusinessModulesForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const modules = await getWorkspaceModules(membership.workspace_id)
  return modules.filter((module) => module.enabled).map((module) => module.module_key)
}

export async function getWorkspaceSettingsForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const [workspace, modules, permissions, integrations, policies, billing, consumerConfig] = await Promise.all([
    getWorkspaceById(membership.workspace_id),
    getWorkspaceModules(membership.workspace_id),
    getWorkspacePermissions(membership.workspace_id),
    getWorkspaceIntegrations(membership.workspace_id),
    getWorkspacePolicies(membership.workspace_id),
    getWorkspaceBilling(membership.workspace_id),
    getWorkspaceConsumerConfig(membership.workspace_id),
  ])

  return {
    workspace,
    membership,
    modules,
    permissions,
    integrations,
    policies,
    billing,
    consumerConfig,
  } as WorkspaceSettingsData
}

export async function getConsumerTemplateForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<ConsumerTemplateKey | null> {
  const consumerConfig = await getWorkspaceConsumerConfigForUser(user)
  return (consumerConfig?.template_key as ConsumerTemplateKey) || null
}

export async function updateWorkspaceModuleForUser(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
  moduleKey: BusinessModuleKey,
  enabled: boolean
) {
  const membership = await ensureWorkspaceForUser(user)
  const { data, error } = await supabase
    .from('workspace_modules')
    .update({ enabled })
    .eq('workspace_id', membership.workspace_id)
    .eq('module_key', moduleKey)
    .select('*')
    .single()

  if (error) throw error
  return data as WorkspaceModule
}

export async function updateWorkspaceConsumerTemplateForUser(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
  templateKey: ConsumerTemplateKey
) {
  return updateWorkspaceConsumerConfigForUser(user, {
    template_key: templateKey,
    config_json: {
      featured_template: templateKey,
    },
  })
}

export async function updateWorkspaceConsumerConfigForUser(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
  updates: {
    template_key?: ConsumerTemplateKey
    config_json?: WorkspaceConsumerConfig['config_json']
  }
) {
  const membership = await ensureWorkspaceForUser(user)
  const currentConfig = await getWorkspaceConsumerConfig(membership.workspace_id)
  const nextTemplate = updates.template_key || currentConfig?.template_key || 'fan_community'
  const nextConfigJson = {
    ...(currentConfig?.config_json || {}),
    ...(updates.config_json || {}),
    featured_template: nextTemplate,
  }
  const { data, error } = await supabase
    .from('workspace_consumer_configs')
    .upsert({
      workspace_id: membership.workspace_id,
      template_key: nextTemplate,
      config_json: nextConfigJson,
    }, { onConflict: 'workspace_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as WorkspaceConsumerConfig
}

// ---------- Integration Config ----------

export async function updateWorkspaceIntegrationConfig(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
  provider: string,
  configJson: Record<string, any>,
  status: WorkspaceIntegration['status'] = 'connected'
) {
  const membership = await ensureWorkspaceForUser(user)
  const { data, error } = await supabase
    .from('workspace_integrations')
    .upsert({
      workspace_id: membership.workspace_id,
      provider,
      status,
      config_json: configJson,
    }, { onConflict: 'workspace_id,provider' })
    .select('*')
    .single()

  if (error) throw error
  return data as WorkspaceIntegration
}

// ---------- Workspace Joins (Consumer) ----------

export async function joinWorkspace(userId: string, workspaceId: string): Promise<WorkspaceJoin> {
  const { data, error } = await supabase
    .from('workspace_joins')
    .upsert({ user_id: userId, workspace_id: workspaceId }, { onConflict: 'user_id,workspace_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as WorkspaceJoin
}

export async function leaveWorkspace(userId: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('workspace_joins')
    .delete()
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)

  if (error) throw error
}

export async function getJoinedWorkspaces(userId: string): Promise<(WorkspaceJoin & { workspace: Workspace })[]> {
  const { data, error } = await supabase
    .from('workspace_joins')
    .select('*, workspace:workspaces(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data || []) as (WorkspaceJoin & { workspace: Workspace })[]
}

export type WorkspaceMember = WorkspaceJoin & {
  user: Pick<User, 'id' | 'name' | 'handle' | 'avatar_url'> & { initials?: string; avatar_color?: string }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from('workspace_joins')
    .select('*, user:users!user_id(id, name, handle, avatar_url, initials, avatar_color)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data || []) as WorkspaceMember[]
}

export async function hasJoinedWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('workspace_joins')
    .select('id')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  return !!data
}

// ---------- Discover (public workspaces) ----------

export async function getDiscoverWorkspaces(options?: { query?: string }): Promise<Workspace[]> {
  let q = supabase
    .from('workspaces')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (options?.query) {
    q = q.ilike('name', `%${options.query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data || []) as Workspace[]
}

// ---------- Wallet ----------

export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return null
  return data as UserWallet | null
}

export async function getWorkspaceWalletForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<WorkspaceWallet | null> {
  // Try direct membership lookup first (faster, no INSERT attempt)
  const membership = await getWorkspaceMembershipForUser(user.id)
  if (!membership) return null

  const { data, error } = await supabase
    .from('workspace_wallets')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .maybeSingle()

  if (error) return null
  return data as WorkspaceWallet | null
}

