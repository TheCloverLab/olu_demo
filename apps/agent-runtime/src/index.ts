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

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Command } from '@langchain/langgraph'
import { taskAgent } from './graph/task-agent.js'
import { runChatAgent } from './graph/chat-agent.js'
import { supabase } from './lib/supabase.js'
import { listAvailableModelOptions, listAvailableProviders, parseModelSelection } from './lib/models.js'
import { loadScheduledJobs, getActiveJobIds } from './scheduler/cron-scheduler.js'
import { handleLarkWebhook, loadBotRegistry, getRegisteredBots } from './lib/lark-bot.js'
import { loadMCPFromEnv, initMCPServers, getMCPTools, getRegisteredServers, registerMCPServer } from './lib/mcp-client.js'
import { listSkills, getAgentRuntimeType } from './lib/skill-registry.js'
import { getAuthorizationUrl, handleCallback } from './lib/twitter-oauth.js'

const PORT = parseInt(process.env.PORT || '8080', 10)

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString()
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const server = createServer(async (req, res) => {
  cors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  try {
    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      json(res, 200, { status: 'ok', version: '0.1.0', buildTime: process.env.BUILD_TIME || null })
      return
    }

    // Invoke agent
    if (url.pathname === '/invoke' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req))
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

    // Batch run — execute all agents in a workspace
    if (url.pathname === '/batch' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req))
      const { workspaceId, taskDescription } = body

      if (!workspaceId) {
        json(res, 400, { error: 'Missing required field: workspaceId' })
        return
      }

      const { data: agents, error: agentsError } = await supabase
        .from('workspace_agents')
        .select('id, name, role')
        .eq('workspace_id', workspaceId)

      if (agentsError || !agents?.length) {
        json(res, 404, { error: agentsError?.message || 'No agents found' })
        return
      }

      const description =
        taskDescription || 'Review your pending tasks and take appropriate action on the highest priority items.'

      // Run all agents in parallel
      const runs = await Promise.allSettled(
        agents.map(async (agent) => {
          const threadId = `batch-${agent.id}-${Date.now()}`
          const config = { configurable: { thread_id: threadId } }

          // Set agent status to busy
          await supabase
            .from('workspace_agents')
            .update({ status: 'busy', updated_at: new Date().toISOString() })
            .eq('id', agent.id)

          try {
            const result = await taskAgent.invoke(
              {
                workspaceId,
                agentId: agent.id,
                agentName: agent.name,
                agentPosition: agent.role,
                taskDescription: description,
                requiresApproval: false,
              },
              config,
            )

            // Set agent back to online
            await supabase
              .from('workspace_agents')
              .update({ status: 'online', updated_at: new Date().toISOString() })
              .eq('id', agent.id)

            return {
              agentId: agent.id,
              agentName: agent.name,
              threadId,
              summary: result.summary,
              actions: result.actions,
            }
          } catch (err: any) {
            // Set agent back to online on error
            await supabase
              .from('workspace_agents')
              .update({ status: 'online', updated_at: new Date().toISOString() })
              .eq('id', agent.id)
            throw err
          }
        }),
      )

      const results = runs.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return {
          agentId: agents[i].id,
          agentName: agents[i].name,
          error: (r.reason as Error).message,
        }
      })

      json(res, 200, { workspaceId, results })
      return
    }

    // Resume interrupted graph (approval)
    const resumeMatch = url.pathname.match(/^\/resume\/(.+)$/)
    if (resumeMatch && req.method === 'POST') {
      const threadId = resumeMatch[1]
      const body = JSON.parse(await readBody(req))
      const { decision } = body // 'approve' or 'reject'

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

    // List agents for a workspace
    const agentsMatch = url.pathname.match(/^\/agents\/(.+)$/)
    if (agentsMatch && req.method === 'GET') {
      const workspaceId = agentsMatch[1]
      const { data, error } = await supabase
        .from('workspace_agents')
        .select('id, name, role, status, agent_key, workspace_agent_tasks(id, title, status, priority, progress)')
        .eq('workspace_id', workspaceId)

      if (error) {
        json(res, 500, { error: error.message })
        return
      }

      json(res, 200, { agents: data || [] })
      return
    }

    // Webhook trigger — Supabase/external events can trigger agent runs
    if (url.pathname === '/webhook/task-created' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req))
      const { record } = body // Supabase webhook sends { type, table, record, ... }

      if (!record?.workspace_agent_id) {
        json(res, 400, { error: 'Missing workspace_agent_id in record' })
        return
      }

      // Look up the agent
      const { data: agent } = await supabase
        .from('workspace_agents')
        .select('id, name, role, workspace_id')
        .eq('id', record.workspace_agent_id)
        .single()

      if (!agent) {
        json(res, 404, { error: 'Agent not found' })
        return
      }

      const threadId = `webhook-${agent.id}-${Date.now()}`
      const config = { configurable: { thread_id: threadId } }

      // Fire-and-forget: invoke the agent with the new task context
      taskAgent
        .invoke(
          {
            workspaceId: agent.workspace_id,
            agentId: agent.id,
            agentName: agent.name,
            agentPosition: agent.role,
            taskDescription: `New task assigned: "${record.title}". Review your current tasks and take appropriate action.`,
            requiresApproval: false,
          },
          config,
        )
        .then((result) => {
          console.log(`[webhook] Agent ${agent.name} completed:`, result.summary)
        })
        .catch((err) => {
          console.error(`[webhook] Agent ${agent.name} error:`, err.message)
        })

      json(res, 202, { threadId, message: 'Agent triggered' })
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
      const body = JSON.parse(await readBody(req))
      const { workspaceId, agentId, agentName, agentRole, message, provider, model, sessionId, images } = body

      if (!workspaceId || !agentId || (!message && !images?.length)) {
        json(res, 400, { error: 'Missing required fields: workspaceId, agentId, message' })
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
      const body = JSON.parse(await readBody(req))
      const result = await handleLarkWebhook(body)
      json(res, 200, result)
      return
    }

    // Lark card action callback (interactive cards)
    if (url.pathname === '/webhook/lark/card-action' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req))
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
      const body = JSON.parse(await readBody(req))
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
      const body = JSON.parse(await readBody(req))
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
          config_json: credentials,
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
      const clientId = process.env.TWITTER_CLIENT_ID
      if (!workspaceId || !clientId) {
        json(res, 400, { error: 'Missing workspace_id or TWITTER_CLIENT_ID not configured' })
        return
      }
      const origin = url.searchParams.get('origin') || `http://localhost:${PORT}`
      const redirectUri = `${origin}/oauth/twitter/callback`
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
      const clientId = process.env.TWITTER_CLIENT_ID || ''
      const clientSecret = process.env.TWITTER_CLIENT_SECRET

      if (!code || !state) {
        json(res, 400, { error: 'Missing code or state' })
        return
      }

      try {
        const result = await handleCallback(code, state, clientId, clientSecret)
        // Redirect back to the app's connectors page with success
        const appUrl = process.env.APP_URL || 'http://localhost:5173'
        res.writeHead(302, {
          Location: `${appUrl}/business/connectors?twitter=connected&username=${result.username || ''}`,
        })
        res.end()
      } catch (err: any) {
        json(res, 400, { error: err.message })
      }
      return
    }

    // --- Budget endpoints ---

    // Approve a budget — lock funds and update status
    const approveMatch = url.pathname.match(/^\/budgets\/(.+)\/approve$/)
    if (approveMatch && req.method === 'POST') {
      const budgetId = approveMatch[1]
      const body = JSON.parse(await readBody(req))
      const approvedAmount = body.approved_amount as number

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

    json(res, 404, { error: 'not found' })
  } catch (err: any) {
    console.error('Request error:', err)
    if (err?.message === 'vision-unsupported') {
      json(res, 422, { error: 'vision-unsupported' })
      return
    }
    json(res, 500, { error: err.message || 'internal error' })
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
