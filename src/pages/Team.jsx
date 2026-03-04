import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, CheckSquare, MessageCircle, Bot } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { AI_AGENTS, GROUP_CHATS } from '../data/mock'
import clsx from 'clsx'

function StatusDot({ status }) {
  return (
    <span className={clsx('w-2.5 h-2.5 rounded-full border-2 border-olu-card', {
      'bg-emerald-400': status === 'online',
      'bg-amber-400': status === 'busy',
      'bg-gray-500': status === 'offline',
    })} />
  )
}

function AgentRow({ agent }) {
  const navigate = useNavigate()
  const tasks = agent.tasks || []
  const pendingTasks = tasks.filter(t => t.status !== 'done').length

  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/team/${agent.id}`)}
      className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl`}>
          {agent.icon}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={agent.status} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm">{agent.name}</span>
          <span className="text-xs text-olu-muted bg-white/05 px-2 py-0.5 rounded-full">{agent.role}</span>
        </div>
        <p className="text-olu-muted text-xs line-clamp-1 mb-1">{agent.lastMessage}</p>
        <p className="text-olu-muted text-xs">{agent.lastTime}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {pendingTasks > 0 && (
          <span className="text-xs bg-[#7c3aed] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingTasks}</span>
        )}
        <ChevronRight size={16} className="text-olu-muted" />
      </div>
    </motion.button>
  )
}

function GroupRow({ group }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/team/grp-${group.id}`)}
      className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <div className="flex -space-x-1">
            {group.icons.slice(0, 3).map((icon, i) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-0.5">{group.name}</p>
        <p className="text-olu-muted text-xs line-clamp-1">{group.lastMessage}</p>
        <p className="text-olu-muted text-xs mt-0.5">{group.lastTime}</p>
      </div>
      <ChevronRight size={16} className="text-olu-muted flex-shrink-0" />
    </motion.button>
  )
}

export default function Team() {
  const { currentRole } = useApp()
  const agents = AI_AGENTS[currentRole] || []
  const groups = GROUP_CHATS[currentRole] || []

  const totalTasks = agents.reduce((acc, a) => acc + (a.tasks?.filter(t => t.status !== 'done').length || 0), 0)

  if (agents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 md:pb-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-olu-card flex items-center justify-center text-4xl mb-4">🤖</div>
        <h2 className="font-bold text-xl mb-2">No AI Agents Yet</h2>
        <p className="text-olu-muted text-sm max-w-xs mb-6">Your role doesn't have AI agents configured. Switch to Creator, Advertiser, or Supplier to see an active team.</p>
        <button onClick={() => window.location.href = '/ai-config'} className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Browse AI Agent Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black text-2xl">My Team</h1>
          <p className="text-olu-muted text-sm mt-0.5">
            {agents.length} AI Agent{agents.length > 1 ? 's' : ''} · {totalTasks > 0 ? `${totalTasks} active task${totalTasks > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Agents', value: agents.length, icon: '🤖' },
          { label: 'Active Tasks', value: totalTasks, icon: '⚡' },
          { label: 'Online', value: agents.filter(a => a.status === 'online').length, icon: '🟢' },
        ].map(card => (
          <div key={card.label} className="glass rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{card.icon}</div>
            <div className="font-black text-xl">{card.value}</div>
            <div className="text-olu-muted text-xs">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Agents */}
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

      {/* Groups */}
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
