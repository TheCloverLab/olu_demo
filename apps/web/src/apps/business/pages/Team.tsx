import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ChevronRight, CheckSquare, MessageCircle, Bot, Zap, Circle, ShieldCheck, UserPlus, Mail, Briefcase, Users, Play, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceTeamSnapshotForUser } from '../../../domain/team/api'
import { ensureWorkspaceForUser } from '../../../domain/workspace/api'
import { batchRunAgents, invokeAgent } from '../../../domain/agent/runtime-api'
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
  'Legal Officer': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'Community Manager': 'bg-[var(--olu-accent-bg-strong)] text-cyan-600 dark:text-cyan-400',
  'Growth Officer': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'Data Analyst': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
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

function AgentRow({ agent, onRun, isRunning }: { agent: AgentWithTasks; onRun?: (agent: AgentWithTasks) => void; isRunning?: boolean }) {
  const navigate = useNavigate()
  const tasks = agent.tasks || []
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="w-full flex items-center gap-3 p-4 rounded-[24px] text-left border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] hover:bg-[var(--olu-card-bg)] transition-colors shadow-[0_2px_8px_rgba(2,8,23,0.12)]">
      <motion.button
        whileHover={{ x: 4 }}
        onClick={() => navigate(`/business/team/${agent.agent_key || agent.id}`)}
        className="flex items-center gap-3 flex-1 min-w-0"
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 font-semibold uppercase tracking-wide">AI</span>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[agent.role] || 'text-[var(--olu-text-secondary)] bg-[var(--olu-accent-bg)]')}>
              {agent.role}
            </span>
          </div>
          <p className="text-[var(--olu-text-secondary)] text-xs line-clamp-1 mb-1">{agent.last_message || 'No messages yet'}</p>
          <p className="text-[var(--olu-text-secondary)] text-xs">{agent.last_time || '—'}</p>
        </div>
      </motion.button>
      <div className="flex items-center gap-2 flex-shrink-0">
        {pendingTasks > 0 && (
          <span className="text-xs bg-emerald-400 text-black rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {pendingTasks}
          </span>
        )}
        {onRun && (
          <button
            onClick={(e) => { e.stopPropagation(); onRun(agent) }}
            disabled={isRunning}
            className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
            title="Run agent"
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          </button>
        )}
        <ChevronRight size={16} className="text-[var(--olu-text-secondary)]" />
      </div>
    </div>
  )
}

function GroupRow({ group }: { group: GroupChat }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/business/team/grp-${group.chat_key || group.id}`)}
      className="w-full flex items-center gap-3 p-4 rounded-[24px] text-left border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] hover:bg-[var(--olu-card-bg)] transition-colors shadow-[0_2px_8px_rgba(2,8,23,0.12)]"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[var(--olu-card-bg)] flex items-center justify-center border border-[var(--olu-card-border)]">
          <div className="flex -space-x-1">
            {(group.icons || []).slice(0, 3).map((icon, i) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-0.5">{group.name}</p>
        <p className="text-[var(--olu-text-secondary)] text-xs line-clamp-1">{group.last_message || 'No messages yet'}</p>
        <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5">{group.last_time || '—'}</p>
      </div>
      <ChevronRight size={16} className="text-[var(--olu-text-secondary)] flex-shrink-0" />
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
      className="w-full rounded-[24px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 flex items-start gap-3 shadow-[0_2px_8px_rgba(2,8,23,0.12)] text-left hover:bg-[var(--olu-card-bg)] transition-colors"
    >
      <div className="relative flex-shrink-0">
        {emp.avatar_img ? (
          <img src={emp.avatar_img} alt={emp.name} className="w-12 h-12 rounded-xl object-cover bg-[var(--olu-card-bg)]" />
        ) : (
          <div className={clsx('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm', emp.color)}>
            {emp.name.split(' ').map((n) => n[0]).join('')}
          </div>
        )}
        <div className={clsx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--olu-section-bg)]', STATUS_DOT_COLOR[emp.status])} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm">{emp.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold uppercase tracking-wide">Human</span>
          <span className="text-xs text-[var(--olu-text-secondary)] capitalize flex items-center gap-1">
            <Circle size={6} className={STATUS_DOT_COLOR[emp.status]} fill="currentColor" />
            {emp.status}
          </span>
        </div>
        <p className="text-[var(--olu-text-secondary)] text-xs flex items-center gap-1.5">
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
          {(emp.skills || []).map((skill) => (
            <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-[var(--olu-accent-bg)] text-[var(--olu-text-secondary)] font-medium">
              {skill}
            </span>
          ))}
          {emp.salary_label && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              {emp.salary_label}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--olu-text-secondary)] flex-shrink-0 mt-3" />
    </motion.button>
  )
}

export default function Team() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [agents, setAgents] = useState<AgentWithTasks[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [humans, setHumans] = useState<WorkspaceEmployee[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [runningAll, setRunningAll] = useState(false)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)
  const [lastRunResult, setLastRunResult] = useState<string | null>(null)

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
        const [team, membership] = await Promise.all([
          getWorkspaceTeamSnapshotForUser(user),
          ensureWorkspaceForUser(user),
        ])
        setAgents(team.agents)
        setGroups((team.groups || []) as GroupChat[])
        setHumans(team.humans || [])
        setWorkspaceId(membership.workspace_id)
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

  async function reload() {
    if (!user?.id) return
    const team = await getWorkspaceTeamSnapshotForUser(user)
    setAgents(team.agents)
  }

  async function handleRunAll() {
    if (!workspaceId || runningAll) return
    setRunningAll(true)
    setLastRunResult(null)
    try {
      const result = await batchRunAgents(workspaceId)
      const summaries = result.results
        .filter((r) => r.summary)
        .map((r) => `${r.agentName}: ${r.summary}`)
      setLastRunResult(summaries.length > 0 ? summaries.join('\n') : 'All agents ran — no actions taken.')
      await reload()
    } catch (err: any) {
      setLastRunResult(`Error: ${err.message}`)
    } finally {
      setRunningAll(false)
    }
  }

  async function handleRunAgent(agent: AgentWithTasks) {
    if (!workspaceId || runningAgent) return
    setRunningAgent(agent.id)
    setLastRunResult(null)
    try {
      const result = await invokeAgent({
        workspaceId,
        agentId: agent.id,
        agentName: agent.name,
        agentPosition: agent.role,
        taskDescription: 'Review your pending tasks and take action on the highest priority items.',
      })
      setLastRunResult(`${agent.name}: ${result.summary || result.plan || 'No actions taken.'}`)
      await reload()
    } catch (err: any) {
      setLastRunResult(`Error: ${err.message}`)
    } finally {
      setRunningAgent(null)
    }
  }

  const totalTasks = useMemo(
    () => agents.reduce((acc, a) => acc + ((a.tasks || []).filter((t) => t.status !== 'done').length || 0), 0),
    [agents]
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24 md:pb-8 flex items-center justify-center">
        <p className="text-[var(--olu-text-secondary)] text-sm">Loading team...</p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 pb-24 md:pb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center text-4xl mb-4">🤖</div>
        <h2 className="font-bold text-xl mb-2">No AI Agents Yet</h2>
        <p className="text-[var(--olu-text-secondary)] text-sm max-w-xs mb-6">
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
          <h1 className="font-black text-2xl">{t('team.title')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-0.5">
            {t('team.subtitle', { agents: agents.length, people: humans.length, tasks: totalTasks })}
          </p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={runningAll || !!runningAgent}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runningAll ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {runningAll ? t('common.loading') : t('common.runAllAgents')}
        </button>
      </div>

      {lastRunResult && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
          <p className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold uppercase tracking-wider mb-1">Agent Execution Result</p>
          <p className="text-sm text-[var(--olu-text-secondary)] whitespace-pre-line">{lastRunResult}</p>
          <button onClick={() => setLastRunResult(null)} className="text-xs text-[var(--olu-muted)] mt-2 hover:text-[var(--olu-text)]">{t('common.dismiss')}</button>
        </div>
      )}

      <div className="rounded-[28px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
            <ShieldCheck size={18} className="text-cyan-600 dark:text-cyan-300" />
          </div>
          <div>
            <p className="font-semibold">{t('team.commandLayer')}</p>
            <p className="text-[var(--olu-text-secondary)] text-sm">{t('team.commandLayerDesc')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t('team.agents'), value: agents.length, icon: Bot, iconClass: 'text-sky-600 dark:text-sky-300', iconBg: 'bg-sky-500/15', fillIcon: false },
          { label: t('chat.activeTasks'), value: totalTasks, icon: Zap, iconClass: 'text-amber-600 dark:text-amber-300', iconBg: 'bg-amber-500/15', fillIcon: false },
          { label: t('common.online'), value: agents.filter((a) => a.status === 'online').length, icon: Circle, iconClass: 'text-emerald-600 dark:text-emerald-300', iconBg: 'bg-emerald-500/15', fillIcon: true },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] p-4 text-center border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_8px_rgba(2,8,23,0.12)]">
            <div className="flex justify-center mb-2">
              <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', card.iconBg)}>
                <card.icon size={15} className={card.iconClass} fill={card.fillIcon ? 'currentColor' : 'none'} />
              </span>
            </div>
            <div className="font-black text-xl">{card.value}</div>
            <div className="text-[var(--olu-text-secondary)] text-xs">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={14} className="text-[var(--olu-text-secondary)]" />
          <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('team.direct')}</p>
        </div>
        <div className="space-y-2">
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onRun={handleRunAgent} isRunning={runningAgent === agent.id} />
          ))}
        </div>
      </div>

      {groups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={14} className="text-[var(--olu-text-secondary)]" />
            <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider">Group Chats</p>
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
              <Users size={14} className="text-[var(--olu-text-secondary)]" />
              <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider">{t('team.people')}</p>
              <span className="text-[var(--olu-muted)] text-xs">{humans.filter((h) => h.status === 'online').length} online</span>
            </div>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors"
            >
              <UserPlus size={12} />
              {t('common.invite')}
            </button>
          </div>

          {showInvite && (
            <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 mb-3 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Full name</label>
                  <input type="text" placeholder="Jane Doe" className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-[var(--olu-card-border)]" />
                </div>
                <div>
                  <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Email</label>
                  <input type="email" placeholder="jane@company.com" className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-[var(--olu-card-border)]" />
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
