import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, Filter, Loader2, Play, ThumbsUp, ThumbsDown, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getTeamEmployeesForUser } from '../../../domain/team/api'
import { invokeAgent, resumeAgent, type InvokeResult } from '../../../domain/agent/runtime-api'
import type { EmployeeWithTasks, TeamTaskStatus } from '../../../domain/team/types'

const STATUS_CONFIG: Record<TeamTaskStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  pending: { icon: Circle, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-cyan-500/10', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'In Progress' },
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  cancelled: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Cancelled' },
}

const PRIORITY_COLOR = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-[var(--olu-text-secondary)] bg-cyan-500/10',
}

type TaskWithOwner = {
  id: string
  title: string
  status: TeamTaskStatus
  priority: 'low' | 'medium' | 'high'
  due?: string | null
  progress: number
  owner: string
  ownerColor: string | null
  agentId: string
  agentName: string
  agentPosition: string
  workspaceId: string
  isAiAgent: boolean
}

type AgentExecution = {
  taskId: string
  state: 'running' | 'approval' | 'done' | 'error'
  threadId?: string
  response?: string | null
  error?: string
}

export default function TaskCenter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | TeamTaskStatus>('all')
  const [executions, setExecutions] = useState<Map<string, AgentExecution>>(new Map())

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getTeamEmployeesForUser(user)
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const allTasks: TaskWithOwner[] = employees.flatMap((emp) =>
    (emp.tasks || []).map((task) => ({
      ...task,
      owner: emp.name,
      ownerColor: emp.color,
      agentId: emp.id,
      agentName: emp.name,
      agentPosition: emp.position,
      workspaceId: emp.workspace_id,
      isAiAgent: emp.kind === 'ai',
    }))
  )

  async function handleRunAgent(task: TaskWithOwner) {
    const exec: AgentExecution = { taskId: task.id, state: 'running' }
    setExecutions((prev) => new Map(prev).set(task.id, exec))

    try {
      const result = await invokeAgent({
        workspaceId: task.workspaceId,
        agentId: task.agentId,
        agentName: task.agentName,
        agentPosition: task.agentPosition,
        taskDescription: `Execute the task: "${task.title}" (priority: ${task.priority})`,
        requiresApproval: true,
      })

      setExecutions((prev) => new Map(prev).set(task.id, {
        taskId: task.id,
        state: result.interrupted ? 'approval' : 'done',
        threadId: result.threadId,
        response: result.summary || result.error,
      }))

      // Refresh tasks if completed
      if (!result.interrupted && user) {
        getTeamEmployeesForUser(user).then(setEmployees)
      }
    } catch (err: any) {
      setExecutions((prev) => new Map(prev).set(task.id, {
        taskId: task.id,
        state: 'error',
        error: err.message,
      }))
    }
  }

  async function handleApproval(taskId: string, decision: 'approve' | 'reject') {
    const exec = executions.get(taskId)
    if (!exec?.threadId) return

    setExecutions((prev) => new Map(prev).set(taskId, { ...exec, state: 'running' }))

    try {
      const result = await resumeAgent(exec.threadId, decision)
      setExecutions((prev) => new Map(prev).set(taskId, {
        taskId,
        state: 'done',
        threadId: exec.threadId,
        response: result.summary,
      }))
      if (user) getTeamEmployeesForUser(user).then(setEmployees)
    } catch (err: any) {
      setExecutions((prev) => new Map(prev).set(taskId, {
        taskId,
        state: 'error',
        threadId: exec.threadId,
        error: err.message,
      }))
    }
  }

  const filteredTasks = filter === 'all' ? allTasks : allTasks.filter((t) => t.status === filter)
  const counts = {
    all: allTasks.length,
    pending: allTasks.filter((t) => t.status === 'pending').length,
    in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
    done: allTasks.filter((t) => t.status === 'done').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">Task Center</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {counts.in_progress} in progress · {counts.pending} pending · {counts.done} completed
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
          <Zap size={18} className="text-amber-300" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([['all', 'All'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['done', 'Done']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              filter === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)]'
            )}
          >
            <Filter size={14} />
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center">
          <p className="text-[var(--olu-text-secondary)]">No tasks{filter !== 'all' ? ` with status "${filter.replace('_', ' ')}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status]
            const Icon = cfg.icon
            return (
              <div key={task.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 flex items-start gap-4">
                <div className={clsx('mt-0.5 flex-shrink-0', cfg.color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{task.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
                    <span className="text-xs text-[var(--olu-text-secondary)]">Assigned to {task.owner}</span>
                    {task.due && <span className="text-xs text-[var(--olu-text-secondary)]">Due {task.due}</span>}
                  </div>
                  {task.status === 'in_progress' && task.progress > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-[var(--olu-text-secondary)] text-xs flex-shrink-0">{task.progress}%</span>
                    </div>
                  )}
                  {/* Agent execution UI */}
                  {(() => {
                    const exec = executions.get(task.id)
                    if (exec?.state === 'running') {
                      return (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Agent is working...</span>
                        </div>
                      )
                    }
                    if (exec?.state === 'approval') {
                      return (
                        <div className="mt-3 p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
                          <p className="text-xs text-amber-300 mb-2">Agent needs approval to complete this task</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproval(task.id, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                            >
                              <ThumbsUp size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleApproval(task.id, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                              <ThumbsDown size={12} /> Reject
                            </button>
                          </div>
                        </div>
                      )
                    }
                    if (exec?.state === 'done') {
                      return (
                        <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>{exec.response ? String(exec.response).slice(0, 100) : 'Task completed by agent'}</span>
                        </div>
                      )
                    }
                    if (exec?.state === 'error') {
                      return (
                        <div className="mt-3 text-xs text-red-400">
                          Error: {exec.error}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
                {/* Run agent button for AI agents with pending tasks */}
                {task.isAiAgent && task.status === 'pending' && !executions.has(task.id) && (
                  <button
                    onClick={() => handleRunAgent(task)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 text-xs font-medium hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
                  >
                    <Play size={14} /> Run
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
