import { supabase } from '../../lib/supabase'
import type { AgentTemplate, User, WorkspaceAgent, WorkspaceAgentWithTasks, WorkspaceAgentTask, WorkspaceEmployee } from '../../lib/supabase'
import { ensureWorkspaceForUser } from '../workspace/api'
import { listChats, createChat, joinChat } from '../chat/api'
import type { Employee, EmployeeWithTasks, TeamTaskSummary } from './types'

// ---------- Employee adapter (WorkspaceAgent → Employee) ----------

export function toEmployee(agent: WorkspaceAgent): Employee {
  return {
    id: agent.id,
    workspace_id: agent.workspace_id,
    kind: 'ai',
    name: agent.name,
    position: agent.role,
    description: agent.description ?? null,
    avatar_img: agent.avatar_img ?? null,
    color: agent.color ?? null,
    status: agent.status,
    employment_status: 'active',
    template_id: agent.template_id ?? null,
    agent_key: agent.agent_key,
    model_tier: null,
    user_id: null,
    email: null,
    hired_by_user_id: agent.hired_by_user_id ?? null,
    hired_at: agent.hired_at ?? null,
    skills: [],
    salary_label: null,
    last_message: agent.last_message ?? null,
    last_time: agent.last_time ?? null,
    created_at: agent.created_at ?? null,
    updated_at: agent.updated_at ?? null,
  }
}

export function toEmployeeWithTasks(agent: WorkspaceAgentWithTasks): EmployeeWithTasks {
  return {
    ...toEmployee(agent),
    tasks: (agent.tasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      due: task.due,
      progress: task.progress,
    })),
  }
}

// ---------- Agent marketplace ----------

export async function getAgentTemplates() {
  const { data, error } = await supabase
    .from('agent_templates')
    .select('*')
    .eq('status', 'active')
    .order('category', { ascending: true })
    .order('reviews', { ascending: false })

  if (error) throw error
  return (data || []) as AgentTemplate[]
}

// ---------- Workspace agent management ----------

export async function getWorkspaceAgentsForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspaceAgent[]
}

export async function getWorkspaceAgentsWithTasksForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const membership = await ensureWorkspaceForUser(user)
  const { data, error } = await supabase
    .from('workspace_agents')
    .select(`
      *,
      tasks:workspace_agent_tasks (
        id,
        workspace_agent_id,
        task_key,
        title,
        status,
        priority,
        due,
        progress,
        created_at,
        updated_at
      )
    `)
    .eq('workspace_id', membership.workspace_id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspaceAgentWithTasks[]
}

export async function hireWorkspaceAgent(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
  template: Pick<AgentTemplate, 'id' | 'template_key' | 'name' | 'role' | 'avatar_img' | 'color' | 'description'>,
  assignedName?: string,
  runtimeType?: 'langgraph' | 'openclaw',
) {
  const membership = await ensureWorkspaceForUser(user)
  const effectiveName = assignedName?.trim() || template.name

  const { data, error } = await supabase
    .from('workspace_agents')
    .insert({
      workspace_id: membership.workspace_id,
      template_id: template.id,
      hired_by_user_id: user.id,
      agent_key: template.template_key,
      name: effectiveName,
      role: template.role,
      avatar_img: template.avatar_img ?? null,
      color: template.color ?? null,
      status: 'online',
      description: template.description ?? null,
      last_message: `${effectiveName} is live in your workspace.`,
      last_time: 'Just now',
      runtime_type: runtimeType || 'langgraph',
    })
    .select('*')
    .single()

  if (error) throw error

  const tasks: Omit<WorkspaceAgentTask, 'id'>[] = [
    {
      workspace_agent_id: data.id,
      task_key: 'onboarding',
      title: `Review ${template.role.toLowerCase()} playbook`,
      status: 'pending',
      priority: 'medium',
      due: 'Today',
      progress: 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  ]

  const { error: taskError } = await supabase.from('workspace_agent_tasks').insert(tasks)
  if (taskError) throw taskError

  return data as WorkspaceAgent
}

export async function updateAgentModel(agentId: string, model: string | null) {
  const { error } = await supabase
    .from('workspace_agents')
    .update({ model, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  if (error) throw error
}

export async function updateAgentRuntimeType(agentId: string, runtimeType: 'langgraph' | 'openclaw') {
  const { error } = await supabase
    .from('workspace_agents')
    .update({ runtime_type: runtimeType, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  if (error) throw error
}

export async function updateAgentEnabledSkills(agentId: string, skills: string[] | null) {
  const { error } = await supabase
    .from('workspace_agents')
    .update({ enabled_skills: skills, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  if (error) throw error
}

export async function toggleAgentSupport(agentId: string, enabled: boolean) {
  const { error } = await supabase
    .from('workspace_agents')
    .update({ support_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', agentId)
  if (error) throw error
}

export async function getSupportAgents(workspaceId: string): Promise<WorkspaceAgent[]> {
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('support_enabled', true)
  if (error) throw error
  return (data || []) as WorkspaceAgent[]
}

// ---------- HR-model team queries ----------

export async function getWorkspaceEmployeesForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<WorkspaceEmployee[]> {
  const membership = await ensureWorkspaceForUser(user)
  const { data, error } = await supabase
    .from('workspace_employees')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as WorkspaceEmployee[]
}

export async function getWorkspaceEmployeeById(employeeId: string): Promise<WorkspaceEmployee | null> {
  const { data, error } = await supabase
    .from('workspace_employees')
    .select('*')
    .eq('id', employeeId)
    .single()

  if (error) return null
  return data as WorkspaceEmployee
}

export async function getTeamEmployeesForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<EmployeeWithTasks[]> {
  const agents = await getWorkspaceAgentsWithTasksForUser(user)
  return agents.map(toEmployeeWithTasks)
}

// ---------- Team snapshot ----------

export async function getWorkspaceTeamSnapshotForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>) {
  const ws = await ensureWorkspaceForUser(user)
  const [agents, groups, humans] = await Promise.all([
    getWorkspaceAgentsWithTasksForUser(user),
    listChats(ws.workspace_id, 'team').catch(() => []),
    getWorkspaceEmployeesForUser(user).catch(() => [] as WorkspaceEmployee[]),
  ])

  return {
    agents,
    groups,
    humans,
    employees: agents.map(toEmployeeWithTasks),
    taskCount: agents.reduce((acc, agent) => acc + ((agent.tasks || []).filter((task) => task.status !== 'done').length || 0), 0),
  }
}

// ---------- Group chat ----------

export async function ensureDefaultGroupChat(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
) {
  const ws = await ensureWorkspaceForUser(user)
  const groups = await listChats(ws.workspace_id, 'team').catch(() => [])
  if (groups.some((g: any) => g.config?.chat_key === 'all-members')) return
  const agents = await getWorkspaceAgentsForUser(user)
  const icons: string[] = agents.slice(0, 3).map((a: any) => a.avatar_img ? '👤' : '🤖')
  if (icons.length === 0) icons.push('👥')
  const chat = await createChat(ws.workspace_id, 'team', 'All Members', {
    config: {
      chat_key: 'all-members',
      participants: agents.map((a) => a.name),
      icons,
    },
  })
  await joinChat(chat.id, user.id, 'owner')
}

export async function createNewGroupChat(
  userId: string,
  name: string,
  participants: string[],
  icons: string[],
) {
  // Need workspace_id — look up from user's membership
  const { data: wm } = await supabase
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  if (!wm) throw new Error('No workspace found')
  const chat = await createChat(wm.workspace_id, 'team', name, {
    config: {
      chat_key: `group-${Date.now()}`,
      participants,
      icons,
    },
  })
  await joinChat(chat.id, userId, 'owner')
  return chat
}

export function getAgentTaskSummaries(tasks: Array<TeamTaskSummary> | undefined) {
  return tasks || []
}
