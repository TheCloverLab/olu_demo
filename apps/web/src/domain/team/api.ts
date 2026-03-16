import { supabase } from '../../lib/supabase'
import type { User, WorkspaceEmployee } from '../../lib/supabase'
import { ensureWorkspaceForUser } from '../workspace/api'
import { listChats, createChat, joinChat } from '../chat/api'

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

// ---------- Group chat ----------

export async function ensureDefaultGroupChat(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>,
) {
  const ws = await ensureWorkspaceForUser(user)
  const groups = await listChats(ws.workspace_id, 'team').catch(() => [])
  if (groups.some((g) => g.config?.chat_key === 'all-members')) return
  const chat = await createChat(ws.workspace_id, 'team', 'All Members', {
    config: {
      chat_key: 'all-members',
      participants: [],
      icons: ['👥'],
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
