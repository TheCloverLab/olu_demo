/**
 * Agent Runtime API client
 * Calls the agent-runtime HTTP server to invoke/resume agent tasks
 */

const AGENT_RUNTIME_URL =
  import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' }
}

export type InvokeResult = {
  threadId: string
  interrupted: boolean
  pendingApproval: string[] | null
  plan: string
  summary: string
  actions: unknown[]
  error: string | null
}

export type ResumeResult = {
  threadId: string
  decision: string
  summary: string
  actions: unknown[]
}

export type ThreadState = {
  threadId: string
  next: string[]
  plan: string
  summary: string
  error: string | null
}

export async function invokeAgent(params: {
  workspaceId: string
  agentId: string
  agentName: string
  agentPosition: string
  taskDescription: string
  requiresApproval?: boolean
}): Promise<InvokeResult> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/invoke`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Agent invoke failed: ${res.status}`)
  return res.json()
}

export async function resumeAgent(
  threadId: string,
  decision: 'approve' | 'reject',
): Promise<ResumeResult> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/resume/${threadId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decision }),
  })
  if (!res.ok) throw new Error(`Agent resume failed: ${res.status}`)
  return res.json()
}

export async function getThreadState(threadId: string): Promise<ThreadState> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/threads/${threadId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Thread fetch failed: ${res.status}`)
  return res.json()
}

export type AgentWithTasks = {
  id: string
  name: string
  role: string
  status: string
  agent_key: string
  workspace_agent_tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    progress: number
  }>
}

export type BatchResult = {
  workspaceId: string
  results: Array<{
    agentId: string
    agentName: string
    threadId?: string
    summary?: string
    actions?: unknown[]
    error?: string
  }>
}

export async function batchRunAgents(
  workspaceId: string,
  taskDescription?: string,
): Promise<BatchResult> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/batch`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId, taskDescription }),
  })
  if (!res.ok) throw new Error(`Batch run failed: ${res.status}`)
  return res.json()
}

export async function getWorkspaceAgents(
  workspaceId: string,
): Promise<AgentWithTasks[]> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/agents/${workspaceId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Agents fetch failed: ${res.status}`)
  const data = await res.json()
  return data.agents
}

export type ChatResult = {
  response: string
  reasoning?: string
  toolCalls: { name: string; args: Record<string, unknown>; result: string }[]
  model?: string
  provider?: string
  notice?: string
}

export async function chatWithAgent(params: {
  workspaceId: string
  agentId: string
  agentName?: string
  agentRole?: string
  message: string
  sessionId?: string
  provider?: string
  model?: string
}): Promise<ChatResult> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  return res.json()
}

export type ModelOption = {
  id: string
  provider: string
  model: string
  supportsTools: boolean
  supportsVision: boolean
}

export async function getAvailableModels(): Promise<ModelOption[]> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/models`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Models fetch failed: ${res.status}`)
  const data = await res.json()
  return data.models || []
}

// --- Budget API ---

export type BudgetRecord = {
  id: string
  workspace_id: string
  agent_id: string
  task_id: string | null
  requested_amount: number
  approved_amount: number | null
  spent_amount: number
  currency: string
  status: 'pending' | 'approved' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  description: string
  breakdown: { item: string; amount: number }[]
  created_at: string
  updated_at: string
}

export async function approveBudgetAPI(budgetId: string, approvedAmount: number): Promise<{
  budget_id: string
  approved_amount: number
  status: string
}> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/budgets/${budgetId}/approve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ approved_amount: approvedAmount }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Approve budget failed: ${res.status}`)
  }
  return res.json()
}

export async function pauseBudget(budgetId: string): Promise<{
  budget_id: string
  status: string
  spent: number
  refunded: number
}> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/budgets/${budgetId}/pause`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Pause budget failed: ${res.status}`)
  }
  return res.json()
}

export async function getBudget(budgetId: string): Promise<BudgetRecord> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/budgets/${budgetId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Get budget failed: ${res.status}`)
  return res.json()
}

export async function listBudgets(workspaceId: string): Promise<BudgetRecord[]> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/budgets?workspace_id=${workspaceId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`List budgets failed: ${res.status}`)
  const data = await res.json()
  return data.budgets
}
