/**
 * OLU Agent Runtime — HTTP Server
 *
 * Endpoints:
 *   GET  /health          — health check
 *   POST /invoke          — invoke the task agent
 *   POST /resume/:threadId — resume an interrupted graph (approval flow)
 *   GET  /threads/:threadId — get thread state
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Command } from '@langchain/langgraph'
import { taskAgent } from './graph/task-agent.js'
import { runChatAgent } from './graph/chat-agent.js'
import { supabase } from './lib/supabase.js'
import { listAvailableProviders } from './lib/models.js'
import { loadScheduledJobs, getActiveJobIds } from './scheduler/cron-scheduler.js'
import { handleLarkWebhook, loadBotRegistry, getRegisteredBots } from './lib/lark-bot.js'
import { loadMCPFromEnv, initMCPServers, getMCPTools } from './lib/mcp-client.js'
import { listSkills } from './lib/skill-registry.js'

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
      json(res, 200, { status: 'ok', version: '0.1.0' })
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
      const { workspaceId, agentId, agentName, agentRole, message, model, sessionId } = body

      if (!workspaceId || !agentId || !message) {
        json(res, 400, { error: 'Missing required fields: workspaceId, agentId, message' })
        return
      }

      const result = await runChatAgent({
        workspaceId,
        agentId,
        agentName: agentName || 'Agent',
        agentRole: agentRole || 'AI Agent',
        userMessage: message,
        modelProvider: model,
        sourceId: sessionId,  // Optional: pass sessionId for multi-turn conversations
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
      json(res, 200, {
        providers: providers.map(p => ({
          name: p.name,
          model: p.model,
          baseURL: p.baseURL,
          supportsTools: p.supportsTools,
        })),
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

    json(res, 404, { error: 'not found' })
  } catch (err: any) {
    console.error('Request error:', err)
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
