import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2, Shield } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getTeamEmployeesForUser } from '../../../domain/team/api'
import type { ApprovalStatus } from '../../../domain/team/types'

type ApprovalItem = {
  id: string
  title: string
  status: ApprovalStatus
  requestedBy: string
  createdAt: string
}

const STATUS_CFG: Record<ApprovalStatus, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Rejected' },
}

// Demo approval records derived from employee tasks that need sign-off
function deriveApprovals(employees: Awaited<ReturnType<typeof getTeamEmployeesForUser>>): ApprovalItem[] {
  const approvals: ApprovalItem[] = []
  for (const emp of employees) {
    for (const task of emp.tasks || []) {
      if (task.priority === 'high') {
        approvals.push({
          id: `approval-${task.id}`,
          title: `Approve: ${task.title}`,
          status: task.status === 'done' ? 'approved' : task.status === 'cancelled' ? 'rejected' : 'pending',
          requestedBy: emp.name,
          createdAt: emp.hired_at || 'Recently',
        })
      }
    }
  }
  if (approvals.length === 0) {
    approvals.push(
      { id: 'demo-1', title: 'Publish holiday campaign to Instagram', status: 'pending', requestedBy: 'Marketing Agent', createdAt: '2 hours ago' },
      { id: 'demo-2', title: 'Budget increase for TikTok ads ($200 → $500)', status: 'pending', requestedBy: 'Ad Optimizer', createdAt: '4 hours ago' },
      { id: 'demo-3', title: 'New product listing: Summer Collection', status: 'approved', requestedBy: 'Product Agent', createdAt: 'Yesterday' },
      { id: 'demo-4', title: 'Refund request #4821 — damaged item', status: 'rejected', requestedBy: 'Support Agent', createdAt: '2 days ago' },
    )
  }
  return approvals
}

export default function ApprovalCenter() {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ApprovalStatus>('all')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getTeamEmployeesForUser(user)
      .then((emps) => setApprovals(deriveApprovals(emps)))
      .catch(() => setApprovals(deriveApprovals([])))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = filter === 'all' ? approvals : approvals.filter((a) => a.status === filter)
  const counts = {
    all: approvals.length,
    pending: approvals.filter((a) => a.status === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved').length,
    rejected: approvals.filter((a) => a.status === 'rejected').length,
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
          <h1 className="font-black text-2xl">Approval Center</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
          <Shield size={18} className="text-cyan-300" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
              filter === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)]'
            )}
          >
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center">
          <p className="text-[var(--olu-text-secondary)]">No approvals{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = STATUS_CFG[item.status]
            const Icon = cfg.icon
            return (
              <div key={item.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 flex items-start gap-4">
                <div className={clsx('mt-0.5 flex-shrink-0', cfg.color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className="text-xs text-[var(--olu-text-secondary)]">by {item.requestedBy}</span>
                    <span className="text-xs text-[var(--olu-text-secondary)]">{item.createdAt}</span>
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                        Approve
                      </button>
                      <button className="px-4 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                        Reject
                      </button>
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
