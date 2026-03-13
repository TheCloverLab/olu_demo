import { describe, it, expect } from 'vitest'
import type {
  ChatRequest,
  ChatResponse,
  ToolCallResult,
  ModelOption,
  ModelsResponse,
} from '../types/agent-runtime'

describe('Shared agent-runtime types — compile-time contract tests', () => {
  it('ChatRequest has required fields: workspaceId, agentId, message', () => {
    const req: ChatRequest = {
      workspaceId: 'ws-1',
      agentId: 'agent-1',
      message: 'Hello',
    }
    expect(req.workspaceId).toBe('ws-1')
    expect(req.agentId).toBe('agent-1')
    expect(req.message).toBe('Hello')
  })

  it('ChatRequest accepts all optional fields', () => {
    const req: ChatRequest = {
      workspaceId: 'ws-1',
      agentId: 'agent-1',
      message: 'Analyze this',
      agentName: 'Support Bot',
      agentRole: 'Customer support',
      provider: 'openai',
      model: 'gpt-4o',
      sessionId: 'session-123',
      images: ['data:image/png;base64,abc'],
    }
    expect(req.provider).toBe('openai')
    expect(req.images).toHaveLength(1)
  })

  it('ChatResponse has required response field and optional extras', () => {
    const minimal: ChatResponse = { response: 'Hello!' }
    expect(minimal.response).toBe('Hello!')
    expect(minimal.reasoning).toBeUndefined()
    expect(minimal.toolCalls).toBeUndefined()

    const full: ChatResponse = {
      response: 'Done!',
      reasoning: 'I checked the database...',
      toolCalls: [{ name: 'query_db', args: { sql: 'SELECT 1' }, result: '1' }],
      notice: 'Rate limited',
    }
    expect(full.toolCalls).toHaveLength(1)
    expect(full.notice).toBe('Rate limited')
  })

  it('ToolCallResult has name, args, result', () => {
    const tool: ToolCallResult = {
      name: 'search',
      args: { query: 'test', limit: 10 },
      result: 'Found 3 results',
    }
    expect(tool.name).toBe('search')
    expect(tool.args).toHaveProperty('query')
  })

  it('ModelOption has all display and capability fields', () => {
    const model: ModelOption = {
      id: 'openai-gpt4o',
      provider: 'openai',
      providerLabel: 'OpenAI',
      model: 'gpt-4o',
      label: 'GPT-4o',
      supportsTools: true,
      supportsVision: true,
      isDefault: true,
    }
    expect(model.supportsTools).toBe(true)
    expect(model.isDefault).toBe(true)
  })

  it('ModelsResponse wraps a list of ModelOption', () => {
    const res: ModelsResponse = {
      models: [
        {
          id: 'kimi-v1',
          provider: 'kimi',
          providerLabel: 'Kimi',
          model: 'moonshot-v1-128k',
          label: 'Kimi 128K',
          supportsTools: false,
          supportsVision: false,
        },
      ],
    }
    expect(res.models).toHaveLength(1)
    expect(res.models[0].provider).toBe('kimi')
  })
})
