import { supabase } from '../../lib/supabase'
import type { AIAgent, AgentTask, ChatAttachment, Conversation } from '../../lib/supabase'

export async function getAgentsByUser(userId: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as AIAgent[]
}

export async function getAgentsWithTasks(userId: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select(`
      *,
      tasks:agent_tasks (
        id,
        title,
        status,
        priority,
        due,
        progress
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as (AIAgent & { tasks?: AgentTask[] })[]
}

export async function getAgentTasks(agentId: string) {
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AgentTask[]
}

export async function getConversations(agentId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Conversation[]
}

export async function addConversationMessage(
  agentId: string,
  fromType: 'agent' | 'user',
  text: string,
  time: string,
  attachments?: ChatAttachment[],
) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      agent_id: agentId,
      from_type: fromType,
      text,
      time,
      attachments: attachments || [],
    })
    .select()
    .single()

  if (error) throw error
  return data as Conversation
}

export async function createGroupChat(
  userId: string,
  chatKey: string,
  name: string,
  participants: string[],
  icons: string[],
) {
  const { data, error } = await supabase
    .from('group_chats')
    .insert({
      user_id: userId,
      chat_key: chatKey,
      name,
      participants,
      icons,
      last_message: null,
      last_time: null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getGroupChatsByUser(userId: string) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getGroupChatMessages(groupChatId: string) {
  const { data, error } = await supabase
    .from('group_chat_messages')
    .select('*')
    .eq('group_chat_id', groupChatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addGroupChatMessage(
  groupChatId: string,
  fromName: string,
  text: string,
  avatar?: string,
  attachments?: ChatAttachment[],
) {
  const { data, error } = await supabase
    .from('group_chat_messages')
    .insert({
      group_chat_id: groupChatId,
      from_name: fromName,
      avatar: avatar ?? null,
      text,
      attachments: attachments || [],
      time: 'Just now',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
