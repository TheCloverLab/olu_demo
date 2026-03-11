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
  supportsVision?: boolean
  visionModel?: string
}

export interface ModelOption {
  id: string
  provider: string
  providerLabel: string
  model: string
  label: string
  supportsTools: boolean
  supportsVision: boolean
  isDefault?: boolean
}

const builtinProviders: Record<string, Omit<ModelProvider, 'apiKey'>> = {
  kimi: {
    name: 'kimi',
    baseURL: 'https://api.kimi.com/coding/v1',
    model: 'kimi-for-coding',
    headers: { 'User-Agent': 'claude-code/1.0.0', 'X-Client-Name': 'claude-code' },
    supportsTools: true,
    supportsVision: false,
  },
  openai: {
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    supportsTools: true,
    supportsVision: true,
  },
  claude: {
    name: 'claude',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    supportsTools: true,
    supportsVision: true,
  },
  deepseek: {
    name: 'deepseek',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    supportsTools: true,
    supportsVision: false,
  },
  qwen: {
    name: 'qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-max',
    visionModel: 'qwen-vl-max-latest',
    supportsTools: true,
    supportsVision: true,
  },
  gemini: {
    name: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    supportsTools: true,
    supportsVision: true,
  },
}

const legacyApiKeyEnvMap: Record<string, string> = {
  kimi: 'KIMI_API_KEY',
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'QWEN_API_KEY',
  gemini: 'GEMINI_API_KEY',
}

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false
  return undefined
}

function inferVisionSupport(model: string, baseURL: string, providerName: string): boolean {
  const normalized = `${providerName} ${model} ${baseURL}`.toLowerCase()
  if (normalized.includes('deepseek-chat') || normalized.includes('kimi-for-coding')) return false
  return /(gpt-4o|gpt-4\.1|gemini|claude|vision|vl|pixtral|llava|minicpm|qvq)/i.test(normalized)
}

function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function inferProviderFamily(provider: Pick<ModelProvider, 'name' | 'baseURL' | 'model'>): { slug: string; label: string } {
  const normalized = `${provider.name} ${provider.baseURL} ${provider.model}`.toLowerCase()

  if (normalized.includes('kimi') || normalized.includes('moonshot')) return { slug: 'kimi', label: 'Kimi' }
  if (normalized.includes('api.openai.com') || normalized.includes(' gpt-') || /\bo\d/.test(normalized)) return { slug: 'openai', label: 'OpenAI' }
  if (normalized.includes('claude') || normalized.includes('anthropic') || normalized.includes('api123')) return { slug: 'claude', label: 'Claude' }
  if (normalized.includes('gemini') || normalized.includes('generativelanguage.googleapis.com')) return { slug: 'gemini', label: 'Gemini' }
  if (normalized.includes('qwen') || normalized.includes('dashscope')) return { slug: 'qwen', label: 'Qwen' }
  if (normalized.includes('deepseek')) return { slug: 'deepseek', label: 'DeepSeek' }

  return { slug: provider.name, label: titleCase(provider.name) }
}

function shouldExposeModel(modelId: string, providerName: string): boolean {
  const normalized = modelId.toLowerCase()
  const likelyChatPrefix = /^(gpt|o\d|chatgpt|claude|kimi|moonshot|deepseek|qwen|gemini|learnlm|glm|doubao|llama|mistral|mixtral|pixtral|codestral|command|c4ai)/
  const excluded = /(embedding|whisper|tts|transcribe|realtime|moderation|image|dall-e|sora)/

  if (excluded.test(normalized)) return false
  if (likelyChatPrefix.test(normalized)) return true
  if (providerName === 'claude' && normalized.startsWith('claude')) return true
  if (providerName === 'kimi' && (normalized.startsWith('kimi') || normalized.startsWith('moonshot'))) return true

  return false
}

function modelSort(a: string, b: string, preferred: string) {
  if (a === preferred) return -1
  if (b === preferred) return 1
  return a.localeCompare(b)
}

function loadProviderFromEnv(name: string): ModelProvider | null {
  const prefix = `MODEL_${name.toUpperCase()}_`
  const apiKey = process.env[`${prefix}API_KEY`] || process.env[legacyApiKeyEnvMap[name.toLowerCase()]]
  if (!apiKey) return null

  const builtin = builtinProviders[name.toLowerCase()]
  const baseURL = process.env[`${prefix}BASE_URL`] || builtin?.baseURL || 'https://api.openai.com/v1'
  const model = process.env[`${prefix}MODEL`] || builtin?.model || 'gpt-4o-mini'
  const envSupportsVision = parseBooleanEnv(process.env[`${prefix}SUPPORTS_VISION`])
  const visionModel = process.env[`${prefix}VISION_MODEL`] || builtin?.visionModel
  return {
    name,
    apiKey,
    baseURL,
    model,
    headers: builtin?.headers,
    supportsTools: builtin?.supportsTools ?? true,
    supportsVision: envSupportsVision ?? builtin?.supportsVision ?? inferVisionSupport(model, baseURL, name),
    visionModel,
  }
}

function getDefaultProvider(): ModelProvider {
  const legacyFallback = ['openai', 'gemini', 'qwen', 'claude', 'kimi', 'deepseek']
    .map((name) => loadProviderFromEnv(name))
    .find((provider) => provider?.apiKey)
  const baseURL = process.env.LLM_BASE_URL || legacyFallback?.baseURL || 'https://api.openai.com/v1'
  const model = process.env.LLM_MODEL || legacyFallback?.model || 'gpt-4o-mini'
  const envSupportsVision = parseBooleanEnv(process.env.LLM_SUPPORTS_VISION)
  const visionModel = process.env.LLM_VISION_MODEL
  const hasExplicitDefaultConfig = Boolean(process.env.LLM_BASE_URL || process.env.LLM_MODEL)
  const explicitBuiltin = Object.values(builtinProviders).find((provider) =>
    provider.baseURL === baseURL || provider.model === model,
  )
  const inferredProviderName = explicitBuiltin?.name || 'default'

  return {
    name: 'default',
    apiKey: process.env.LLM_API_KEY || legacyFallback?.apiKey || '',
    baseURL,
    model,
    headers: explicitBuiltin?.headers || legacyFallback?.headers || {
      'User-Agent': 'claude-code/1.0.0',
      'X-Client-Name': 'claude-code',
    },
    supportsTools: explicitBuiltin?.supportsTools ?? legacyFallback?.supportsTools ?? true,
    supportsVision: envSupportsVision
      ?? (hasExplicitDefaultConfig
        ? (explicitBuiltin?.supportsVision ?? inferVisionSupport(model, baseURL, inferredProviderName))
        : (legacyFallback?.supportsVision ?? inferVisionSupport(model, baseURL, inferredProviderName))),
    visionModel: visionModel || legacyFallback?.visionModel,
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

async function fetchProviderModelIds(provider: ModelProvider): Promise<string[]> {
  const res = await fetch(`${provider.baseURL}/models`, {
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      ...(provider.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`models-${provider.name}-${res.status}`)
  }

  const data = await res.json()
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
        ? data.models
        : []

  return rows
    .map((row: any) => row?.id || row?.name)
    .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
}

export async function listAvailableModelOptions(): Promise<ModelOption[]> {
  const providers = listAvailableProviders()
  const options: ModelOption[] = []

  for (const provider of providers) {
    const family = inferProviderFamily(provider)
    const preferredModel = provider.model
    const candidateIds = new Set<string>([provider.model])
    if (provider.visionModel) candidateIds.add(provider.visionModel)

    try {
      const remoteIds = await fetchProviderModelIds(provider)
      for (const modelId of remoteIds) {
        if (shouldExposeModel(modelId, family.slug)) candidateIds.add(modelId)
      }
    } catch {
      // Fall back to configured defaults when the provider does not expose /models.
    }

    const sortedIds = Array.from(candidateIds).sort((a, b) => modelSort(a, b, preferredModel))
    for (const modelId of sortedIds) {
      options.push({
        id: `${provider.name}::${modelId}`,
        provider: provider.name,
        providerLabel: provider.name === 'default' ? `${family.label} (default)` : family.label,
        model: modelId,
        label: `${provider.name === 'default' ? `${family.label} (default)` : family.label} / ${modelId}`,
        supportsTools: provider.supportsTools ?? true,
        supportsVision: inferVisionSupport(modelId, provider.baseURL, family.slug),
        isDefault: provider.name === 'default' && modelId === provider.model,
      })
    }
  }

  return options
}

export function resolveProviderForChat(name: string | undefined, needsVision: boolean, modelOverride?: string): {
  provider: ModelProvider
  fallbackFrom?: string
  effectiveModel: string
} {
  const requested = getModelProvider(name)
  const requestedModel = modelOverride || (needsVision && requested.visionModel ? requested.visionModel : requested.model)

  if (!needsVision || requested.supportsVision) {
    return {
      provider: requested,
      effectiveModel: requestedModel,
    }
  }
  throw new Error('vision-unsupported')
}
