/**
 * Chat Agent — tool-calling agent that can search the web and manage tasks
 *
 * Uses the LLM's native function calling (tools) for a ReAct-style loop.
 * The LLM decides which tools to call and when.
 * Supports multiple model providers via the model registry.
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import { allTools } from '../tools/workspace-tools.js'
import { getModelProvider, type ModelProvider } from '../lib/models.js'

type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

const toolMap = Object.fromEntries(allTools.map((t) => [t.name, t]))

const toolDefs = allTools.map((t) => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.schema ? zodToJsonSchema(t.schema) : { type: 'object', properties: {} },
  },
}))

async function callLLMWithTools(messages: Message[], provider: ModelProvider) {
  const res = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      ...(provider.headers || {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      tools: provider.supportsTools ? toolDefs : undefined,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices[0]
}

export type ChatResult = {
  response: string
  toolCalls: { name: string; args: Record<string, unknown>; result: string }[]
  model?: string
  provider?: string
}

export async function runChatAgent(params: {
  agentId: string
  agentName: string
  agentRole: string
  workspaceId: string
  userMessage: string
  modelProvider?: string
}): Promise<ChatResult> {
  const { agentId, agentName, agentRole, workspaceId, userMessage, modelProvider } = params

  const provider = getModelProvider(modelProvider)
  console.log(`[chatAgent] Using model: ${provider.model} (${provider.name})`)

  const systemPrompt = `You are ${agentName}, a ${agentRole} AI agent in a workspace (workspace_id: ${workspaceId}, your agent_id: ${agentId}).

You have access to tools for managing tasks, searching the web, posting team messages, and viewing team overview.
When using tools that need agentId, use "${agentId}".
When using tools that need workspaceId, use "${workspaceId}".

Be concise and professional. After completing actions, summarize what you did.`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  const allToolCalls: ChatResult['toolCalls'] = []
  const MAX_ITERATIONS = 8

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const choice = await callLLMWithTools(messages, provider)
    const msg = choice.message

    if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
      // LLM wants to call tools — preserve reasoning_content for Kimi compatibility
      const assistantMsg: any = {
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      }
      if (msg.reasoning_content) {
        assistantMsg.reasoning_content = msg.reasoning_content
      }
      messages.push(assistantMsg)

      for (const tc of msg.tool_calls) {
        const toolName = tc.function.name
        const toolArgs = JSON.parse(tc.function.arguments)
        console.log(`[chatAgent] Tool call: ${toolName}(${JSON.stringify(toolArgs)})`)

        let result: string
        const toolFn = toolMap[toolName]
        if (toolFn) {
          try {
            result = await (toolFn as any).invoke(toolArgs)
          } catch (err: any) {
            result = JSON.stringify({ error: err.message })
          }
        } else {
          result = JSON.stringify({ error: `Unknown tool: ${toolName}` })
        }

        allToolCalls.push({ name: toolName, args: toolArgs, result })
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        })
      }
    } else {
      // LLM is done — return the final response
      return {
        response: msg.content || msg.reasoning_content || 'Done.',
        toolCalls: allToolCalls,
        model: provider.model,
        provider: provider.name,
      }
    }
  }

  return {
    response: 'Reached maximum tool call iterations.',
    toolCalls: allToolCalls,
    model: provider.model,
    provider: provider.name,
  }
}
