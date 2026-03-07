import { supabase } from '../../lib/supabase'
import type { AgentTemplate, User, WorkspaceAgent, WorkspaceAgentWithTasks, WorkspaceAgentTask } from '../../lib/supabase'
import { ensureWorkspaceForUser } from '../workspace/api'

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
