import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, Filter, Loader2, Zap } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getTeamEmployeesForUser } from '../../../domain/team/api'
import type { EmployeeWithTasks, TeamTaskStatus } from '../../../domain/team/types'

const STATUS_CONFIG: Record<TeamTaskStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  pending: { icon: Circle, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'In Progress' },
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  cancelled: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Cancelled' },
}

const PRIORITY_COLOR = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-cyan-100/45 bg-cyan-500/10',
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
}

export default function TaskCenter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | TeamTaskStatus>('all')

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
    }))
  )

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
        <Loader2 className="animate-spin text-cyan-100/45" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-cyan-100/45 text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">Task Center</h1>
          <p className="text-cyan-100/55 text-sm mt-1">
            {counts.in_progress} in progress · {counts.pending} pending · {counts.done} completed
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#091422] border border-cyan-500/10 flex items-center justify-center">
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
              filter === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[#0d1726] text-cyan-100/60 border border-cyan-500/10 hover:bg-[#12213a]'
            )}
          >
            <Filter size={14} />
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-12 text-center">
          <p className="text-cyan-100/45">No tasks{filter !== 'all' ? ` with status "${filter.replace('_', ' ')}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status]
            const Icon = cfg.icon
            return (
              <div key={task.id} className="rounded-2xl border border-cyan-500/10 bg-[#091422] p-5 flex items-start gap-4">
                <div className={clsx('mt-0.5 flex-shrink-0', cfg.color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{task.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
                    <span className="text-xs text-cyan-100/45">Assigned to {task.owner}</span>
                    {task.due && <span className="text-xs text-cyan-100/45">Due {task.due}</span>}
                  </div>
                  {task.status === 'in_progress' && task.progress > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-cyan-100/45 text-xs flex-shrink-0">{task.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
