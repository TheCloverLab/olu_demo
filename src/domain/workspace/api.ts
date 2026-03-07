import { supabase } from '../../lib/supabase'
import type { BusinessModuleKey, RoleApplication, User, Workspace, WorkspaceBilling, WorkspaceIntegration, WorkspaceMembership, WorkspaceModule, WorkspacePermission, WorkspacePolicy, WorkspaceSettingsData } from '../../lib/supabase'

const DEFAULT_WORKSPACE_MODULES: BusinessModuleKey[] = ['creator_ops', 'marketing', 'supply_chain']

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

  const modulesPayload = DEFAULT_WORKSPACE_MODULES.map((moduleKey) => ({
    workspace_id: workspace.id,
    module_key: moduleKey,
    enabled: true,
  }))

  const permissionsPayload = [
    { membership_role: 'owner', resource: 'campaign', action: 'publish', allowed: true },
    { membership_role: 'owner', resource: 'billing', action: 'manage', allowed: true },
    { membership_role: 'owner', resource: 'integration', action: 'manage', allowed: true },
  ].map((permission) => ({
    workspace_id: workspace.id,
    ...permission,
  }))

  const [modulesResult, permissionsResult, integrationsResult, policiesResult, billingResult] = await Promise.all([
    supabase.from('workspace_modules').insert(modulesPayload),
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

  if (modulesResult.error) throw modulesResult.error
  if (permissionsResult.error) throw permissionsResult.error
  if (integrationsResult.error) throw integrationsResult.error
  if (policiesResult.error) throw policiesResult.error
  if (billingResult.error) throw billingResult.error

  return membership as WorkspaceMembership
}

async function getWorkspaceById(workspaceId: string) {
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

export async function getEnabledBusinessModulesForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const modules = await getWorkspaceModules(membership.workspace_id)
  return modules.filter((module) => module.enabled).map((module) => module.module_key)
}

export async function getWorkspaceSettingsForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const [workspace, modules, permissions, integrations, policies, billing] = await Promise.all([
    getWorkspaceById(membership.workspace_id),
    getWorkspaceModules(membership.workspace_id),
    getWorkspacePermissions(membership.workspace_id),
    getWorkspaceIntegrations(membership.workspace_id),
    getWorkspacePolicies(membership.workspace_id),
    getWorkspaceBilling(membership.workspace_id),
  ])

  return {
    workspace,
    membership,
    modules,
    permissions,
    integrations,
    policies,
    billing,
  } as WorkspaceSettingsData
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

export async function getMyRoleApplications() {
  const { data, error } = await supabase
    .from('role_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as RoleApplication[]
}

export async function submitRoleApplication(targetRole: 'creator' | 'advertiser' | 'supplier', reason?: string) {
  const { data, error } = await supabase.functions.invoke('upgrade-role', {
    body: {
      targetRole,
      reason,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.applicationId as string
}
