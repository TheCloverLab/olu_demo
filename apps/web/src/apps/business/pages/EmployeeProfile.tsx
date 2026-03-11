import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, Mail, Calendar, Circle, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import { getWorkspaceEmployeeById } from '../../../domain/team/api'
import type { WorkspaceEmployee } from '../../../lib/supabase'

const STATUS_COLOR: Record<string, { dot: string; label: string }> = {
  online: { dot: 'bg-emerald-400', label: 'text-emerald-400' },
  busy: { dot: 'bg-amber-400', label: 'text-amber-400' },
  offline: { dot: 'bg-gray-500', label: 'text-gray-400' },
}

export default function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<WorkspaceEmployee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    getWorkspaceEmployeeById(employeeId)
      .then(setEmployee)
      .finally(() => setLoading(false))
  }, [employeeId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
        <p className="text-[var(--olu-text-secondary)] text-sm">Loading profile...</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-[var(--olu-text-secondary)] mb-4">Employee not found</p>
        <button onClick={() => navigate('/business/team')} className="text-cyan-300 text-sm hover:underline">
          Back to Team
        </button>
      </div>
    )
  }

  const sc = STATUS_COLOR[employee.status] || STATUS_COLOR.offline

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
      <button
        onClick={() => navigate('/business/team')}
        className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-sm hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Team
      </button>

      <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
        {/* Header with avatar */}
        <div className="relative p-6 pb-0">
          <div className="absolute inset-0 h-28 bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
          <div className="relative flex items-end gap-4">
            {employee.avatar_img ? (
              <img
                src={employee.avatar_img}
                alt={employee.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#091422] bg-[var(--olu-card-bg)]"
              />
            ) : (
              <div className={clsx(
                'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white border-4 border-[#091422]',
                employee.color
              )}>
                {employee.name.split(' ').map((n) => n[0]).join('')}
              </div>
            )}
            <div className="pb-2">
              <h1 className="font-black text-xl">{employee.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx('text-xs capitalize flex items-center gap-1', sc.label)}>
                  <Circle size={6} className={sc.dot} fill="currentColor" />
                  {employee.status}
                </span>
                <span className="text-cyan-100/30">·</span>
                <span className="text-xs text-[var(--olu-text-secondary)] capitalize">{employee.employment_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Position & description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--olu-sidebar-text)] text-sm">
              <Briefcase size={14} />
              <span className="font-medium">{employee.position}</span>
            </div>
            {employee.description && (
              <p className="text-[var(--olu-text-secondary)] text-sm leading-relaxed">{employee.description}</p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {employee.email && (
              <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                <div className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-xs mb-1">
                  <Mail size={12} />
                  Email
                </div>
                <p className="text-sm">{employee.email}</p>
              </div>
            )}
            {employee.salary_label && (
              <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                <div className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-xs mb-1">
                  <DollarSign size={12} />
                  Compensation
                </div>
                <p className="text-sm text-emerald-400 font-medium">{employee.salary_label}</p>
              </div>
            )}
            {employee.hired_at && (
              <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                <div className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-xs mb-1">
                  <Calendar size={12} />
                  Joined
                </div>
                <p className="text-sm">{new Date(employee.hired_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div>
              <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-[var(--olu-sidebar-text)] text-sm font-medium border border-[var(--olu-card-border)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
