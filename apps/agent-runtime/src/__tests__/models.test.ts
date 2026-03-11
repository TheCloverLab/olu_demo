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

  it('uses Claude Opus as the explicit default provider config', async () => {
    process.env.LLM_API_KEY = 'claude-key'
    process.env.LLM_BASE_URL = 'https://api123.icu/v1'
    process.env.LLM_MODEL = 'claude-opus-4-6'

    const { getModelProvider } = await import('../lib/models.js')
    const provider = getModelProvider()

    expect(provider.name).toBe('default')
    expect(provider.baseURL).toBe('https://api123.icu/v1')
    expect(provider.model).toBe('claude-opus-4-6')
    expect(provider.supportsVision).toBe(true)
  })

  it('preserves Kimi as a separate provider when default is Claude', async () => {
    process.env.LLM_API_KEY = 'claude-key'
    process.env.LLM_BASE_URL = 'https://api123.icu/v1'
    process.env.LLM_MODEL = 'claude-opus-4-6'
    process.env.MODEL_KIMI_API_KEY = 'kimi-key'

    const { listAvailableProviders } = await import('../lib/models.js')
    const providers = listAvailableProviders()

    expect(providers.find((provider) => provider.name === 'default')?.model).toBe('claude-opus-4-6')
    expect(providers.find((provider) => provider.name === 'kimi')?.model).toBe('kimi-for-coding')
  })
})
