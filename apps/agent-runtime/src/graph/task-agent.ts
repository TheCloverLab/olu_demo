/**
 * Task Agent — LangGraph graph that executes workspace tasks
 *
 * Uses a deterministic workflow (not LLM-driven tool calling) for reliability.
 * Flow: fetch tasks → analyze with LLM → execute updates → (optional) approval → summarize
 */

import { StateGraph, Annotation, interrupt, MemorySaver } from '@langchain/langgraph'
import { supabase } from '../lib/supabase.js'

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
  tasks: Annotation<any[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  plan: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  actions: Annotation<any[]>({
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

async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY
  const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'claude-code/1.0.0',
      'X-Client-Name': 'claude-code',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text.slice(0, 200)}`)
  }

  const text = await res.text()
  console.log('[callLLM] Raw response:', text.slice(0, 500))
  const data = JSON.parse(text)
  const msg = data.choices?.[0]?.message
  // Kimi For Coding puts actual content in reasoning_content when thinking mode is on
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
    const response = await callLLM(prompt)
    console.log('[planActions] LLM response:', response.slice(0, 500))
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      plan: parsed.plan || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }
  } catch (err: any) {
    console.error('[planActions] Error:', err.message)
    return { plan: 'Failed to plan', actions: [], error: err.message }
  }
}

// --- Node: Check if approval is needed ---

function checkApproval(state: typeof AgentState.State) {
  if (state.error) return '__end__'

  const hasStatusChange = state.actions.some(
    (a: any) => a.type === 'update_status' && a.new_status === 'done',
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
  } catch (err: any) {
    console.warn('[logActivity] Failed:', err.message)
  }
}

// --- Node: Execute planned actions ---

async function executeActions(state: typeof AgentState.State) {
  const results: any[] = []

  for (const action of state.actions) {
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
          await logActivity(state.agentId, action.task_id, logAction, `Status → ${action.new_status}, progress: ${action.progress ?? data.progress}%`)
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
        results.push({ action, result: 'no-op' })
      }
    } catch (err: any) {
      results.push({ action, error: err.message })
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

  const actionsDesc = state.actions
    .map((a: any) => {
      if (a.error) return `- FAILED: ${JSON.stringify(a.action)} — ${a.error}`
      if (a.result === 'no-op') return `- Skipped: ${a.action?.reason || 'no action needed'}`
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
