/**
 * Task Agent — LangGraph graph that executes workspace tasks
 *
 * Uses a deterministic workflow (not LLM-driven tool calling) for reliability.
 * Flow: fetch tasks → analyze with LLM → execute updates → (optional) approval → summarize
 */

import { StateGraph, Annotation, interrupt, MemorySaver } from '@langchain/langgraph'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'

// --- Type definitions ---

interface TaskItem {
  id: string
  task_key: string
  title: string
  status: string
  priority: string
  due: string | null
  progress: number
}

interface ActionItem {
  type: 'update_status' | 'create_task' | 'send_message' | 'none'
  task_id?: string
  new_status?: string
  progress?: number
  task_key?: string
  title?: string
  priority?: string
  text?: string
  reason?: string
}

interface ActionResult {
  action: ActionItem
  result?: Record<string, unknown>
  error?: string
}

// --- State definition ---

const AgentState = Annotation.Root({
  workspaceId: Annotation<string>(),
  agentId: Annotation<string>(),
  agentName: Annotation<string>(),
  agentPosition: Annotation<string>(),
  taskDescription: Annotation<string>(),
  requiresApproval: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  approved: Annotation<boolean | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  tasks: Annotation<TaskItem[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  plan: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  actions: Annotation<(ActionItem | ActionResult)[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
})

// --- LLM helper ---

async function callLLM(prompt: string, options?: { json?: boolean }): Promise<string> {
  const apiKey = process.env.LLM_API_KEY
  const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.LLM_MODEL || 'gpt-5.4-2026-03-05'

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: 'You are a task planning assistant. Always follow instructions precisely.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  }

  // Use structured output mode for JSON responses (required for Kimi which puts content in reasoning_content otherwise)
  if (options?.json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'claude-code/1.0.0',
      'X-Client-Name': 'claude-code',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`)
  }

  const text = await res.text()
  console.log('[callLLM] Raw response:', text.slice(0, 500))
  let data: { choices?: { message?: { content?: string; reasoning_content?: string } }[] }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`LLM returned invalid JSON: ${text.slice(0, 200)}`)
  }
  const msg = data.choices?.[0]?.message
  return msg?.content || msg?.reasoning_content || ''
}

// --- Node: Fetch current tasks ---

async function fetchTasks(state: typeof AgentState.State) {
  const { data, error } = await supabase
    .from('workspace_agent_tasks')
    .select('id, task_key, title, status, priority, due, progress')
    .eq('workspace_agent_id', state.agentId)
    .order('created_at', { ascending: false })

  if (error) {
    return { tasks: [], error: `Failed to fetch tasks: ${error.message}` }
  }
  return { tasks: data || [] }
}

// --- Zod schema for LLM plan response ---

const LLMActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('update_status'),
    task_id: z.string(),
    new_status: z.enum(['in_progress', 'done']).optional(),
    progress: z.number().optional(),
  }),
  z.object({
    type: z.literal('create_task'),
    task_key: z.string(),
    title: z.string(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
  z.object({
    type: z.literal('send_message'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('none'),
    reason: z.string().optional(),
  }),
])

const LLMPlanResponseSchema = z.object({
  plan: z.string().default(''),
  actions: z.array(LLMActionSchema).default([]),
})

// --- Node: Plan actions using LLM ---

async function planActions(state: typeof AgentState.State) {
  if (state.error) return {}

  const taskList = state.tasks
    .map(
      (t) =>
        `- [${t.status}] id="${t.id}" "${t.title}" (priority: ${t.priority}, progress: ${t.progress}%)`,
    )
    .join('\n')

  const prompt = `You are ${state.agentName}, a ${state.agentPosition} AI agent.

Current tasks:
${taskList || '(no tasks)'}

User request: ${state.taskDescription}

Based on the request, decide what actions to take. Respond in JSON format:
{
  "plan": "Brief description of what you'll do",
  "actions": [
    {"type": "update_status", "task_id": "<UUID from the id= field above>", "new_status": "in_progress|done", "progress": 50},
    {"type": "create_task", "task_key": "slug-style-key", "title": "Human readable title", "priority": "low|medium|high"},
    {"type": "send_message", "text": "Brief update message to post in the team conversation"},
    {"type": "none", "reason": "..."}
  ]
}

IMPORTANT: task_id must be the exact UUID shown in the id= field. Respond ONLY with valid JSON, no other text.
When completing or starting tasks, always include a send_message action to notify the team.`

  try {
    const response = await callLLM(prompt, { json: true })
    console.log('[planActions] LLM response:', response.slice(0, 500))
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    let raw: unknown
    try {
      raw = JSON.parse(cleaned)
    } catch {
      throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`)
    }
    const parsed = LLMPlanResponseSchema.parse(raw)
    return {
      plan: parsed.plan,
      actions: parsed.actions,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[planActions] Error:', msg)
    return { plan: 'Failed to plan', actions: [], error: msg }
  }
}

// --- Node: Check if approval is needed ---

function checkApproval(state: typeof AgentState.State) {
  if (state.error) return '__end__'

  const hasStatusChange = state.actions.some(
    (a) => {
      const item = 'action' in a ? a.action : a
      return item.type === 'update_status' && item.new_status === 'done'
    },
  )

  if (hasStatusChange && state.requiresApproval && state.approved === null) {
    return 'approval'
  }
  return 'execute'
}

// --- Node: Human approval interrupt ---

async function approvalNode(state: typeof AgentState.State) {
  const decision = interrupt({
    question: `${state.agentName} wants to execute: ${state.plan}. Approve?`,
    actions: state.actions,
    agentId: state.agentId,
  })
  return { approved: decision === 'approve' }
}

function afterApproval(state: typeof AgentState.State) {
  return state.approved ? 'execute' : 'summarize'
}

// --- Activity logging ---

async function logActivity(
  agentId: string,
  taskId: string,
  action: string,
  detail?: string,
) {
  try {
    await supabase.from('workspace_agent_task_logs').insert({
      agent_id: agentId,
      task_id: taskId,
      action,
      detail,
    })
  } catch (err: unknown) {
    console.warn('[logActivity] Failed:', err instanceof Error ? err.message : String(err))
  }
}

// --- Node: Execute planned actions ---

async function executeActions(state: typeof AgentState.State) {
  const results: ActionResult[] = []

  for (const action of state.actions as ActionItem[]) {
    try {
      if (action.type === 'update_status') {
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (action.new_status) updates.status = action.new_status
        if (action.progress !== undefined) updates.progress = action.progress

        const { data, error } = await supabase
          .from('workspace_agent_tasks')
          .update(updates)
          .eq('id', action.task_id)
          .select('id, title, status, progress')
          .single()

        if (!error && data) {
          const logAction = action.new_status === 'done' ? 'completed' : 'started'
          await logActivity(state.agentId, action.task_id!, logAction, `Status → ${action.new_status}, progress: ${action.progress ?? data.progress}%`)
        }
        results.push(
          error
            ? { action, error: error.message }
            : { action, result: data },
        )
      } else if (action.type === 'send_message') {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            agent_id: state.agentId,
            from_type: 'agent',
            text: action.text,
            time: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
          })
          .select('id, text, time')
          .single()

        results.push(
          error
            ? { action, error: error.message }
            : { action, result: data },
        )
      } else if (action.type === 'create_task') {
        const { data, error } = await supabase
          .from('workspace_agent_tasks')
          .insert({
            workspace_agent_id: state.agentId,
            task_key: action.task_key,
            title: action.title,
            priority: action.priority || 'medium',
            status: 'pending',
            progress: 0,
          })
          .select('id, title, status')
          .single()

        results.push(
          error
            ? { action, error: error.message }
            : { action, result: data },
        )
      } else {
        results.push({ action, result: { status: 'no-op' } })
      }
    } catch (err: unknown) {
      results.push({ action, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return { actions: results }
}

// --- Node: Summarize results ---

async function summarize(state: typeof AgentState.State) {
  if (state.error) {
    return { summary: `Error: ${state.error}` }
  }

  if (state.approved === false) {
    return { summary: 'Action was rejected by the reviewer.' }
  }

  const actionsDesc = (state.actions as ActionResult[])
    .map((a) => {
      if (a.error) return `- FAILED: ${JSON.stringify(a.action)} — ${a.error}`
      if (a.result && 'status' in a.result && a.result.status === 'no-op') return `- Skipped: ${a.action?.reason || 'no action needed'}`
      return `- Done: ${JSON.stringify(a.result)}`
    })
    .join('\n')

  try {
    const summary = await callLLM(
      `You are ${state.agentName}. Summarize what you did in 1-2 sentences:

Plan: ${state.plan}
Actions taken:
${actionsDesc}

Be concise and professional.`,
    )
    return { summary }
  } catch {
    return { summary: `Completed ${state.actions.length} action(s). Plan: ${state.plan}` }
  }
}

// --- Graph ---

const graph = new StateGraph(AgentState)
  .addNode('fetchTasks', fetchTasks)
  .addNode('planActions', planActions)
  .addNode('approval', approvalNode)
  .addNode('execute', executeActions)
  .addNode('summarize', summarize)
  .addEdge('__start__', 'fetchTasks')
  .addEdge('fetchTasks', 'planActions')
  .addConditionalEdges('planActions', checkApproval, {
    approval: 'approval',
    execute: 'execute',
    __end__: '__end__',
  })
  .addConditionalEdges('approval', afterApproval, {
    execute: 'execute',
    summarize: 'summarize',
  })
  .addEdge('execute', 'summarize')
  .addEdge('summarize', '__end__')

const checkpointer = new MemorySaver()

export const taskAgent = graph.compile({ checkpointer })
export type TaskAgentState = typeof AgentState.State
