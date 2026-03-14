/**
 * Chat Agent — tool-calling agent that can search the web and manage tasks
 *
 * Uses the LLM's native function calling (tools) for a ReAct-style loop.
 * The LLM decides which tools to call and when.
 * Supports multiple model providers via the model registry.
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { allTools } from '../tools/workspace-tools.js'
import { resolveProviderForChat, type ModelProvider } from '../lib/models.js'
import { getAgentTools, getAgentSkillPrompts } from '../lib/skill-registry.js'
import {
  buildConversationKey,
  loadConversationHistory,
  saveConversationMessages,
  trimConversationHistory,
  type ConversationMessage,
} from '../lib/conversation.js'

type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null | any[]
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

function cleanSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema, additionalProperties, ...rest } = schema as any
  return rest
}

function buildToolDefs(tools: StructuredToolInterface[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.schema ? cleanSchema(zodToJsonSchema(t.schema as any) as Record<string, unknown>) : { type: 'object', properties: {} },
    },
  }))
}

function usesMaxCompletionTokens(modelName: string): boolean {
  return /^(gpt-5($|[-.])|o1($|[-.])|o3($|[-.])|o4($|[-.]))/i.test(modelName)
}

async function callLLMWithTools(
  messages: Message[],
  provider: ModelProvider,
  toolDefs: ReturnType<typeof buildToolDefs>,
  modelOverride?: string,
) {
  const modelName = modelOverride || provider.model
  const body: Record<string, unknown> = {
    model: modelName,
    messages,
    tools: provider.supportsTools && toolDefs.length ? toolDefs : undefined,
    temperature: 0.3,
  }

  if (usesMaxCompletionTokens(modelName)) {
    body.max_completion_tokens = 2048
  } else {
    body.max_tokens = 2048
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  let res: Response
  try {
    res = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
        ...(provider.headers || {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('LLM request timed out after 60s')
    throw err
  }
  clearTimeout(timeout)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices[0]
}

export type ChatResult = {
  response: string
  reasoning?: string
  toolCalls: { name: string; args: Record<string, unknown>; result: string }[]
  model?: string
  provider?: string
  notice?: string
}

export async function runChatAgent(params: {
  agentId: string
  agentName: string
  agentRole: string
  workspaceId: string
  userMessage: string
  modelProvider?: string
  modelOverride?: string
  sourceId?: string  // For multi-turn: Lark chatId, API sessionId, etc.
  images?: string[]  // Public image URLs or data URLs for vision
}): Promise<ChatResult> {
  const { agentId, agentName, agentRole, workspaceId, userMessage, modelProvider, modelOverride, sourceId, images } = params

  const { provider, fallbackFrom, effectiveModel } = resolveProviderForChat(modelProvider, Boolean(images?.length), modelOverride)
  console.log(`[chatAgent] Using model: ${effectiveModel} (${provider.name})`)

  // Load agent-specific tools and skill prompts based on enabled skills
  const [agentTools, skillPrompts] = await Promise.all([
    getAgentTools(agentId),
    getAgentSkillPrompts(agentId),
  ])
  const toolMap = Object.fromEntries(agentTools.map((t) => [t.name, t]))
  const toolDefs = buildToolDefs(agentTools)
  console.log(`[chatAgent] Loaded ${agentTools.length} tools for agent ${agentId}`)

  const systemPrompt = `You are ${agentName}, a ${agentRole} AI agent in a workspace (workspace_id: ${workspaceId}, your agent_id: ${agentId}).

You have access to tools for managing tasks, searching the web, posting team messages, and viewing team overview.
When using tools that need agentId, use "${agentId}".
When using tools that need workspaceId, use "${workspaceId}".

Be concise and professional. Use your tools silently — never tell the user which tools you used or what you did internally. Just give the answer directly.${skillPrompts ? '\n\n' + skillPrompts : ''}`

  // Load conversation history if sourceId is provided (multi-turn)
  const conversationKey = sourceId ? buildConversationKey(agentId, sourceId) : null
  let history: ConversationMessage[] = []
  if (conversationKey) {
    history = await loadConversationHistory(conversationKey)
    if (history.length) {
      console.log(`[chatAgent] Loaded ${history.length} messages from conversation history`)
    }
  }

  // Build user message with optional images (vision)
  let userContent: any = userMessage
  if (images?.length) {
    const parts: any[] = []
    parts.push({ type: 'text', text: userMessage || 'Please analyze the attached image(s).' })
    for (const img of images) {
      // img can be a public URL or a data URL like "data:image/png;base64,..."
      parts.push({
        type: 'image_url',
        image_url: { url: img },
      })
    }
    userContent = parts
  }

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    // Insert conversation history (skip system messages from history)
    ...history.filter(m => m.role !== 'system'),
    { role: 'user', content: userContent },
  ]

  const allToolCalls: ChatResult['toolCalls'] = []
  const MAX_ITERATIONS = 8

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const choice = await callLLMWithTools(messages, provider, toolDefs, effectiveModel)
    const msg = choice.message
    console.log(`[chatAgent] finish_reason=${choice.finish_reason} tool_calls=${msg.tool_calls?.length || 0}`)

    if (msg.tool_calls?.length) {
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
      // LLM is done — save conversation and return
      const response = msg.content || msg.reasoning_content || 'Done.'
      const reasoning = msg.reasoning_content && msg.content ? msg.reasoning_content : undefined

      if (conversationKey) {
        // Save user message + assistant response to history
        saveConversationMessages(conversationKey, [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response },
        ]).catch(err => console.error('[chatAgent] Failed to save conversation:', err.message))

        // Trim old messages in background
        trimConversationHistory(conversationKey).catch(() => {})
      }

      return {
        response,
        reasoning,
        toolCalls: allToolCalls,
        model: effectiveModel,
        provider: provider.name,
        notice: fallbackFrom ? `Images were processed with ${provider.name} because ${fallbackFrom} does not support vision.` : undefined,
      }
    }
  }

  const fallbackResponse = 'Reached maximum tool call iterations.'
  if (conversationKey) {
    saveConversationMessages(conversationKey, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fallbackResponse },
    ]).catch(() => {})
  }

  return {
    response: fallbackResponse,
    toolCalls: allToolCalls,
    model: effectiveModel,
    provider: provider.name,
    notice: fallbackFrom ? `Images were processed with ${provider.name} because ${fallbackFrom} does not support vision.` : undefined,
  }
}
