// ── Unified Chat Types ────────────────────────────────────────

export type ChatScope = 'experience' | 'support' | 'team' | 'agent'
export type SenderType = 'user' | 'agent' | 'system'
export type MessageType = 'text' | 'image' | 'file' | 'tool_call' | 'system'
export type MemberRole = 'owner' | 'admin' | 'member' | 'guest'

export interface Chat {
  id: string
  workspace_id: string
  scope: ChatScope
  name: string | null
  experience_id: string | null
  agent_id: string | null
  config: Record<string, any>
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatMember {
  chat_id: string
  user_id: string
  role: MemberRole
  unread: number
  joined_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  sender_type: SenderType
  sender_name: string | null
  sender_avatar: string | null
  message_type: MessageType
  content: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface ChatAttachment {
  type: 'image' | 'file'
  url: string
  path?: string
  mime_type?: string
  name?: string
  size_bytes?: number
}

// Feature flags per scope
export interface ChatFeatures {
  markdown: boolean
  images: boolean
  files: boolean
  toolCalls: boolean
  reasoning: boolean
  mentions: boolean
  modelSelector: boolean
  aiReply: boolean
  streaming: boolean
}

export const SCOPE_FEATURES: Record<ChatScope, ChatFeatures> = {
  experience: {
    markdown: false,
    images: true,
    files: false,
    toolCalls: false,
    reasoning: false,
    mentions: true,
    modelSelector: false,
    aiReply: false,
    streaming: false,
  },
  support: {
    markdown: true,
    images: true,
    files: false,
    toolCalls: false,
    reasoning: false,
    mentions: true,
    modelSelector: false,
    aiReply: true,
    streaming: false,
  },
  team: {
    markdown: true,
    images: true,
    files: true,
    toolCalls: false,
    reasoning: false,
    mentions: true,
    modelSelector: false,
    aiReply: false,
    streaming: false,
  },
  agent: {
    markdown: true,
    images: true,
    files: true,
    toolCalls: true,
    reasoning: true,
    mentions: false,
    modelSelector: true,
    aiReply: false,
    streaming: true,
  },
}
