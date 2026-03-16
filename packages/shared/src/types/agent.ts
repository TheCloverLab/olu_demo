import type { Tables } from './database'

import type { Narrow } from './helpers'

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
