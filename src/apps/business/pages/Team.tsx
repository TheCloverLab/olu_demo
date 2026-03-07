import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, CheckSquare, MessageCircle, Bot, Zap, Circle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getAgentsWithTasks, getGroupChatsByUser } from '../../../services/api'
import type { AIAgent, AgentTask } from '../../../lib/supabase'
import clsx from 'clsx'

type GroupChat = {
  id: string
  chat_key?: string
  name: string
  icons: string[]
  last_message?: string
  last_time?: string
}

type AgentWithTasks = AIAgent & { tasks?: AgentTask[] }

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
      onClick={() => navigate(`/team/${agent.agent_key || agent.id}`)}
      className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left"
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
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[agent.role] || 'text-olu-muted bg-white/05')}>
            {agent.role}
          </span>
        </div>
        <p className="text-olu-muted text-xs line-clamp-1 mb-1">{agent.last_message || 'No messages yet'}</p>
        <p className="text-olu-muted text-xs">{agent.last_time || '—'}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {pendingTasks > 0 && (
          <span className="text-xs bg-emerald-400 text-black rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {pendingTasks}
          </span>
        )}
        <ChevronRight size={16} className="text-olu-muted" />
      </div>
    </motion.button>
  )
}

function GroupRow({ group }: { group: GroupChat }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/team/grp-${group.chat_key || group.id}`)}
      className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <div className="flex -space-x-1">
            {(group.icons || []).slice(0, 3).map((icon, i) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-0.5">{group.name}</p>
        <p className="text-olu-muted text-xs line-clamp-1">{group.last_message || 'No messages yet'}</p>
        <p className="text-olu-muted text-xs mt-0.5">{group.last_time || '—'}</p>
      </div>
      <ChevronRight size={16} className="text-olu-muted flex-shrink-0" />
    </motion.button>
  )
}

export default function Team() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<AgentWithTasks[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setAgents([])
        setGroups([])
        setLoading(false)
        return
      }

      try {
        const [agentsData, groupsData] = await Promise.all([
          getAgentsWithTasks(user.id),
          getGroupChatsByUser(user.id),
        ])
        setAgents(agentsData)
        setGroups((groupsData || []) as GroupChat[])
      } catch (error) {
        console.error('Failed to load team data', error)
        setAgents([])
        setGroups([])
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
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 md:pb-6 flex items-center justify-center">
        <p className="text-olu-muted text-sm">Loading team...</p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 md:pb-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-olu-card flex items-center justify-center text-4xl mb-4">🤖</div>
        <h2 className="font-bold text-xl mb-2">No AI Agents Yet</h2>
        <p className="text-olu-muted text-sm max-w-xs mb-6">
          You do not have AI agents configured yet. Open AI Config to start building your team.
        </p>
        <button
          onClick={() => {
            window.location.href = '/ai-config'
          }}
          className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Browse AI Agent Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black text-2xl">My Team</h1>
          <p className="text-olu-muted text-sm mt-0.5">
            {agents.length} AI Agent{agents.length > 1 ? 's' : ''} ·{' '}
            {totalTasks > 0 ? `${totalTasks} active task${totalTasks > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Agents', value: agents.length, icon: Bot, iconClass: 'text-sky-300', iconBg: 'bg-sky-500/15' },
          { label: 'Active Tasks', value: totalTasks, icon: Zap, iconClass: 'text-amber-300', iconBg: 'bg-amber-500/15' },
          { label: 'Online', value: agents.filter((a) => a.status === 'online').length, icon: Circle, iconClass: 'text-emerald-300', iconBg: 'bg-emerald-500/15' },
        ].map((card) => (
          <div key={card.label} className="glass rounded-xl p-3 text-center">
            <div className="flex justify-center mb-2">
              <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', card.iconBg)}>
                <card.icon size={15} className={card.iconClass} fill={card.label === 'Online' ? 'currentColor' : 'none'} />
              </span>
            </div>
            <div className="font-black text-xl">{card.value}</div>
            <div className="text-olu-muted text-xs">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={14} className="text-olu-muted" />
          <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider">Direct</p>
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
            <CheckSquare size={14} className="text-olu-muted" />
            <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider">Group Chats</p>
          </div>
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
