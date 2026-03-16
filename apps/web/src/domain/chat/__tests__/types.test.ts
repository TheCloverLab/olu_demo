import { describe, it, expect } from 'vitest'
import { SCOPE_FEATURES } from '../types'
import type { ChatScope, ChatFeatures, Chat, ChatMessage, ChatMember, ChatAttachment } from '../types'

describe('SCOPE_FEATURES', () => {
  it('covers all scopes', () => {
    const scopes: ChatScope[] = ['experience', 'support', 'team', 'agent', 'project', 'quick']
    expect(Object.keys(SCOPE_FEATURES).sort()).toEqual(scopes.sort())
  })

  it('agent scope enables advanced features', () => {
    const agent = SCOPE_FEATURES.agent
    expect(agent.toolCalls).toBe(true)
    expect(agent.reasoning).toBe(true)
    expect(agent.modelSelector).toBe(true)
    expect(agent.streaming).toBe(true)
    expect(agent.markdown).toBe(true)
  })

  it('experience scope disables AI features', () => {
    const exp = SCOPE_FEATURES.experience
    expect(exp.toolCalls).toBe(false)
    expect(exp.reasoning).toBe(false)
    expect(exp.modelSelector).toBe(false)
    expect(exp.aiReply).toBe(false)
    expect(exp.streaming).toBe(false)
    expect(exp.markdown).toBe(false)
  })

  it('support scope enables aiReply but not toolCalls', () => {
    const support = SCOPE_FEATURES.support
    expect(support.aiReply).toBe(true)
    expect(support.toolCalls).toBe(false)
    expect(support.markdown).toBe(true)
  })

  it('team scope enables files and markdown but not AI features', () => {
    const team = SCOPE_FEATURES.team
    expect(team.files).toBe(true)
    expect(team.markdown).toBe(true)
    expect(team.mentions).toBe(true)
    expect(team.toolCalls).toBe(false)
    expect(team.modelSelector).toBe(false)
    expect(team.aiReply).toBe(false)
  })

  it('every scope has all ChatFeatures keys', () => {
    const requiredKeys: (keyof ChatFeatures)[] = [
      'markdown', 'images', 'files', 'toolCalls',
      'reasoning', 'mentions', 'modelSelector', 'aiReply', 'streaming',
    ]
    for (const scope of Object.values(SCOPE_FEATURES)) {
      for (const key of requiredKeys) {
        expect(typeof scope[key]).toBe('boolean')
      }
    }
  })
})

describe('Chat types — compile-time checks', () => {
  it('Chat interface has required fields', () => {
    const chat: Chat = {
      id: 'chat-1',
      workspace_id: 'ws-1',
      scope: 'agent',
      name: 'Test Chat',
      experience_id: null,
      agent_id: 'agent-1',
      project_id: null,
      is_default: false,
      config: {},
      last_message: null,
      last_message_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }
    expect(chat.id).toBe('chat-1')
    expect(chat.scope).toBe('agent')
  })

  it('ChatMessage interface has required fields', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      chat_id: 'chat-1',
      sender_id: 'user-1',
      sender_type: 'user',
      sender_name: 'Test User',
      sender_avatar: null,
      message_type: 'text',
      content: 'Hello',
      metadata: {},
      created_at: '2024-01-01',
    }
    expect(msg.sender_type).toBe('user')
    expect(msg.message_type).toBe('text')
  })

  it('ChatMember interface has required fields', () => {
    const member: ChatMember = {
      chat_id: 'chat-1',
      user_id: 'user-1',
      role: 'owner',
      unread: 0,
      joined_at: '2024-01-01',
    }
    expect(member.role).toBe('owner')
  })

  it('ChatAttachment supports image and file types', () => {
    const img: ChatAttachment = { type: 'image', url: 'https://example.com/img.jpg' }
    const file: ChatAttachment = {
      type: 'file',
      url: 'https://example.com/doc.pdf',
      path: 'user-1/chat-1/doc.pdf',
      mime_type: 'application/pdf',
      name: 'doc.pdf',
      size_bytes: 1024,
    }
    expect(img.type).toBe('image')
    expect(file.size_bytes).toBe(1024)
  })
})
