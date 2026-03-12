import { supabase } from '../../lib/supabase'
import type { AgentTemplate, User, WorkspaceAgent, WorkspaceAgentWithTasks, WorkspaceAgentTask, WorkspaceEmployee } from '../../lib/supabase'
import type { ChatAttachment } from '../../lib/supabase'
import { ensureWorkspaceForUser } from '../workspace/api'
import {
  addConversationMessage,
  addGroupChatMessage,
  getConversations,
  getGroupChatMessages,
  getGroupChatsByUser,
} from './data'
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
  assignedName?: string
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
  const [agents, groups, humans] = await Promise.all([
    getWorkspaceAgentsWithTasksForUser(user),
    getGroupChatsByUser(user.id),
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

export async function getWorkspaceGroupChatsForUser(userId: string) {
  return await getGroupChatsByUser(userId)
}

export async function getWorkspaceGroupMessages(groupChatId: string) {
  return await getGroupChatMessages(groupChatId)
}

export async function postWorkspaceGroupMessage(
  groupChatId: string,
  fromName: string,
  text: string,
  avatar?: string,
  attachments?: ChatAttachment[],
) {
  return await addGroupChatMessage(groupChatId, fromName, text, avatar, attachments)
}

// ---------- Agent conversation ----------

export async function getAgentConversation(agentId: string) {
  return await getConversations(agentId)
}

export async function postAgentConversationMessage(
  agentId: string,
  fromType: 'agent' | 'user',
  text: string,
  time: string,
  attachments?: ChatAttachment[],
) {
  return await addConversationMessage(agentId, fromType, text, time, attachments)
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export async function uploadTeamChatImages(
  userId: string,
  scope: string,
  files: File[],
): Promise<ChatAttachment[]> {
  const uploaded: ChatAttachment[] = []

  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name || `image${ext}`)}`
    const path = `${userId}/${scope}/${fileName}`

    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/png' })

    if (error) throw error

    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path)
    uploaded.push({
      type: 'image',
      url: data.publicUrl,
      path,
      mime_type: file.type || 'image/png',
      name: file.name,
      size_bytes: file.size,
    })
  }

  return uploaded
}

export function getAgentTaskSummaries(tasks: Array<TeamTaskSummary> | undefined) {
  return tasks || []
}
