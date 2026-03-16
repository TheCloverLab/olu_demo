/**
 * Project Chat Agent — Lead Agent for project-centric conversations
 *
 * Wraps the generic chat agent with project-specific context and tools.
 * The Lead Agent:
 * - Has full project context (description, tasks, participants)
 * - Can create/update tasks automatically from conversation
 * - Uses project tools alongside general workspace tools
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { projectTools } from '../tools/project-tools.js'
import { webSearch, fetchWebpage, browseWebpage, generateImage, generateFile, generateChart, executeCode } from '../tools/workspace-tools.js'
import { SKILL_DEFINITIONS } from '../lib/skill-registry.js'
import { resolveProviderForChat, type ModelProvider } from '../lib/models.js'
import {
  buildConversationKey,
  loadConversationHistory,
  saveConversationMessages,
  trimConversationHistory,
  type ConversationMessage,
} from '../lib/conversation.js'
import { supabase } from '../lib/supabase.js'

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

async function callLLM(
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
    body.max_completion_tokens = 4096
  } else {
    body.max_tokens = 4096
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)
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
    if (err.name === 'AbortError') throw new Error('LLM request timed out after 90s')
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

/** Streaming version of callLLM — yields SSE data chunks */
async function* callLLMStream(
  messages: Message[],
  provider: ModelProvider,
  toolDefs: ReturnType<typeof buildToolDefs>,
  modelOverride?: string,
): AsyncGenerator<{ type: 'content' | 'tool_calls' | 'done'; data: string }> {
  const modelName = modelOverride || provider.model
  const body: Record<string, unknown> = {
    model: modelName,
    messages,
    tools: provider.supportsTools && toolDefs.length ? toolDefs : undefined,
    temperature: 0.3,
    stream: true,
  }

  if (usesMaxCompletionTokens(modelName)) {
    body.max_completion_tokens = 4096
  } else {
    body.max_tokens = 4096
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)
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
    if (err.name === 'AbortError') throw new Error('LLM request timed out after 90s')
    throw err
  }
  clearTimeout(timeout)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  let collectedContent = ''
  let collectedToolCalls: ToolCall[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') {
        if (collectedToolCalls.length) {
          yield { type: 'tool_calls', data: JSON.stringify(collectedToolCalls) }
        }
        yield { type: 'done', data: collectedContent }
        return
      }
      try {
        const chunk = JSON.parse(data)
        const delta = chunk.choices?.[0]?.delta
        if (!delta) continue

        if (delta.content) {
          collectedContent += delta.content
          yield { type: 'content', data: delta.content }
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              while (collectedToolCalls.length <= tc.index) {
                collectedToolCalls.push({ id: '', type: 'function', function: { name: '', arguments: '' } })
              }
              const target = collectedToolCalls[tc.index]
              if (tc.id) target.id = tc.id
              if (tc.function?.name) target.function.name += tc.function.name
              if (tc.function?.arguments) target.function.arguments += tc.function.arguments
            }
          }
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  if (collectedToolCalls.length) {
    yield { type: 'tool_calls', data: JSON.stringify(collectedToolCalls) }
  }
  yield { type: 'done', data: collectedContent }
}

/** Default skills for projects (backward compatible) */
const DEFAULT_PROJECT_SKILLS = ['web', 'content', 'code']

/** Load tools based on project skill configuration */
function loadProjectTools(skills: string[]): StructuredToolInterface[] {
  const tools: StructuredToolInterface[] = [...projectTools] // always include project tools
  const seen = new Set<string>(projectTools.map(t => t.name))

  for (const skillName of skills) {
    const skill = SKILL_DEFINITIONS[skillName]
    if (!skill) continue
    for (const tool of skill.tools) {
      if (!seen.has(tool.name)) {
        seen.add(tool.name)
        tools.push(tool)
      }
    }
  }
  return tools
}

/** Load project context for the system prompt */
async function loadProjectContext(projectId: string): Promise<{ context: string; skills: string[]; instructions: string | null }> {
  const [projectRes, participantsRes, tasksRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, type, status, runtime_type, config')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_participants')
      .select('user_id, role')
      .eq('project_id', projectId),
    supabase
      .from('project_tasks')
      .select('id, title, status, priority, description')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (projectRes.error) return { context: `Project not found: ${projectRes.error.message}`, skills: DEFAULT_PROJECT_SKILLS, instructions: null }

  const p = projectRes.data
  const tasks = tasksRes.data || []
  const participants = participantsRes.data || []
  const config = (p.config || {}) as Record<string, unknown>
  const skills = (Array.isArray(config.skills) ? config.skills : DEFAULT_PROJECT_SKILLS) as string[]
  const instructions = (typeof config.instructions === 'string' ? config.instructions : null)

  const taskSummary = tasks.length > 0
    ? tasks.map(t => `- [${t.status}] ${t.title}${t.priority !== 'medium' ? ` (${t.priority})` : ''}`).join('\n')
    : 'No tasks yet.'

  return {
    context: `## Project: ${p.name}
${p.description ? `Description: ${p.description}\n` : ''}Status: ${p.status} | Runtime: ${p.runtime_type}
Participants: ${participants.length} members
Project ID: ${p.id}

### Current Tasks (${tasks.length})
${taskSummary}`,
    skills,
    instructions,
  }
}

export type ProjectChatResult = {
  response: string
  reasoning?: string
  toolCalls: { name: string; args: Record<string, unknown>; result: string }[]
  model?: string
  provider?: string
  notice?: string
}

export async function runProjectChatAgent(params: {
  projectId: string
  workspaceId: string
  userMessage: string
  modelProvider?: string
  modelOverride?: string
  sourceId?: string
  images?: string[]
}): Promise<ProjectChatResult> {
  const { projectId, workspaceId, userMessage, modelProvider, modelOverride, sourceId, images } = params

  const { provider, fallbackFrom, effectiveModel } = resolveProviderForChat(modelProvider, Boolean(images?.length), modelOverride)
  console.log(`[projectChat] Using model: ${effectiveModel} (${provider.name})`)

  // Load project context, skills, and custom instructions
  const { context: projectContext, skills, instructions } = await loadProjectContext(projectId)
  console.log(`[projectChat] Loaded context for project ${projectId}, skills: [${skills.join(', ')}]`)

  // Load tools based on project skill configuration
  const tools = loadProjectTools(skills)
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]))
  const toolDefs = buildToolDefs(tools)
  console.log(`[projectChat] Loaded ${tools.length} tools from ${skills.length} skills`)

  const skillDescriptions = skills
    .map(s => SKILL_DEFINITIONS[s])
    .filter(Boolean)
    .map(s => `- **${s.name}**: ${s.description}`)
    .join('\n')

  const systemPrompt = `You are the Lead Agent for a project workspace (workspace_id: ${workspaceId}).
Your role is to help the project owner accomplish their goals through conversation.

${projectContext}
${instructions ? `\n## Specialist Instructions\n${instructions}\n` : ''}
## Your Capabilities
- **Task Management**: Automatically create, update, and track tasks based on conversation.
${skillDescriptions}

## Behavior Guidelines
- When the user describes work to be done, create project tasks automatically using create_project_task.
- When discussing completed work, update task status to "done".
- Always use project_id "${projectId}" when calling project tools.
- Be proactive: suggest next steps, identify blockers, and keep the project moving.
- Be concise and actionable. Skip internal tool details — just deliver results.
- Reply in the same language as the user.`

  // Load conversation history
  const conversationKey = sourceId ? buildConversationKey(`project:${projectId}`, sourceId) : null
  let history: ConversationMessage[] = []
  if (conversationKey) {
    history = await loadConversationHistory(conversationKey)
    if (history.length) {
      console.log(`[projectChat] Loaded ${history.length} messages from history`)
    }
  }

  // Build user message with optional images
  let userContent: any = userMessage
  if (images?.length) {
    const parts: any[] = [{ type: 'text', text: userMessage || 'Please analyze the attached image(s).' }]
    for (const img of images) {
      parts.push({ type: 'image_url', image_url: { url: img } })
    }
    userContent = parts
  }

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.filter(m => m.role !== 'system'),
    { role: 'user', content: userContent },
  ]

  const allToolCalls: ProjectChatResult['toolCalls'] = []
  const MAX_ITERATIONS = 10

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const choice = await callLLM(messages, provider, toolDefs, effectiveModel)
    const msg = choice.message
    console.log(`[projectChat] finish_reason=${choice.finish_reason} tool_calls=${msg.tool_calls?.length || 0}`)

    if (msg.tool_calls?.length) {
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
        console.log(`[projectChat] Tool call: ${toolName}(${JSON.stringify(toolArgs)})`)

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
      const response = msg.content || msg.reasoning_content || 'Done.'
      const reasoning = msg.reasoning_content && msg.content ? msg.reasoning_content : undefined

      if (conversationKey) {
        saveConversationMessages(conversationKey, [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response },
        ]).catch(err => console.error('[projectChat] Failed to save conversation:', err.message))

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

/** Streaming version — yields SSE events */
export async function* streamProjectChatAgent(params: {
  projectId: string
  workspaceId: string
  userMessage: string
  modelProvider?: string
  modelOverride?: string
  sourceId?: string
  images?: string[]
}): AsyncGenerator<string> {
  const { projectId, workspaceId, userMessage, modelProvider, modelOverride, sourceId, images } = params

  const { provider, fallbackFrom, effectiveModel } = resolveProviderForChat(modelProvider, Boolean(images?.length), modelOverride)

  const { context: projectContext, skills, instructions } = await loadProjectContext(projectId)

  const tools = loadProjectTools(skills)
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]))
  const toolDefs = buildToolDefs(tools)

  const skillDescriptions = skills
    .map(s => SKILL_DEFINITIONS[s])
    .filter(Boolean)
    .map(s => `- **${s.name}**: ${s.description}`)
    .join('\n')

  const systemPrompt = `You are the Lead Agent for a project workspace (workspace_id: ${workspaceId}).
Your role is to help the project owner accomplish their goals through conversation.

${projectContext}
${instructions ? `\n## Specialist Instructions\n${instructions}\n` : ''}
## Your Capabilities
- **Task Management**: Automatically create, update, and track tasks based on conversation.
${skillDescriptions}

## Behavior Guidelines
- When the user describes work to be done, create project tasks automatically.
- When discussing completed work, update task status to "done".
- Always use project_id "${projectId}" when calling project tools.
- Be proactive: suggest next steps, identify blockers, and keep the project moving.
- Be concise and actionable. Reply in the same language as the user.`

  const conversationKey = sourceId ? buildConversationKey(`project:${projectId}`, sourceId) : null
  let history: ConversationMessage[] = []
  if (conversationKey) {
    history = await loadConversationHistory(conversationKey)
  }

  let userContent: string | unknown[] = userMessage
  if (images?.length) {
    const parts: unknown[] = [{ type: 'text', text: userMessage || 'Please analyze the attached image(s).' }]
    for (const img of images) {
      parts.push({ type: 'image_url', image_url: { url: img } })
    }
    userContent = parts
  }

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.filter(m => m.role !== 'system'),
    { role: 'user', content: userContent },
  ]

  // Send metadata event
  yield `data: ${JSON.stringify({ type: 'meta', model: effectiveModel, provider: provider.name })}\n\n`

  const MAX_ITERATIONS = 10
  let fullResponse = ''

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let hasToolCalls = false
    let toolCallsData: ToolCall[] = []
    let iterContent = ''

    for await (const chunk of callLLMStream(messages, provider, toolDefs, effectiveModel)) {
      if (chunk.type === 'content') {
        iterContent += chunk.data
        yield `data: ${JSON.stringify({ type: 'content', text: chunk.data })}\n\n`
      } else if (chunk.type === 'tool_calls') {
        hasToolCalls = true
        toolCallsData = JSON.parse(chunk.data)
      }
    }

    if (hasToolCalls && toolCallsData.length) {
      messages.push({
        role: 'assistant',
        content: iterContent || null,
        tool_calls: toolCallsData,
      })

      for (const tc of toolCallsData) {
        const toolName = tc.function.name
        const toolArgs = JSON.parse(tc.function.arguments)
        yield `data: ${JSON.stringify({ type: 'tool', name: toolName })}\n\n`

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

        messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }
    } else {
      fullResponse = iterContent || 'Done.'

      if (conversationKey) {
        saveConversationMessages(conversationKey, [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: fullResponse },
        ]).catch(() => {})
        trimConversationHistory(conversationKey).catch(() => {})
      }

      yield `data: ${JSON.stringify({ type: 'done' })}\n\n`
      return
    }
  }

  yield `data: ${JSON.stringify({ type: 'content', text: '\n\nReached maximum tool call iterations.' })}\n\n`
  yield `data: ${JSON.stringify({ type: 'done' })}\n\n`
}
