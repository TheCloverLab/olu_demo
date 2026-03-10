export type BusinessModuleKey = 'creator_ops' | 'marketing' | 'supply_chain'

export type Workspace = {
  id: string
  owner_user_id: string
  name: string
  slug: string
  status: 'active' | 'paused' | 'archived'
  created_at?: string
  updated_at?: string
}

export type WorkspaceMembership = {
  id: string
  workspace_id: string
  user_id: string
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
  status: 'active' | 'invited' | 'disabled'
  created_at?: string
  updated_at?: string
}

export type WorkspaceModule = {
  id: string
  workspace_id: string
  module_key: BusinessModuleKey
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export type WorkspacePermission = {
  id: string
  workspace_id: string
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
  resource: string
  action: string
  allowed: boolean
  created_at?: string
  updated_at?: string
}

export type WorkspaceIntegration = {
  id: string
  workspace_id: string
  provider: string
  status: 'connected' | 'disconnected' | 'planned' | 'error'
  config_json: Record<string, any>
  last_sync_at?: string | null
  created_at?: string
  updated_at?: string
}

export type WorkspacePolicy = {
  id: string
  workspace_id: string
  approval_policy: Record<string, any>
  sandbox_policy: Record<string, any>
  notification_policy: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type WorkspaceBilling = {
  id: string
  workspace_id: string
  plan: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled'
  billing_email?: string | null
  created_at?: string
  updated_at?: string
}

export type WorkspaceConsumerConfig = {
  id: string
  workspace_id: string
  template_key: 'fan_community' | 'sell_courses'
  config_json: {
    featured_template?: 'fan_community' | 'sell_courses'
    featured_creator_id?: string | null
    featured_course_slug?: string | null
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
}

export type WorkspaceSettingsData = {
  workspace: Workspace
  membership: WorkspaceMembership
  modules: WorkspaceModule[]
  permissions: WorkspacePermission[]
  integrations: WorkspaceIntegration[]
  policies: WorkspacePolicy | null
  billing: WorkspaceBilling | null
  consumerConfig: WorkspaceConsumerConfig | null
}
