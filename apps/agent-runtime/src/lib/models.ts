/**
 * Multi-model registry — supports multiple LLM providers via OpenAI-compatible API
 *
 * Each model provider is configured via environment variables:
 *   MODEL_<NAME>_API_KEY, MODEL_<NAME>_BASE_URL, MODEL_<NAME>_MODEL
 *
 * Built-in providers: kimi, openai, claude, deepseek, qwen, gemini
 * Default provider is set via LLM_* env vars for backward compatibility.
 */

export interface ModelProvider {
  name: string
  apiKey: string
  baseURL: string
  model: string
  headers?: Record<string, string>
  supportsTools?: boolean
}

const builtinProviders: Record<string, Omit<ModelProvider, 'apiKey'>> = {
  kimi: {
    name: 'kimi',
    baseURL: 'https://api.kimi.com/coding/v1',
    model: 'kimi-for-coding',
    headers: { 'User-Agent': 'claude-code/1.0.0', 'X-Client-Name': 'claude-code' },
    supportsTools: true,
  },
  openai: {
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    supportsTools: true,
  },
  claude: {
    name: 'claude',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    supportsTools: true,
  },
  deepseek: {
    name: 'deepseek',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    supportsTools: true,
  },
  qwen: {
    name: 'qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-max',
    supportsTools: true,
  },
  gemini: {
    name: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    supportsTools: true,
  },
}

function loadProviderFromEnv(name: string): ModelProvider | null {
  const prefix = `MODEL_${name.toUpperCase()}_`
  const apiKey = process.env[`${prefix}API_KEY`]
  if (!apiKey) return null

  const builtin = builtinProviders[name.toLowerCase()]
  return {
    name,
    apiKey,
    baseURL: process.env[`${prefix}BASE_URL`] || builtin?.baseURL || 'https://api.openai.com/v1',
    model: process.env[`${prefix}MODEL`] || builtin?.model || 'gpt-4o-mini',
    headers: builtin?.headers,
    supportsTools: builtin?.supportsTools ?? true,
  }
}

function getDefaultProvider(): ModelProvider {
  return {
    name: 'default',
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    headers: {
      'User-Agent': 'claude-code/1.0.0',
      'X-Client-Name': 'claude-code',
    },
    supportsTools: true,
  }
}

/** Get a model provider by name. Falls back to default if not found. */
export function getModelProvider(name?: string): ModelProvider {
  if (!name || name === 'default') return getDefaultProvider()

  // Try loading from env
  const fromEnv = loadProviderFromEnv(name)
  if (fromEnv) return fromEnv

  // Check if it's a builtin with a generic API key
  const builtin = builtinProviders[name.toLowerCase()]
  if (builtin) {
    const genericKey = process.env.LLM_API_KEY
    if (genericKey) {
      return { ...builtin, apiKey: genericKey }
    }
  }

  // Fall back to default
  return getDefaultProvider()
}

/** Generate embeddings using an available provider's embeddings API */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  // Try providers in order: openai, claude (via proxy), default
  const candidates = ['openai', 'claude', 'default']
  for (const name of candidates) {
    const provider = name === 'default' ? getDefaultProvider() : loadProviderFromEnv(name)
    if (!provider?.apiKey) continue

    try {
      const res = await fetch(`${provider.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
          ...(provider.headers || {}),
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
        }),
      })

      if (!res.ok) continue

      const data = await res.json()
      const embedding = data.data?.[0]?.embedding
      if (embedding && Array.isArray(embedding)) return embedding
    } catch {
      continue
    }
  }
  return null
}

/** List all available model providers (those with API keys configured) */
export function listAvailableProviders(): ModelProvider[] {
  const providers: ModelProvider[] = [getDefaultProvider()]

  for (const name of Object.keys(builtinProviders)) {
    const provider = loadProviderFromEnv(name)
    if (provider) providers.push(provider)
  }

  // Also scan for custom MODEL_*_API_KEY patterns
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^MODEL_(.+)_API_KEY$/)
    if (match) {
      const name = match[1].toLowerCase()
      if (!providers.find(p => p.name === name)) {
        const provider = loadProviderFromEnv(name)
        if (provider) providers.push(provider)
      }
    }
  }

  return providers
}
