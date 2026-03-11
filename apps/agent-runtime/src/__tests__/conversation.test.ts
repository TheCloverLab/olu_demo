import { describe, it, expect } from 'vitest'
import { buildConversationKey } from '../lib/conversation.js'

describe('Conversation', () => {
  it('builds correct conversation key', () => {
    const key = buildConversationKey('agent-123', 'chat-456')
    expect(key).toBe('agent-123:chat-456')
  })

  it('handles different source IDs', () => {
    const larkKey = buildConversationKey('agent-1', 'oc_abc123')
    const apiKey = buildConversationKey('agent-1', 'session-xyz')
    expect(larkKey).toBe('agent-1:oc_abc123')
    expect(apiKey).toBe('agent-1:session-xyz')
    expect(larkKey).not.toBe(apiKey)
  })
})
