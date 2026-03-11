#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const MODELS_URL = process.env.MODELS_URL || 'http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com/models'
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'vision-probe')
const CONCURRENCY = Number(process.env.CONCURRENCY || 4)
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 25000)

const PROBE_IMAGE_CANDIDATES = [
  path.join(process.cwd(), 'apps/web/public/images/agents/eric.jpg'),
  path.join(process.cwd(), 'apps/web/dist/images/products/hoodie.jpg'),
]

function providerSecretCandidates(name) {
  switch (name) {
    case 'default':
      return ['/olu/agent-runtime/LLM_API_KEY']
    case 'openai':
      return ['/olu/agent-runtime/MODEL_OPENAI_API_KEY']
    case 'claude':
      return ['/olu/agent-runtime/MODEL_CLAUDE_API_KEY']
    case 'kimi':
      return ['/olu/agent-runtime/MODEL_KIMI_API_KEY', '/olu/agent-runtime/LLM_API_KEY']
    case 'deepseek':
      return ['/olu/agent-runtime/MODEL_DEEPSEEK_API_KEY', '/olu/agent-runtime/LLM_API_KEY']
    case 'qwen':
      return ['/olu/agent-runtime/MODEL_QWEN_API_KEY', '/olu/agent-runtime/LLM_API_KEY']
    case 'gemini':
      return ['/olu/agent-runtime/MODEL_GEMINI_API_KEY', '/olu/agent-runtime/LLM_API_KEY']
    default:
      return [`/olu/agent-runtime/MODEL_${name.toUpperCase()}_API_KEY`]
  }
}

function getHeaders(provider, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (provider.baseURL.includes('api.kimi.com')) {
    headers['User-Agent'] = 'claude-code/1.0.0'
    headers['X-Client-Name'] = 'claude-code'
  }

  return headers
}

function classify(status, snippet) {
  const text = `${status} ${snippet}`.toLowerCase()
  if (status >= 200 && status < 300) return 'vision-supported'
  if (
    text.includes('vision-unsupported')
    || text.includes('does not support images')
    || text.includes('image: not supported')
    || text.includes('image input')
    || text.includes('unsupported image')
    || text.includes('image_url')
    || text.includes('vision')
  ) {
    return 'vision-rejected'
  }
  if (
    text.includes('chat.completions')
    || text.includes('responses api')
    || text.includes('unsupported parameter')
    || text.includes('not supported on this endpoint')
    || text.includes('invalid request')
    || text.includes('model_not_found')
    || text.includes('does not exist')
  ) {
    return 'other-model-error'
  }
  if (text.includes('timeout')) return 'timeout'
  return 'other-provider-error'
}

function awsGetParameters(names) {
  const payload = execFileSync(
    'aws',
    ['ssm', 'get-parameters', '--names', ...names, '--with-decryption', '--region', 'us-west-2', '--output', 'json'],
    { encoding: 'utf8' },
  )
  return JSON.parse(payload)
}

async function loadProviders() {
  const res = await fetch(MODELS_URL)
  if (!res.ok) throw new Error(`Failed to load models from ${MODELS_URL}: ${res.status}`)
  return res.json()
}

async function loadProbeImageDataUrl() {
  for (const candidate of PROBE_IMAGE_CANDIDATES) {
    try {
      const bytes = await fs.readFile(candidate)
      return `data:image/jpeg;base64,${bytes.toString('base64')}`
    } catch {
      continue
    }
  }
  throw new Error(`Could not find a probe image. Checked: ${PROBE_IMAGE_CANDIDATES.join(', ')}`)
}

async function probeModel(model, provider, apiKey, imageDataUrl) {
  const startedAt = Date.now()
  try {
    const headers = getHeaders(provider, apiKey)
    const body = JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Reply with exactly OK.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 8,
      temperature: 0,
    })
    const args = [
      '-sS',
      '-X', 'POST',
      '--max-time', String(Math.ceil(TIMEOUT_MS / 1000)),
      `${provider.baseURL}/chat/completions`,
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${apiKey}`,
      '-w', '\n__STATUS__:%{http_code}',
      '--data-binary', '@-',
    ]
    for (const [key, value] of Object.entries(headers)) {
      if (key === 'Content-Type' || key === 'Authorization') continue
      args.push('-H', `${key}: ${value}`)
    }

    const output = execFileSync('curl', args, { input: body, encoding: 'utf8' })
    const marker = '\n__STATUS__:'
    const idx = output.lastIndexOf(marker)
    const text = idx >= 0 ? output.slice(0, idx) : output
    const status = idx >= 0 ? Number(output.slice(idx + marker.length).trim()) : 0
    const snippet = text.slice(0, 240).replace(/\s+/g, ' ').trim()
    return {
      id: model.id,
      provider: model.provider,
      model: model.model,
      label: model.label,
      status,
      elapsedMs: Date.now() - startedAt,
      outcome: classify(status, snippet),
      snippet,
    }
  } catch (error) {
    return {
      id: model.id,
      provider: model.provider,
      model: model.model,
      label: model.label,
      status: 0,
      elapsedMs: Date.now() - startedAt,
      outcome: /timed out/i.test(String(error?.stderr || error?.message || '')) ? 'timeout' : 'request-failed',
      snippet: String(error?.stderr || error?.message || error).slice(0, 240).replace(/\s+/g, ' ').trim(),
    }
  }
}

function summarize(results) {
  const buckets = new Map()
  for (const result of results) {
    buckets.set(result.outcome, (buckets.get(result.outcome) || 0) + 1)
  }
  return Object.fromEntries([...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])))
}

function renderMarkdown(results, summary, metadata) {
  const lines = [
    '# Vision Probe Results',
    '',
    `- Generated: ${metadata.generatedAt}`,
    `- Models endpoint: ${metadata.modelsUrl}`,
    `- Total models tested: ${results.length}`,
    '',
    '## Summary',
    '',
    '| Outcome | Count |',
    '|---|---:|',
    ...Object.entries(summary).map(([outcome, count]) => `| ${outcome} | ${count} |`),
    '',
    '## Details',
    '',
    '| Provider | Model | Outcome | HTTP | ms | Note |',
    '|---|---|---|---:|---:|---|',
    ...results.map((result) => {
      const note = result.snippet.replace(/\|/g, '\\|')
      return `| ${result.provider} | ${result.model} | ${result.outcome} | ${result.status} | ${result.elapsedMs} | ${note} |`
    }),
    '',
  ]
  return lines.join('\n')
}

async function main() {
  const payload = await loadProviders()
  const imageDataUrl = await loadProbeImageDataUrl()
  const providers = new Map(payload.providers.map((provider) => [provider.name, provider]))
  const secretNames = [...new Set(payload.models.flatMap((model) => providerSecretCandidates(model.provider)))]
  const ssm = awsGetParameters(secretNames)
  const secretMap = new Map(ssm.Parameters.map((row) => [row.Name, row.Value]))

  const apiKeys = new Map()
  for (const providerName of providers.keys()) {
    const key = providerSecretCandidates(providerName)
      .map((name) => secretMap.get(name))
      .find(Boolean)
    if (key) apiKeys.set(providerName, key)
  }

  const queue = [...payload.models]
  const results = []
  const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, async () => {
    while (queue.length) {
      const model = queue.shift()
      if (!model) continue
      const provider = providers.get(model.provider)
      const apiKey = apiKeys.get(model.provider)
      if (!provider || !apiKey) {
        results.push({
          id: model.id,
          provider: model.provider,
          model: model.model,
          label: model.label,
          status: 0,
          elapsedMs: 0,
          outcome: 'missing-provider-config',
          snippet: `No provider config or API key for ${model.provider}`,
        })
        continue
      }
      const result = await probeModel(model, provider, apiKey, imageDataUrl)
      results.push(result)
      console.log(`${result.outcome.padEnd(22)} ${result.status.toString().padStart(3)} ${result.model}`)
    }
  })

  await Promise.all(workers)
  results.sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model))

  const summary = summarize(results)
  const generatedAt = new Date().toISOString()
  const metadata = { generatedAt, modelsUrl: MODELS_URL, summary }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const stamp = generatedAt.replace(/[:.]/g, '-')
  const jsonPath = path.join(OUTPUT_DIR, `vision-probe-${stamp}.json`)
  const mdPath = path.join(OUTPUT_DIR, `vision-probe-${stamp}.md`)

  await fs.writeFile(jsonPath, JSON.stringify({ metadata, results }, null, 2))
  await fs.writeFile(mdPath, renderMarkdown(results, summary, metadata))

  console.log(`\nSaved JSON: ${jsonPath}`)
  console.log(`Saved Markdown: ${mdPath}`)
  console.log(`Summary: ${JSON.stringify(summary)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
