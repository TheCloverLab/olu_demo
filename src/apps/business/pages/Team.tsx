import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, CheckSquare, MessageCircle, Bot, Zap, Circle, ShieldCheck, UserPlus, Mail, Briefcase, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceTeamSnapshotForUser } from '../../../domain/team/api'
import type { WorkspaceAgentWithTasks, WorkspaceEmployee } from '../../../lib/supabase'
import clsx from 'clsx'

type GroupChat = {
  id: string
  chat_key?: string
  name: string
  icons: string[]
  last_message?: string
  last_time?: string
}

type AgentWithTasks = WorkspaceAgentWithTasks

const ROLE_COLORS: Record<string, string> = {
  'IP Manager': 'bg-violet-500/15 text-violet-400',
  'Legal Officer': 'bg-amber-500/15 text-amber-400',
  'Community Manager': 'bg-cyan-500/15 text-cyan-400',
  'Growth Officer': 'bg-emerald-500/15 text-emerald-400',
  'Data Analyst': 'bg-blue-500/15 text-blue-400',
  'Creativity Officer': 'bg-pink-500/15 text-pink-400',
}

function StatusDot({ status }: { status: 'online' | 'offline' | 'busy' }) {
  return (
    <span
      className={clsx('w-2.5 h-2.5 rounded-full border-2 border-olu-card', {
        'bg-emerald-400': status === 'online',
        'bg-amber-400': status === 'busy',
        'bg-gray-500': status === 'offline',
      })}
    />
  )
}

function AgentRow({ agent }: { agent: AgentWithTasks }) {
  const navigate = useNavigate()
  const tasks = agent.tasks || []
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length

  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/${agent.agent_key || agent.id}`)}
      className="w-full flex items-center gap-3 p-4 rounded-[24px] text-left border border-cyan-500/10 bg-[#091523] hover:bg-[#0d1726] transition-colors shadow-[0_16px_40px_rgba(2,8,23,0.22)]"
    >
      <div className="relative flex-shrink-0">
        {agent.avatar_img ? (
          <img src={agent.avatar_img} alt={agent.name} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-xl font-bold text-white`}>
            {agent.name[0]}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={agent.status} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm">{agent.name}</span>
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[agent.role] || 'text-cyan-100/55 bg-cyan-500/10')}>
            {agent.role}
          </span>
        </div>
        <p className="text-cyan-100/45 text-xs line-clamp-1 mb-1">{agent.last_message || 'No messages yet'}</p>
        <p className="text-cyan-100/45 text-xs">{agent.last_time || '—'}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {pendingTasks > 0 && (
          <span className="text-xs bg-emerald-400 text-black rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {pendingTasks}
          </span>
        )}
        <ChevronRight size={16} className="text-cyan-100/45" />
      </div>
    </motion.button>
  )
}

function GroupRow({ group }: { group: GroupChat }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/grp-${group.chat_key || group.id}`)}
      className="w-full flex items-center gap-3 p-4 rounded-[24px] text-left border border-cyan-500/10 bg-[#091523] hover:bg-[#0d1726] transition-colors shadow-[0_16px_40px_rgba(2,8,23,0.22)]"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#0d1726] flex items-center justify-center border border-cyan-500/10">
          <div className="flex -space-x-1">
            {(group.icons || []).slice(0, 3).map((icon, i) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-0.5">{group.name}</p>
        <p className="text-cyan-100/45 text-xs line-clamp-1">{group.last_message || 'No messages yet'}</p>
        <p className="text-cyan-100/45 text-xs mt-0.5">{group.last_time || '—'}</p>
      </div>
      <ChevronRight size={16} className="text-cyan-100/45 flex-shrink-0" />
    </motion.button>
  )
}

const STATUS_DOT_COLOR: Record<string, string> = {
  online: 'bg-emerald-400',
  busy: 'bg-amber-400',
  offline: 'bg-gray-500',
}

function PersonRow({ emp }: { emp: WorkspaceEmployee }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/person/${emp.id}`)}
      className="w-full rounded-[24px] border border-cyan-500/10 bg-[#091523] p-4 flex items-start gap-3 shadow-[0_16px_40px_rgba(2,8,23,0.22)] text-left hover:bg-[#0d1726] transition-colors"
    >
      <div className="relative flex-shrink-0">
        {emp.avatar_img ? (
          <img src={emp.avatar_img} alt={emp.name} className="w-12 h-12 rounded-xl object-cover bg-[#0d1726]" />
        ) : (
          <div className={clsx('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm', emp.color)}>
            {emp.name.split(' ').map((n) => n[0]).join('')}
          </div>
        )}
        <div className={clsx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#091523]', STATUS_DOT_COLOR[emp.status])} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm">{emp.name}</span>
          <span className="text-xs text-cyan-100/45 capitalize flex items-center gap-1">
            <Circle size={6} className={STATUS_DOT_COLOR[emp.status]} fill="currentColor" />
            {emp.status}
          </span>
        </div>
        <p className="text-cyan-100/55 text-xs flex items-center gap-1.5">
          <Briefcase size={12} />
          {emp.position}
        </p>
        {emp.email && (
          <p className="text-cyan-100/45 text-xs mt-0.5 flex items-center gap-1.5">
            <Mail size={12} />
            {emp.email}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {(emp.skills || []).map((skill) => (
            <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-100/60 font-medium">
              {skill}
            </span>
          ))}
          {emp.salary_label && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              {emp.salary_label}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-cyan-100/45 flex-shrink-0 mt-3" />
    </motion.button>
  )
}

export default function Team() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<AgentWithTasks[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [humans, setHumans] = useState<WorkspaceEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setAgents([])
        setGroups([])
        setHumans([])
        setLoading(false)
        return
      }

      try {
        const team = await getWorkspaceTeamSnapshotForUser(user)
        setAgents(team.agents)
        setGroups((team.groups || []) as GroupChat[])
        setHumans(team.humans || [])
      } catch (error) {
        console.error('Failed to load team data', error)
        setAgents([])
        setGroups([])
        setHumans([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const totalTasks = useMemo(
    () => agents.reduce((acc, a) => acc + ((a.tasks || []).filter((t) => t.status !== 'done').length || 0), 0),
    [agents]
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24 md:pb-8 flex items-center justify-center">
        <p className="text-cyan-100/60 text-sm">Loading team...</p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24 md:pb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#091422] border border-cyan-500/10 flex items-center justify-center text-4xl mb-4">🤖</div>
        <h2 className="font-bold text-xl mb-2">No AI Agents Yet</h2>
        <p className="text-cyan-100/55 text-sm max-w-xs mb-6">
          You do not have AI agents configured yet. Open AI Config to start building your team.
        </p>
        <button
          onClick={() => {
            window.location.href = '/business/agents'
          }}
          className="px-6 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Browse AI Agent Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black text-2xl">Team</h1>
          <p className="text-cyan-100/60 text-sm mt-0.5">
            {agents.length} AI agent{agents.length > 1 ? 's' : ''} · {humans.length} people ·{' '}
            {totalTasks > 0 ? `${totalTasks} active task${totalTasks > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#091422] border border-cyan-500/10 flex items-center justify-center">
          <Users size={18} className="text-cyan-200" />
        </div>
      </div>

      <div className="rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(14,28,48,0.92),rgba(8,18,33,0.86))] p-5 mb-6 shadow-[0_18px_60px_rgba(2,8,23,0.32)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0a1525] border border-cyan-400/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-cyan-200" />
          </div>
          <div>
            <p className="font-semibold">Workspace command layer</p>
            <p className="text-cyan-100/60 text-sm">Your team roster now comes from workspace-backed agents and task queues instead of front-end mock state.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Agents', value: agents.length, icon: Bot, iconClass: 'text-sky-300', iconBg: 'bg-sky-500/15' },
          { label: 'Active Tasks', value: totalTasks, icon: Zap, iconClass: 'text-amber-300', iconBg: 'bg-amber-500/15' },
          { label: 'Online', value: agents.filter((a) => a.status === 'online').length, icon: Circle, iconClass: 'text-emerald-300', iconBg: 'bg-emerald-500/15' },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] p-4 text-center border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
            <div className="flex justify-center mb-2">
              <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', card.iconBg)}>
                <card.icon size={15} className={card.iconClass} fill={card.label === 'Online' ? 'currentColor' : 'none'} />
              </span>
            </div>
            <div className="font-black text-xl">{card.value}</div>
            <div className="text-cyan-100/55 text-xs">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={14} className="text-cyan-100/55" />
          <p className="text-cyan-100/55 text-xs font-semibold uppercase tracking-wider">Direct</p>
        </div>
        <div className="space-y-2">
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {groups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={14} className="text-cyan-100/55" />
            <p className="text-cyan-100/55 text-xs font-semibold uppercase tracking-wider">Group Chats</p>
          </div>
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {humans.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-cyan-100/55" />
              <p className="text-cyan-100/55 text-xs font-semibold uppercase tracking-wider">People</p>
              <span className="text-cyan-100/35 text-xs">{humans.filter((h) => h.status === 'online').length} online</span>
            </div>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/60 text-xs font-medium hover:bg-[#12213a] transition-colors"
            >
              <UserPlus size={12} />
              Invite
            </button>
          </div>

          {showInvite && (
            <div className="rounded-2xl border border-cyan-500/20 bg-[#091422] p-5 mb-3 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-cyan-100/45 block mb-1">Full name</label>
                  <input type="text" placeholder="Jane Doe" className="w-full bg-[#0d1726] border border-cyan-500/10 rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30" />
                </div>
                <div>
                  <label className="text-xs text-cyan-100/45 block mb-1">Email</label>
                  <input type="email" placeholder="jane@company.com" className="w-full bg-[#0d1726] border border-cyan-500/10 rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30" />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors">
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {humans.map((emp) => (
              <PersonRow key={emp.id} emp={emp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
