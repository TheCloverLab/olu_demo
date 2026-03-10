export type AgentTemplate = {
  id: string
  template_key: string
  name: string
  role: string
  avatar_img?: string | null
  color?: string | null
  category: 'Creator' | 'Advertiser' | 'Supplier' | 'Pro'
  pricing_model: string
  price_label: string
  model: string
  cost_per_1k: number
  rating: number
  reviews: number
  description: string
  status: 'active' | 'retired'
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgent = {
  id: string
  workspace_id: string
  template_id?: string | null
  hired_by_user_id?: string | null
  agent_key: string
  name: string
  role: string
  avatar_img?: string | null
  color?: string | null
  status: 'online' | 'offline' | 'busy'
  description?: string | null
  last_message?: string | null
  last_time?: string | null
  hired_at?: string
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgentTask = {
  id: string
  workspace_agent_id: string
  task_key: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due?: string | null
  progress: number
  created_at?: string
  updated_at?: string
}

export type WorkspaceAgentWithTasks = WorkspaceAgent & {
  tasks?: WorkspaceAgentTask[]
}

export type AIAgent = {
  id: string
  user_id: string
  agent_key: string
  name: string
  role: string
  icon?: string
  avatar_img?: string
  color?: string
  status: 'online' | 'offline' | 'busy'
  description?: string
  last_message?: string
  last_time?: string
  created_at?: string
  updated_at?: string
}

export type AgentTask = {
  id: string
  agent_id: string
  task_key: string
  title: string
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due?: string
  progress: number
  created_at?: string
  updated_at?: string
}

export type Conversation = {
  id: string
  agent_id: string
  from_type: 'agent' | 'user'
  text: string
  time: string
  created_at?: string
}
