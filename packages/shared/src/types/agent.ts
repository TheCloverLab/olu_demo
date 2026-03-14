import type { Tables } from './database'

import type { Narrow } from './helpers'

export type AgentTemplate = Narrow<Tables<'agent_templates'>, {
  category: 'Creator' | 'Advertiser' | 'Supplier' | 'Pro'
  status: 'active' | 'retired'
}>

export type AgentRuntimeType = 'langgraph' | 'openclaw'

export type WorkspaceAgent = Narrow<Tables<'workspace_agents'>, {
  status: 'online' | 'offline' | 'busy'
  // Fields added after last `supabase gen types` refresh
  runtime_type?: AgentRuntimeType | null
  enabled_mcp_servers?: string[] | null
}>

export type WorkspaceAgentTask = Narrow<Tables<'workspace_agent_tasks'>, {
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
}>

export type WorkspaceAgentWithTasks = WorkspaceAgent & {
  tasks?: WorkspaceAgentTask[]
}

export type AIAgent = Narrow<Tables<'ai_agents'>, {
  status: 'online' | 'offline' | 'busy' | null
}>

export type AgentTask = Narrow<Tables<'agent_tasks'>, {
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
}>

/** Conversation message in the UI (not the LangGraph agent_conversations table) */
export type Conversation = {
  id: string
  agent_id: string
  from_type: 'agent' | 'user'
  text: string
  attachments?: ChatAttachment[]
  time: string
  created_at?: string
}

export type ChatAttachment = {
  type: 'image'
  url: string
  path?: string
  mime_type?: string
  name?: string
  size_bytes?: number
}
