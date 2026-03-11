import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  vi.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

describe('models', () => {
  it('does not mark explicit Kimi default config as vision-capable just because OpenAI is configured', async () => {
    process.env.LLM_API_KEY = 'kimi-key'
    process.env.LLM_BASE_URL = 'https://api.kimi.com/coding/v1'
    process.env.LLM_MODEL = 'kimi-for-coding'
    process.env.MODEL_OPENAI_API_KEY = 'openai-key'

    const { getModelProvider } = await import('../lib/models.js')
    const provider = getModelProvider()

    expect(provider.baseURL).toBe('https://api.kimi.com/coding/v1')
    expect(provider.model).toBe('kimi-for-coding')
    expect(provider.supportsVision).toBe(false)
  })

  it('falls back image chats from Kimi to OpenAI when OpenAI vision is configured', async () => {
    process.env.LLM_API_KEY = 'kimi-key'
    process.env.LLM_BASE_URL = 'https://api.kimi.com/coding/v1'
    process.env.LLM_MODEL = 'kimi-for-coding'
    process.env.MODEL_OPENAI_API_KEY = 'openai-key'
    process.env.MODEL_OPENAI_MODEL = 'gpt-4o-mini'

    const { resolveProviderForChat } = await import('../lib/models.js')
    const resolved = resolveProviderForChat('default', true)

    expect(resolved.provider.name).toBe('openai')
    expect(resolved.fallbackFrom).toBe('default')
    expect(resolved.effectiveModel).toBe('gpt-4o-mini')
  })
})
