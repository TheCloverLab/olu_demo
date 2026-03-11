import { useEffect, useState } from 'react'
import { Loader2, UserPlus, Users2, Mail, Briefcase, Circle } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import type { Employee } from '../../../domain/team/types'

// Demo human employees — in production these come from workspace_employees table
const DEMO_HUMANS: Employee[] = [
  {
    id: 'human-1', workspace_id: 'ws-1', kind: 'human', name: 'Sarah Kim',
    position: 'Community Manager', description: 'Manages fan community engagement and moderation',
    avatar_img: null, color: 'from-purple-500 to-pink-500', status: 'online', employment_status: 'active',
    template_id: null, agent_key: null, model_tier: null,
    user_id: 'u-sarah', email: 'sarah@example.com',
    hired_by_user_id: null, hired_at: '2024-01-15', skills: ['Community', 'Content', 'Moderation'],
    salary_label: '$4,200/mo', last_message: 'Updated community guidelines', last_time: '10m ago',
    created_at: '2024-01-15', updated_at: '2024-03-01',
  },
  {
    id: 'human-2', workspace_id: 'ws-1', kind: 'human', name: 'James Okoro',
    position: 'Growth Lead', description: 'Drives user acquisition and retention strategy',
    avatar_img: null, color: 'from-emerald-500 to-teal-500', status: 'busy', employment_status: 'active',
    template_id: null, agent_key: null, model_tier: null,
    user_id: 'u-james', email: 'james@example.com',
    hired_by_user_id: null, hired_at: '2024-02-01', skills: ['Analytics', 'SEO', 'Paid Ads'],
    salary_label: '$5,800/mo', last_message: 'Reviewing Q1 metrics', last_time: '1h ago',
    created_at: '2024-02-01', updated_at: '2024-03-01',
  },
  {
    id: 'human-3', workspace_id: 'ws-1', kind: 'human', name: 'Mia Chen',
    position: 'Content Creator', description: 'Produces course materials and marketing copy',
    avatar_img: null, color: 'from-amber-500 to-orange-500', status: 'offline', employment_status: 'active',
    template_id: null, agent_key: null, model_tier: null,
    user_id: 'u-mia', email: 'mia@example.com',
    hired_by_user_id: null, hired_at: '2024-03-01', skills: ['Writing', 'Video', 'Design'],
    salary_label: '$3,900/mo', last_message: 'Finished course outline draft', last_time: '3h ago',
    created_at: '2024-03-01', updated_at: '2024-03-09',
  },
]

const STATUS_DOT: Record<string, string> = {
  online: 'bg-emerald-400',
  busy: 'bg-amber-400',
  offline: 'bg-gray-500',
}

export default function HumanEmployees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    // Simulated fetch — in production, query workspace_employees WHERE kind='human'
    const t = setTimeout(() => {
      setEmployees(DEMO_HUMANS)
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [user?.id])

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
          <h1 className="font-black text-2xl">People</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {employees.length} members · {employees.filter((e) => e.status === 'online').length} online
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Invite member</span>
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-cyan-500/20 bg-[var(--olu-section-bg)] p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users2 size={16} className="text-cyan-300" />
            Invite a team member
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Full name</label>
              <input type="text" placeholder="Jane Doe" className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30" />
            </div>
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Email</label>
              <input type="email" placeholder="jane@company.com" className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30" />
            </div>
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Position</label>
              <input type="text" placeholder="Marketing Manager" className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30" />
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {employees.map((emp) => (
          <div key={emp.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm', emp.color)}>
                {emp.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--olu-card-border)]', STATUS_DOT[emp.status])} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{emp.name}</p>
                <span className="text-xs text-[var(--olu-text-secondary)] capitalize flex items-center gap-1">
                  <Circle size={6} className={STATUS_DOT[emp.status]} fill="currentColor" />
                  {emp.status}
                </span>
              </div>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5 flex items-center gap-1.5">
                <Briefcase size={12} />
                {emp.position}
              </p>
              {emp.email && (
                <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5 flex items-center gap-1.5">
                  <Mail size={12} />
                  {emp.email}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {emp.skills.map((skill) => (
                  <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-[var(--olu-text-secondary)] font-medium">
                    {skill}
                  </span>
                ))}
                {emp.salary_label && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                    {emp.salary_label}
                  </span>
                )}
              </div>
              {emp.last_message && (
                <p className="text-[var(--olu-muted)] text-xs mt-2 truncate">
                  {emp.last_message} · {emp.last_time}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
