import type { Tables, Json } from './database'

import type { Narrow } from './helpers'

export type BusinessModuleKey = 'creator_ops' | 'marketing' | 'supply_chain'

export type Workspace = Narrow<Tables<'workspaces'>, {
  status: 'active' | 'paused' | 'archived'
}>

export type WorkspaceMembership = Narrow<Tables<'workspace_memberships'>, {
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
  status: 'active' | 'invited' | 'disabled'
}>

export type WorkspaceModule = Narrow<Tables<'workspace_modules'>, {
  module_key: BusinessModuleKey
}>

export type WorkspacePermission = Narrow<Tables<'workspace_permissions'>, {
  membership_role: 'owner' | 'admin' | 'operator' | 'viewer'
}>

export type WorkspaceIntegration = Narrow<Tables<'workspace_integrations'>, {
  status: 'connected' | 'disconnected' | 'planned' | 'error'
}>

export type WorkspacePolicy = Tables<'workspace_policies'>

export type WorkspaceBilling = Narrow<Tables<'workspace_billing'>, {
  status: 'trial' | 'active' | 'past_due' | 'cancelled'
}>

// Override config_json with app-specific shape
export type WorkspaceConsumerConfig = Narrow<Tables<'workspace_consumer_configs'>, {
  config_json: {
    featured_template?: string
    featured_creator_id?: string | null
    featured_course_slug?: string | null
    [key: string]: Json | undefined
  }
}>

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

export type WorkspaceEmployee = Narrow<Tables<'workspace_employees'>, {
  status: 'online' | 'offline' | 'busy'
  employment_status: 'active' | 'paused' | 'offboarded'
}>

export type WorkspaceWallet = Tables<'workspace_wallets'>

export type WorkspaceJoin = Tables<'workspace_joins'>
