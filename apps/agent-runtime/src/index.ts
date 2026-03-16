/**
 * OLU Agent Runtime — HTTP Server
 *
 * Endpoints:
 *   GET  /health          — health check
 *   POST /invoke          — invoke the task agent
 *   POST /resume/:threadId — resume an interrupted graph (approval flow)
 *   GET  /threads/:threadId — get thread state
 *   GET  /oauth/twitter    — initiate Twitter OAuth 2.0 PKCE flow
 *   GET  /oauth/twitter/callback — handle Twitter OAuth callback
 */

import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from 'node:http'
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { Command } from '@langchain/langgraph'
import { taskAgent } from './graph/task-agent.js'
import { runChatAgent } from './graph/chat-agent.js'
import { supabase } from './lib/supabase.js'
import { config } from './lib/config.js'
import { listAvailableModelOptions, listAvailableProviders, parseModelSelection } from './lib/models.js'
import { loadScheduledJobs, getActiveJobIds } from './scheduler/cron-scheduler.js'
import { handleLarkWebhook, loadBotRegistry, getRegisteredBots } from './lib/lark-bot.js'
import { loadMCPFromEnv, initMCPServers, getMCPTools, getRegisteredServers, registerMCPServer } from './lib/mcp-client.js'
import { listSkills, getAgentRuntimeType } from './lib/skill-registry.js'
import { getAuthorizationUrl, handleCallback } from './lib/twitter-oauth.js'
import { runProjectChatAgent, streamProjectChatAgent } from './graph/project-chat-agent.js'
import type { ChatRequest, ChatResponse } from '@olu/shared'

const PORT = parseInt(config.PORT, 10)
const API_SECRET = config.API_SECRET

/** Check Authorization header: Bearer <API_SECRET> or x-api-key header */
function isAuthorized(req: IncomingMessage): boolean {
  if (!API_SECRET) return true // No secret configured → allow all (dev mode)
  const auth = req.headers['authorization']
  if (auth === `Bearer ${API_SECRET}`) return true
  const apiKey = req.headers['x-api-key']
  if (apiKey === API_SECRET) return true
  return false
}

// --- Webhook signature verification ---
const WEBHOOK_SECRET = config.WEBHOOK_SECRET
const LARK_ENCRYPT_KEY = config.LARK_ENCRYPT_KEY

function verifySupabaseWebhook(req: IncomingMessage, body: string): boolean {
  if (!WEBHOOK_SECRET) return true // Skip in dev
  const sig = req.headers['x-webhook-signature'] as string | undefined
  if (!sig) return false
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

function verifyLarkWebhook(req: IncomingMessage, body: string): boolean {
  if (!LARK_ENCRYPT_KEY) return true // Skip in dev
  const timestamp = req.headers['x-lark-request-timestamp'] as string | undefined
  const nonce = req.headers['x-lark-request-nonce'] as string | undefined
  const sig = req.headers['x-lark-signature'] as string | undefined
  if (!timestamp || !nonce || !sig) return false
  const content = timestamp + nonce + LARK_ENCRYPT_KEY + body
  const expected = createHmac('sha256', '').update(content).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

// --- In-memory rate limiter (sliding window) ---
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = parseInt(config.RATE_LIMIT_MAX, 10)
const rateBuckets = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  if (RATE_LIMIT_MAX <= 0) return false
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  let timestamps = rateBuckets.get(key) || []
  timestamps = timestamps.filter((t) => t > windowStart)
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  rateBuckets.set(key, timestamps)
  return false
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
  for (const [key, timestamps] of rateBuckets) {
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) rateBuckets.delete(key)
    else rateBuckets.set(key, filtered)
  }
}, 300_000)

// --- MCP credential encryption ---
const ENCRYPTION_KEY = config.ENCRYPTION_KEY // 32+ char key for AES-256

function encryptCredentials(data: unknown): string {
  if (!ENCRYPTION_KEY) return JSON.stringify(data) // Plaintext fallback in dev
  // createCipheriv and randomBytes imported at top of file
  const iv = randomBytes(16)
  const key = createHmac('sha256', ENCRYPTION_KEY).update('mcp-credentials').digest()
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptCredentials(stored: string): unknown {
  if (!stored.startsWith('enc:')) return JSON.parse(stored) // Legacy plaintext
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY required to decrypt credentials')
  // createDecipheriv imported at top of file
  const [, ivHex, dataHex] = stored.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = createHmac('sha256', ENCRYPTION_KEY).update('mcp-credentials').digest()
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

const MAX_BODY_SIZE = 1_048_576 // 1MB

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let totalSize = 0
  for await (const chunk of req) {
    totalSize += (chunk as Buffer).length
    if (totalSize > MAX_BODY_SIZE) {
      throw { statusCode: 413, error: 'Request body too large' }
    }
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString()
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function parseBody<T = Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  const text = await readBody(req)
  try {
    return JSON.parse(text) as T
  } catch {
    throw { statusCode: 400, message: 'Invalid JSON body' }
  }
}

const ALLOWED_ORIGINS = config.ALLOWED_ORIGINS.split(',').filter(Boolean)

function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers['origin'] || ''
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
}

// OpenClaw proxy — forward /openclaw/* requests to the OpenClaw gateway
const OPENCLAW_URL = config.OPENCLAW_URL

function proxyToOpenClaw(req: IncomingMessage, res: ServerResponse, path: string) {
  const target = new URL(path, OPENCLAW_URL)
  const proxyReq = httpRequest(
    {
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: req.method,
      headers: { ...req.headers, host: target.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', (err) => {
    console.error('[openclaw-proxy] error:', err.message)
    json(res, 502, { error: `OpenClaw unreachable: ${err.message}` })
  })
  req.pipe(proxyReq)
}

const server = createServer(async (req, res) => {
  cors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  try {
    // Health check (unauthenticated)
    if (url.pathname === '/health' && req.method === 'GET') {
      json(res, 200, { status: 'ok', version: '0.1.0', buildTime: config.BUILD_TIME || null })
      return
    }

    // Auth gate — all endpoints below require API_SECRET when configured
    if (!isAuthorized(req)) {
      json(res, 401, { error: 'Unauthorized' })
      return
    }

    // Rate limit — keyed by client IP
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
    if (isRateLimited(clientIp)) {
      json(res, 429, { error: 'Too many requests' })
      return
    }

    // Invoke agent
    if (url.pathname === '/invoke' && req.method === 'POST') {
      const body = await parseBody<{
        workspaceId: string; agentId: string; agentName?: string
        agentPosition?: string; taskDescription: string; requiresApproval?: boolean
      }>(req)
      const {
        workspaceId,
        agentId,
        agentName,
        agentPosition,
        taskDescription,
        requiresApproval = false,
      } = body

      if (!workspaceId || !agentId || !taskDescription) {
        json(res, 400, {
          error: 'Missing required fields: workspaceId, agentId, taskDescription',
        })
        return
      }

      // Runtime-aware routing: forward to OpenClaw if agent uses openclaw runtime
      const invokeRuntime = await getAgentRuntimeType(agentId)
      if (invokeRuntime === 'openclaw') {
        proxyToOpenClaw(req, res, '/invoke')
        return
      }

      const threadId = `${agentId}-${Date.now()}`
      const config = { configurable: { thread_id: threadId } }

      const result = await taskAgent.invoke(
        {
          workspaceId,
          agentId,
          agentName: agentName || 'Agent',
          agentPosition: agentPosition || 'AI Agent',
          taskDescription,
          requiresApproval,
        },
        config,
      )

      // Check if the graph was interrupted (needs approval)
      const state = await taskAgent.getState(config)
      const interrupted = state.next && state.next.length > 0

      json(res, 200, {
        threadId,
        interrupted,
        pendingApproval: interrupted ? state.next : null,
        plan: result.plan,
        summary: result.summary,
        actions: result.actions,
        error: result.error,
      })
      return
    }

    // Resume interrupted graph (approval)
    const resumeMatch = url.pathname.match(/^\/resume\/(.+)$/)
    if (resumeMatch && req.method === 'POST') {
      const threadId = resumeMatch[1]
      const body = await parseBody<{ decision: string }>(req)
      const { decision } = body

      if (!decision || !['approve', 'reject'].includes(decision)) {
        json(res, 400, { error: "decision must be 'approve' or 'reject'" })
        return
      }

      const config = { configurable: { thread_id: threadId } }

      // Resume the interrupted graph with the decision value
      const result = await taskAgent.invoke(
        new Command({ resume: decision }),
        config,
      )

      json(res, 200, {
        threadId,
        decision,
        summary: result.summary,
        actions: result.actions,
      })
      return
    }

    // Get thread state
    const threadMatch = url.pathname.match(/^\/threads\/(.+)$/)
    if (threadMatch && req.method === 'GET') {
      const threadId = threadMatch[1]
      const config = { configurable: { thread_id: threadId } }
      const state = await taskAgent.getState(config)

      json(res, 200, {
        threadId,
        next: state.next,
        plan: state.values?.plan,
        summary: state.values?.summary,
        error: state.values?.error,
      })
      return
    }

    // Chat with an agent (tool-calling mode)
    if (url.pathname === '/chat' && req.method === 'POST') {
      const body = await parseBody<ChatRequest>(req)
      const { workspaceId, agentId, agentName, agentRole, message, provider, model, sessionId, images } = body

      if (!workspaceId || !agentId || (!message && !images?.length)) {
        json(res, 400, { error: 'Missing required fields: workspaceId, agentId, message' })
        return
      }

      // Runtime-aware routing: forward to OpenClaw if agent uses openclaw runtime
      const runtimeType = await getAgentRuntimeType(agentId)
      if (runtimeType === 'openclaw') {
        proxyToOpenClaw(req, res, '/chat')
        return
      }

      const parsedModelSelection = parseModelSelection(
        typeof provider === 'string' ? provider : undefined,
        typeof model === 'string' ? model : undefined,
      )

      const result = await runChatAgent({
        workspaceId,
        agentId,
        agentName: agentName || 'Agent',
        agentRole: agentRole || 'AI Agent',
        userMessage: message || '',
        modelProvider: parsedModelSelection.providerName,
        modelOverride: parsedModelSelection.modelOverride,
        sourceId: sessionId,
        images,
      })

      json(res, 200, result)
      return
    }

    // Project chat — chat with Lead Agent in a project context
    if (url.pathname === '/project/chat' && req.method === 'POST') {
      const body = await parseBody<{
        projectId: string; workspaceId: string; message?: string
        provider?: string; model?: string; sessionId?: string; images?: string[]
      }>(req)
      const { projectId, workspaceId, message, provider, model, sessionId, images } = body

      if (!projectId || !workspaceId || (!message && !images?.length)) {
        json(res, 400, { error: 'Missing required fields: projectId, workspaceId, message' })
        return
      }

      // Runtime-aware routing: check project's runtime_type
      const { data: proj } = await supabase
        .from('projects')
        .select('runtime_type')
        .eq('id', projectId)
        .single()

      if (proj?.runtime_type === 'openclaw') {
        proxyToOpenClaw(req, res, '/project/chat')
        return
      }

      const parsedModelSelection = parseModelSelection(
        typeof provider === 'string' ? provider : undefined,
        typeof model === 'string' ? model : undefined,
      )

      const result = await runProjectChatAgent({
        projectId,
        workspaceId,
        userMessage: message || '',
        modelProvider: parsedModelSelection.providerName,
        modelOverride: parsedModelSelection.modelOverride,
        sourceId: sessionId,
        images,
      })

      json(res, 200, result)
      return
    }

    // Project chat stream — SSE endpoint for streaming responses
    if (url.pathname === '/project/chat/stream' && req.method === 'POST') {
      const body = await parseBody<{
        projectId: string; workspaceId: string; message?: string
        provider?: string; model?: string; sessionId?: string; images?: string[]
      }>(req)
      const { projectId, workspaceId, message, provider: prov, model: mod, sessionId, images } = body

      if (!projectId || !workspaceId || (!message && !images?.length)) {
        json(res, 400, { error: 'Missing required fields: projectId, workspaceId, message' })
        return
      }

      // Runtime-aware routing
      const { data: proj } = await supabase
        .from('projects')
        .select('runtime_type')
        .eq('id', projectId)
        .single()

      if (proj?.runtime_type === 'openclaw') {
        proxyToOpenClaw(req, res, '/project/chat/stream')
        return
      }

      const parsedModelSelection = parseModelSelection(
        typeof prov === 'string' ? prov : undefined,
        typeof mod === 'string' ? mod : undefined,
      )

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin') || '*',
      })

      try {
        const stream = streamProjectChatAgent({
          projectId,
          workspaceId,
          userMessage: message || '',
          modelProvider: parsedModelSelection.providerName,
          modelOverride: parsedModelSelection.modelOverride,
          sourceId: sessionId,
          images,
        })

        for await (const chunk of stream) {
          res.write(chunk)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'stream error'
        res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`)
      }

      res.end()
      return
    }

    // List scheduled jobs
    if (url.pathname === '/scheduler/jobs' && req.method === 'GET') {
      json(res, 200, { activeJobs: getActiveJobIds() })
      return
    }

    // List available model providers
    if (url.pathname === '/models' && req.method === 'GET') {
      const providers = listAvailableProviders()
      const models = await listAvailableModelOptions()
      json(res, 200, {
        providers: providers.map(p => ({
          name: p.name,
          model: p.model,
          baseURL: p.baseURL,
          supportsTools: p.supportsTools,
          supportsVision: p.supportsVision,
          visionModel: p.visionModel,
        })),
        models,
      })
      return
    }

    // Lark Bot webhook — receives messages from Lark bots
    if (url.pathname === '/webhook/lark' && req.method === 'POST') {
      const rawBody = await readBody(req)
      if (!verifyLarkWebhook(req, rawBody)) {
        json(res, 403, { error: 'Invalid Lark webhook signature' })
        return
      }
      let body: Record<string, unknown>
      try { body = JSON.parse(rawBody) } catch { json(res, 400, { error: "Invalid JSON body" }); return }
      const result = await handleLarkWebhook(body)
      json(res, 200, result)
      return
    }

    // Lark card action callback (interactive cards)
    if (url.pathname === '/webhook/lark/card-action' && req.method === 'POST') {
      const rawBody = await readBody(req)
      if (!verifyLarkWebhook(req, rawBody)) {
        json(res, 403, { error: 'Invalid Lark webhook signature' })
        return
      }
      let body: Record<string, unknown>
      try { body = JSON.parse(rawBody) } catch { json(res, 400, { error: "Invalid JSON body" }); return }
      // Handle URL verification challenge
      if (body.challenge) {
        json(res, 200, { challenge: body.challenge })
        return
      }
      // Card action events — acknowledge for now
      console.log('[lark-card] Card action received:', JSON.stringify(body).slice(0, 200))
      json(res, 200, {})
      return
    }

    // Support auto-reply webhook — called by pg_net trigger when consumer sends a message
    if (url.pathname === '/webhook/support-message' && req.method === 'POST') {
      const rawBody = await readBody(req)
      if (!verifySupabaseWebhook(req, rawBody)) {
        json(res, 403, { error: 'Invalid webhook signature' })
        return
      }
      let body: Record<string, unknown>
      try { body = JSON.parse(rawBody) } catch { json(res, 400, { error: "Invalid JSON body" }); return }
      const social_chat_id = body.social_chat_id as string | undefined
      const text = body.text as string | undefined
      const message_id = body.message_id as string | undefined

      if (!social_chat_id || !text) {
        json(res, 200, { skipped: true, reason: 'missing fields' })
        return
      }

      console.log(`[support-auto-reply] chat=${social_chat_id} msg_id=${message_id}`)

      // Look up the chat to find the workspace owner
      const { data: chat } = await supabase
        .from('social_chats')
        .select('with_user_id')
        .eq('id', social_chat_id)
        .single()

      if (!chat) {
        json(res, 200, { skipped: true, reason: 'chat not found' })
        return
      }

      // Find the workspace owned by with_user_id
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('owner_user_id', chat.with_user_id)
        .limit(1)
        .single()

      if (!ws) {
        json(res, 200, { skipped: true, reason: 'workspace not found' })
        return
      }

      // Check AI support enabled + read model preference
      const { data: config } = await supabase
        .from('workspace_home_configs')
        .select('ai_support_enabled, ai_support_model')
        .eq('workspace_id', ws.id)
        .single()

      if (!config?.ai_support_enabled) {
        json(res, 200, { skipped: true, reason: 'ai support disabled' })
        return
      }

      // Use workspace model preference if configured
      const parsedModel = parseModelSelection(config.ai_support_model ?? undefined, undefined)

      runChatAgent({
        workspaceId: ws.id,
        agentId: 'support',
        agentName: 'Support Assistant',
        agentRole: `Customer support assistant for ${ws.name}. Reply in the same language as the user. Be concise and helpful.\nYou have tools to query the database in real-time: list_products, list_experiences, get_course_content, search_workspace_content. Use them to answer detailed questions about products, courses, pricing, etc.`,
        userMessage: text,
        modelProvider: parsedModel.providerName,
        modelOverride: parsedModel.modelOverride,
        sourceId: social_chat_id,
      }).then(async (result) => {
        const replyText = result.response || ''
        if (!replyText.trim()) return
        const { error: insertErr } = await supabase
          .from('social_chat_messages')
          .insert({
            social_chat_id,
            from_type: 'other',
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        if (insertErr) console.error('[support-auto-reply] insert error:', insertErr)
        else console.log(`[support-auto-reply] replied: ${replyText.slice(0, 100)}`)
      }).catch((err) => {
        console.error('[support-auto-reply] chat error:', err.message)
      })

      json(res, 202, { accepted: true, agent: 'Support Assistant' })
      return
    }

    // List registered Lark bots
    if (url.pathname === '/bots' && req.method === 'GET') {
      json(res, 200, { bots: getRegisteredBots() })
      return
    }

    // List available skills
    if (url.pathname === '/skills' && req.method === 'GET') {
      json(res, 200, { skills: listSkills() })
      return
    }

    // List MCP tools
    if (url.pathname === '/mcp/tools' && req.method === 'GET') {
      json(res, 200, { tools: getMCPTools() })
      return
    }

    // List registered MCP servers
    if (url.pathname === '/mcp/servers' && req.method === 'GET') {
      json(res, 200, { servers: getRegisteredServers() })
      return
    }

    // Register a new MCP server dynamically
    if (url.pathname === '/mcp/servers' && req.method === 'POST') {
      const body = await parseBody<{ name: string; url: string; type?: 'stdio' | 'sse' }>(req)
      const { name, url: serverUrl, type = 'sse' } = body
      if (!name || !serverUrl) {
        json(res, 400, { error: 'Missing name or url' })
        return
      }
      registerMCPServer({ name, type, url: serverUrl })
      // Discover tools immediately
      const tools = await initMCPServers()
      json(res, 200, { ok: true, totalTools: tools.length })
      return
    }

    // Store MCP server credentials for a workspace
    if (url.pathname === '/mcp/credentials' && req.method === 'POST') {
      const body = await parseBody<{ workspaceId: string; serverName: string; credentials: unknown }>(req)
      const { workspaceId, serverName, credentials } = body
      if (!workspaceId || !serverName || !credentials) {
        json(res, 400, { error: 'Missing workspaceId, serverName, or credentials' })
        return
      }
      const provider = `mcp:${serverName}`
      const { data, error: upsertError } = await supabase
        .from('workspace_integrations')
        .upsert({
          workspace_id: workspaceId,
          provider,
          status: 'connected',
          config_json: encryptCredentials(credentials),
        }, { onConflict: 'workspace_id,provider' })
        .select('provider, status')
        .single()

      if (upsertError) {
        json(res, 500, { error: upsertError.message })
        return
      }
      json(res, 200, { ok: true, provider: data.provider })
      return
    }

    // Get agent runtime type
    if (url.pathname.match(/^\/agents\/.+\/runtime$/) && req.method === 'GET') {
      const agentId = url.pathname.split('/')[2]
      const runtimeType = await getAgentRuntimeType(agentId)
      json(res, 200, { agentId, runtimeType })
      return
    }

    // Twitter OAuth — initiate
    if (url.pathname === '/oauth/twitter' && req.method === 'GET') {
      const workspaceId = url.searchParams.get('workspace_id')
      const clientId = config.TWITTER_CLIENT_ID
      if (!workspaceId || !clientId) {
        json(res, 400, { error: 'Missing workspace_id or TWITTER_CLIENT_ID not configured' })
        return
      }
      const requestedOrigin = url.searchParams.get('origin') || ''
      const safeOrigin = ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(requestedOrigin)
        ? requestedOrigin
        : `http://localhost:${PORT}`
      const redirectUri = `${safeOrigin}/oauth/twitter/callback`
      const auth = getAuthorizationUrl(workspaceId, redirectUri, clientId)
      // Redirect browser to Twitter authorization page
      res.writeHead(302, { Location: auth.url })
      res.end()
      return
    }

    // Twitter OAuth — callback
    if (url.pathname === '/oauth/twitter/callback' && req.method === 'GET') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const clientId = config.TWITTER_CLIENT_ID
      const clientSecret = config.TWITTER_CLIENT_SECRET

      if (!code || !state) {
        json(res, 400, { error: 'Missing code or state' })
        return
      }

      try {
        const result = await handleCallback(code, state, clientId, clientSecret)
        // Redirect back to the app's connectors page with success
        const appUrl = config.APP_URL
        res.writeHead(302, {
          Location: `${appUrl}/business/connectors?twitter=connected&username=${result.username || ''}`,
        })
        res.end()
      } catch (err: unknown) {
        json(res, 400, { error: err instanceof Error ? err.message : 'bad request' })
      }
      return
    }

    // --- Budget endpoints ---

    // Approve a budget — lock funds and update status
    const approveMatch = url.pathname.match(/^\/budgets\/(.+)\/approve$/)
    if (approveMatch && req.method === 'POST') {
      const budgetId = approveMatch[1]
      const body = await parseBody<{ approved_amount: number }>(req)
      const approvedAmount = body.approved_amount

      if (!approvedAmount || approvedAmount <= 0) {
        json(res, 400, { error: 'approved_amount is required and must be positive' })
        return
      }

      const { data: budget, error: budgetErr } = await supabase
        .from('agent_budgets')
        .select('id, workspace_id, status')
        .eq('id', budgetId)
        .single()

      if (budgetErr || !budget) {
        json(res, 404, { error: 'Budget not found' })
        return
      }
      if (budget.status !== 'pending') {
        json(res, 400, { error: `Budget is ${budget.status}, not pending` })
        return
      }

      const { data: wallet } = await supabase
        .from('workspace_wallets')
        .select('usdc_balance, locked_amount')
        .eq('workspace_id', budget.workspace_id)
        .single()

      const available = wallet ? Number(wallet.usdc_balance) - Number(wallet.locked_amount) : 0
      if (approvedAmount > available) {
        json(res, 400, { error: `Insufficient balance. Available: $${available.toFixed(2)}` })
        return
      }

      await supabase
        .from('workspace_wallets')
        .update({ locked_amount: Number(wallet!.locked_amount) + approvedAmount, updated_at: new Date().toISOString() })
        .eq('workspace_id', budget.workspace_id)

      await supabase
        .from('agent_budgets')
        .update({ approved_amount: approvedAmount, status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', budgetId)

      await supabase.from('budget_transactions').insert({
        budget_id: budgetId,
        type: 'allocation',
        amount: approvedAmount,
        description: `Budget approved: $${approvedAmount}`,
      })

      json(res, 200, { budget_id: budgetId, approved_amount: approvedAmount, status: 'approved' })
      return
    }

    // Pause a budget — stop spending and return remaining funds
    const pauseMatch = url.pathname.match(/^\/budgets\/(.+)\/pause$/)
    if (pauseMatch && req.method === 'POST') {
      const budgetId = pauseMatch[1]

      const { data: budget, error: budgetErr } = await supabase
        .from('agent_budgets')
        .select('id, workspace_id, approved_amount, spent_amount, status')
        .eq('id', budgetId)
        .single()

      if (budgetErr || !budget) {
        json(res, 404, { error: 'Budget not found' })
        return
      }

      if (budget.status !== 'in_progress' && budget.status !== 'approved') {
        json(res, 400, { error: `Cannot pause budget with status: ${budget.status}` })
        return
      }

      const approved = Number(budget.approved_amount)
      const spent = Number(budget.spent_amount)
      const remaining = approved - spent

      if (remaining > 0) {
        const { data: wallet } = await supabase
          .from('workspace_wallets')
          .select('locked_amount')
          .eq('workspace_id', budget.workspace_id)
          .single()

        if (wallet) {
          await supabase
            .from('workspace_wallets')
            .update({ locked_amount: Math.max(0, Number(wallet.locked_amount) - remaining), updated_at: new Date().toISOString() })
            .eq('workspace_id', budget.workspace_id)
        }

        await supabase.from('budget_transactions').insert({
          budget_id: budgetId,
          type: 'pause',
          amount: remaining,
          description: `Paused by owner. $${remaining.toFixed(2)} returned to wallet.`,
        })
      }

      if (spent > 0) {
        const { data: wallet } = await supabase
          .from('workspace_wallets')
          .select('usdc_balance, total_spent, locked_amount')
          .eq('workspace_id', budget.workspace_id)
          .single()

        if (wallet) {
          await supabase
            .from('workspace_wallets')
            .update({
              usdc_balance: Number(wallet.usdc_balance) - spent,
              total_spent: Number(wallet.total_spent) + spent,
              locked_amount: Math.max(0, Number(wallet.locked_amount) - approved),
              updated_at: new Date().toISOString(),
            })
            .eq('workspace_id', budget.workspace_id)
        }
      }

      await supabase
        .from('agent_budgets')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', budgetId)

      json(res, 200, { budget_id: budgetId, status: 'paused', spent, refunded: remaining })
      return
    }

    // Get budget details
    const budgetMatch = url.pathname.match(/^\/budgets\/(.+)$/)
    if (budgetMatch && req.method === 'GET') {
      const budgetId = budgetMatch[1]
      const { data: budget, error } = await supabase
        .from('agent_budgets')
        .select('*, budget_transactions(*)')
        .eq('id', budgetId)
        .single()

      if (error || !budget) {
        json(res, 404, { error: 'Budget not found' })
        return
      }
      json(res, 200, budget)
      return
    }

    // List budgets for a workspace
    if (url.pathname === '/budgets' && req.method === 'GET') {
      const workspaceId = url.searchParams.get('workspace_id')
      if (!workspaceId) {
        json(res, 400, { error: 'workspace_id required' })
        return
      }
      const { data, error } = await supabase
        .from('agent_budgets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      json(res, 200, { budgets: data || [], error: error?.message })
      return
    }

    // OpenClaw proxy — forward /openclaw/* to the OpenClaw gateway
    if (url.pathname.startsWith('/openclaw/')) {
      const forwardPath = url.pathname.slice('/openclaw'.length) + url.search
      proxyToOpenClaw(req, res, forwardPath)
      return
    }

    json(res, 404, { error: 'not found' })
  } catch (err: unknown) {
    const statusErr = err as { statusCode?: number; error?: string; message?: string }
    if (statusErr.statusCode) {
      json(res, statusErr.statusCode, { error: statusErr.error || statusErr.message })
      return
    }
    console.error('Request error:', err)
    const msg = err instanceof Error ? err.message : 'internal error'
    if (msg === 'vision-unsupported') {
      json(res, 422, { error: 'vision-unsupported' })
      return
    }
    json(res, 500, { error: msg })
  }
})

server.listen(PORT, async () => {
  console.log(`OLU Agent Runtime listening on :${PORT}`)

  // Load scheduled jobs on startup
  loadScheduledJobs().catch(err => {
    console.error('[startup] Failed to load scheduled jobs:', err.message)
  })

  // Load Lark bot registry
  loadBotRegistry().catch(err => {
    console.error('[startup] Failed to load bot registry:', err.message)
  })

  // Initialize MCP servers
  loadMCPFromEnv()
  initMCPServers().catch(err => {
    console.error('[startup] Failed to init MCP servers:', err.message)
  })
})
