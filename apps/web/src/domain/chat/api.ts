import { supabase } from '../../lib/supabase'
import type { Chat, ChatMessage, ChatMember, ChatScope, ChatAttachment } from './types'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

// ── Chat CRUD ─────────────────────────────────────────────────

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle()
  return data
}

export async function getChatByExperience(experienceId: string): Promise<Chat | null> {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('experience_id', experienceId)
    .eq('scope', 'experience')
    .maybeSingle()
  return data
}

export async function getChatByAgent(agentId: string): Promise<Chat | null> {
  const { data } = await supabase
    .from('chats')
    .select('*')
    .eq('agent_id', agentId)
    .eq('scope', 'agent')
    .maybeSingle()
  return data
}

export async function listChats(workspaceId: string, scope?: ChatScope): Promise<Chat[]> {
  let query = supabase
    .from('chats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (scope) query = query.eq('scope', scope)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function listSupportChats(workspaceId: string): Promise<(Chat & { members?: ChatMember[] })[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*, members:chat_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('scope', 'support')
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function createChat(
  workspaceId: string,
  scope: ChatScope,
  name: string,
  opts?: { experienceId?: string; agentId?: string; config?: Record<string, any> }
): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      workspace_id: workspaceId,
      scope,
      name,
      experience_id: opts?.experienceId,
      agent_id: opts?.agentId,
      config: opts?.config || {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function ensureSupportChat(
  workspaceId: string,
  userId: string,
  ownerUserId: string,
): Promise<Chat> {
  // Check if a support chat already exists between these users in this workspace
  const { data: existing } = await supabase
    .from('chats')
    .select('*, members:chat_members(*)')
    .eq('workspace_id', workspaceId)
    .eq('scope', 'support')

  if (existing) {
    for (const chat of existing) {
      const memberIds = (chat.members || []).map((m: ChatMember) => m.user_id)
      if (memberIds.includes(userId) && memberIds.includes(ownerUserId)) {
        return chat
      }
    }
  }

  // Create new support chat
  const chat = await createChat(workspaceId, 'support', 'Support Chat')

  // Add both users
  await supabase.from('chat_members').insert([
    { chat_id: chat.id, user_id: userId, role: 'member' },
    { chat_id: chat.id, user_id: ownerUserId, role: 'owner' },
  ])

  return chat
}

// ── Members ───────────────────────────────────────────────────

export async function getChatMembers(chatId: string): Promise<ChatMember[]> {
  const { data, error } = await supabase
    .from('chat_members')
    .select('*')
    .eq('chat_id', chatId)
  if (error) throw error
  return data || []
}

export async function joinChat(chatId: string, userId: string, role: string = 'member'): Promise<void> {
  await supabase
    .from('chat_members')
    .upsert({ chat_id: chatId, user_id: userId, role }, { onConflict: 'chat_id,user_id' })
}

export async function updateUnread(chatId: string, userId: string, unread: number): Promise<void> {
  await supabase
    .from('chat_members')
    .update({ unread })
    .eq('chat_id', chatId)
    .eq('user_id', userId)
}

// ── Messages ──────────────────────────────────────────────────

export async function getMessages(chatId: string, limit = 200): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderType: 'user' | 'agent' | 'system',
  content: string,
  opts?: {
    senderName?: string
    senderAvatar?: string
    messageType?: 'text' | 'image' | 'file' | 'tool_call' | 'system'
    metadata?: Record<string, any>
  }
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      sender_type: senderType,
      sender_name: opts?.senderName,
      sender_avatar: opts?.senderAvatar,
      message_type: opts?.messageType || 'text',
      content,
      metadata: opts?.metadata || {},
    })
    .select()
    .single()
  if (error) throw error

  // Update chat's last_message
  await supabase
    .from('chats')
    .update({
      last_message: content.slice(0, 200),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)

  return data
}

// ── Realtime ──────────────────────────────────────────────────

export function subscribeChatMessages(
  chatId: string,
  onMessage: (msg: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ── File Upload ───────────────────────────────────────────────

export async function uploadChatImages(
  userId: string,
  chatId: string,
  files: File[]
): Promise<ChatAttachment[]> {
  const attachments: ChatAttachment[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${chatId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file, { contentType: file.type })

    if (error) {
      console.error('Upload failed:', error)
      continue
    }

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(path)

    attachments.push({
      type: 'image',
      url: urlData.publicUrl,
      path,
      mime_type: file.type,
      name: file.name,
      size_bytes: file.size,
    })
  }

  return attachments
}
