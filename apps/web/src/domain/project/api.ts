import { supabase } from '../../lib/supabase'
import type {
  Project,
  ProjectConfig,
  ProjectParticipant,
  ProjectTask,
  ProjectFile,
  ProjectType,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from './types'
import type { Chat } from '../chat/types'

// ── Project CRUD ──────────────────────────────────────────────

export async function listProjects(workspaceId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()
  return data
}

export async function createProject(
  workspaceId: string,
  ownerId: string,
  name: string,
  opts?: {
    description?: string
    type?: ProjectType
    config?: ProjectConfig
  }
): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      owner_id: ownerId,
      name,
      description: opts?.description,
      type: opts?.type || 'short_term',
      config: opts?.config || {},
    })
    .select()
    .single()
  if (error) throw error

  // Add owner as participant
  await supabase.from('project_participants').insert({
    project_id: project.id,
    user_id: ownerId,
    role: 'owner',
    added_by: ownerId,
  })

  // Create default conversation (chat with scope='project')
  const { data: chat, error: chatErr } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspaceId,
      scope: 'project' as const,
      project_id: project.id,
      name: name,
      is_default: true,
    })
    .select()
    .single()

  if (!chatErr && chat) {
    // Add owner to chat
    await supabase.from('chat_members').insert({
      chat_id: chat.id,
      user_id: ownerId,
      role: 'owner',
    })
  }

  return project
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'config'>>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  if (error) throw error
}

// ── Participants ──────────────────────────────────────────────

export async function listParticipants(projectId: string): Promise<ProjectParticipant[]> {
  const { data, error } = await supabase
    .from('project_participants')
    .select('*, user:users(id, name, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function addParticipant(
  projectId: string,
  userId: string,
  addedBy: string
): Promise<ProjectParticipant> {
  const { data, error } = await supabase
    .from('project_participants')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: 'participant',
      added_by: addedBy,
    })
    .select()
    .single()
  if (error) throw error

  // Also add to the default project conversation
  const { data: defaultChat } = await supabase
    .from('chats')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .maybeSingle()

  if (defaultChat) {
    await supabase.from('chat_members').upsert(
      { chat_id: defaultChat.id, user_id: userId, role: 'member' },
      { onConflict: 'chat_id,user_id' }
    )
  }

  return data
}

export async function removeParticipant(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_participants')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}

// ── Project Conversations (chats with scope='project') ────────

export async function listProjectChats(projectId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('project_id', projectId)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getDefaultChat(projectId: string): Promise<Chat | null> {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .maybeSingle()
  return data
}

export async function createProjectChat(
  projectId: string,
  workspaceId: string,
  creatorId: string,
  name: string
): Promise<Chat> {
  const { data: chat, error } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspaceId,
      scope: 'project' as const,
      project_id: projectId,
      name,
      is_default: false,
    })
    .select()
    .single()
  if (error) throw error

  // Add creator to chat
  await supabase.from('chat_members').insert({
    chat_id: chat.id,
    user_id: creatorId,
    role: 'owner',
  })

  return chat
}

// ── Quick Chat (chats with scope='quick') ────────────────────

export async function listQuickChats(workspaceId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('scope', 'quick')
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function createQuickChat(
  workspaceId: string,
  userId: string,
  name?: string
): Promise<Chat> {
  const { data: chat, error } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspaceId,
      scope: 'quick' as const,
      name: name || 'New Chat',
    })
    .select()
    .single()
  if (error) throw error

  await supabase.from('chat_members').insert({
    chat_id: chat.id,
    user_id: userId,
    role: 'owner',
  })

  return chat
}

// ── Tasks ─────────────────────────────────────────────────────

export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTask(
  projectId: string,
  title: string,
  opts?: {
    description?: string
    priority?: TaskPriority
    parent_task_id?: string
    assigned_to?: string
  }
): Promise<ProjectTask> {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: projectId,
      title,
      description: opts?.description,
      priority: opts?.priority || 'medium',
      parent_task_id: opts?.parent_task_id,
      assigned_to: opts?.assigned_to,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<ProjectTask, 'title' | 'description' | 'status' | 'priority' | 'progress' | 'assigned_to'>>
): Promise<ProjectTask> {
  const { data, error } = await supabase
    .from('project_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId)
  if (error) throw error
}

// ── Files ─────────────────────────────────────────────────────

export async function listFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Realtime ──────────────────────────────────────────────────

export function subscribeProjectTasks(
  projectId: string,
  onTask: (task: ProjectTask) => void,
) {
  const channel = supabase
    .channel(`project-tasks-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_tasks',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        onTask(payload.new as ProjectTask)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
