/**
 * Conversation History — Multi-turn conversation memory
 *
 * Stores conversation messages in Supabase for continuity across chat sessions.
 * Each agent + chat source (Lark chat, API call) has its own conversation thread.
 * Automatically trims old messages to stay within token limits.
 */

import { supabase } from './supabase.js'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
  name?: string
}

/**
 * Build a conversation key from agent + source context.
 * For Lark: agentId + chatId
 * For API: agentId + explicit sessionId
 */
export function buildConversationKey(agentId: string, sourceId: string): string {
  return `${agentId}:${sourceId}`
}

/**
 * Load recent conversation history for a given conversation key.
 * Returns messages in chronological order, most recent last.
 */
export async function loadConversationHistory(
  conversationKey: string,
  limit = 20,
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('role, content, tool_calls, tool_call_id, name')
    .eq('conversation_key', conversationKey)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []

  // Reverse to chronological order
  return data.reverse().map((row) => {
    const msg: ConversationMessage = {
      role: row.role,
      content: row.content,
    }
    if (row.tool_calls) msg.tool_calls = row.tool_calls
    if (row.tool_call_id) msg.tool_call_id = row.tool_call_id
    if (row.name) msg.name = row.name
    return msg
  })
}

/**
 * Save messages to conversation history.
 */
export async function saveConversationMessages(
  conversationKey: string,
  messages: ConversationMessage[],
): Promise<void> {
  if (!messages.length) return

  const rows = messages.map((msg) => ({
    conversation_key: conversationKey,
    role: msg.role,
    content: msg.content,
    tool_calls: msg.tool_calls || null,
    tool_call_id: msg.tool_call_id || null,
    name: msg.name || null,
  }))

  const { error } = await supabase
    .from('agent_conversations')
    .insert(rows)

  if (error) {
    console.error('[conversation] Failed to save messages:', error.message)
  }
}

/**
 * Trim conversation history to keep only the most recent N messages.
 * Older messages beyond the limit are deleted.
 */
export async function trimConversationHistory(
  conversationKey: string,
  keepCount = 40,
): Promise<void> {
  // Get the oldest message we want to keep
  const { data } = await supabase
    .from('agent_conversations')
    .select('id, created_at')
    .eq('conversation_key', conversationKey)
    .order('created_at', { ascending: false })
    .range(keepCount, keepCount)

  if (!data?.length) return

  // Delete everything older than that
  const cutoff = data[0].created_at
  await supabase
    .from('agent_conversations')
    .delete()
    .eq('conversation_key', conversationKey)
    .lt('created_at', cutoff)
}
