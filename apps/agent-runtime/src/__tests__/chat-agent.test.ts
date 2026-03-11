import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

vi.mock('../lib/skill-registry.js', () => ({
  getAgentTools: vi.fn(async () => []),
}))

vi.mock('../lib/conversation.js', () => ({
  buildConversationKey: vi.fn(() => 'conversation-key'),
  loadConversationHistory: vi.fn(async () => []),
  saveConversationMessages: vi.fn(async () => {}),
  trimConversationHistory: vi.fn(async () => {}),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

describe('chat agent request payloads', () => {
  it('uses max_completion_tokens for gpt-5 chat models', async () => {
    process.env.MODEL_OPENAI_API_KEY = 'openai-key'

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: 'OK' },
          },
        ],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock as any)

    const { runChatAgent } = await import('../graph/chat-agent.js')
    await runChatAgent({
      workspaceId: 'workspace-id',
      agentId: 'agent-id',
      agentName: 'Probe',
      agentRole: 'QA',
      userMessage: 'Hello',
      modelProvider: 'openai',
      modelOverride: 'gpt-5-chat-latest',
      images: ['data:image/jpeg;base64,abc'],
    })

    const firstCall = (fetchMock.mock.calls as any[])[0]
    expect(firstCall).toBeTruthy()
    const request = firstCall?.[1] as RequestInit | undefined
    const payload = JSON.parse(String(request?.body))

    expect(payload.model).toBe('gpt-5-chat-latest')
    expect(payload.max_completion_tokens).toBe(2048)
    expect(payload.max_tokens).toBeUndefined()
  })
})
