/**
 * Agent Runtime API client
 * Calls the agent-runtime HTTP server to invoke/resume agent tasks
 */

const AGENT_RUNTIME_URL =
  import.meta.env.VITE_AGENT_RUNTIME_URL || 'http://localhost:8080'

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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  })
  if (!res.ok) throw new Error(`Agent resume failed: ${res.status}`)
  return res.json()
}

export async function getThreadState(threadId: string): Promise<ThreadState> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/threads/${threadId}`)
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

export async function getWorkspaceAgents(
  workspaceId: string,
): Promise<AgentWithTasks[]> {
  const res = await fetch(`${AGENT_RUNTIME_URL}/agents/${workspaceId}`)
  if (!res.ok) throw new Error(`Agents fetch failed: ${res.status}`)
  const data = await res.json()
  return data.agents
}
