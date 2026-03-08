import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Plus, Settings, Trash2, ShoppingBag, Check, Star, Sparkles, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getAgentTemplates, getWorkspaceAgentsForUser, hireWorkspaceAgent } from '../../../domain/agent/api'
import type { AgentTemplate, WorkspaceAgent } from '../../../lib/supabase'

function AgentCard({
  agent,
  hired,
  onHire,
}: {
  agent: AgentTemplate
  hired: boolean
  onHire: (agent: AgentTemplate) => void
}) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-[28px] p-4 flex flex-col border border-cyan-400/10 bg-[#091523] shadow-[0_16px_40px_rgba(3,8,19,0.28)] hover:bg-[#0e1b2d] transition-colors">
      <img src={agent.avatar_img || ''} alt={agent.name} className="w-12 h-12 rounded-xl object-cover mb-3" />
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-sm">{agent.name}</h3>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', agent.price_label === 'Free' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-cyan-500/10 text-cyan-100/70')}>
          {agent.price_label}
        </span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <Star size={11} className="text-amber-400" fill="currentColor" />
        <span className="text-xs font-semibold">{agent.rating}</span>
        <span className="text-olu-muted text-xs">({agent.reviews.toLocaleString()})</span>
      </div>
      <p className="text-cyan-100/60 text-xs leading-relaxed flex-1 mb-2">{agent.description}</p>
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-200 font-medium">{agent.model}</span>
        <span className="text-cyan-100/55">${agent.cost_per_1k}/1K tokens</span>
      </div>
      <button
        onClick={() => onHire(agent)}
        disabled={hired}
        className={clsx(
          'w-full py-2 rounded-xl text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5',
          hired ? 'bg-emerald-500/15 text-emerald-300 cursor-default' : 'bg-white text-black hover:opacity-90'
        )}
      >
        {hired ? <Check size={12} /> : <Plus size={12} />}
        {hired ? 'Already hired' : 'Hire Agent'}
      </button>
    </motion.div>
  )
}

function HireModal({
  agent,
  loading,
  onClose,
  onConfirm,
}: {
  agent: AgentTemplate
  loading: boolean
  onClose: () => void
  onConfirm: (agent: AgentTemplate, name: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#08111d] border border-cyan-500/10 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-cyan-500/10">
            <h3 className="font-bold">Hire {agent.name}</h3>
            <p className="text-olu-muted text-xs mt-0.5">Give your new AI teammate a workspace name</p>
          </div>
          <div className="p-5">
            <img src={agent.avatar_img || ''} alt={agent.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
            <label className="text-xs font-semibold text-olu-muted uppercase tracking-wider block mb-2">Agent Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give your agent a name, like Ashley, Ada, or Luca."
              className="w-full p-3 bg-[#0d1726] rounded-xl text-sm focus:outline-none border border-cyan-500/10 focus:border-cyan-300/30 transition-colors mb-4 placeholder:text-cyan-100/35"
            />
            <p className="text-xs text-olu-muted mb-4">
              This agent will join your team as <strong>{name || agent.name}</strong>, {agent.role}. You can rename or remove them anytime.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 min-w-0 py-2.5 rounded-xl border border-cyan-500/10 text-sm font-medium text-cyan-100/60 hover:text-white transition-colors">Cancel</button>
              <button disabled={loading} onClick={() => onConfirm(agent, name || agent.name)} className="flex-1 min-w-0 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">
                {loading ? 'Hiring...' : 'Confirm Hire'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AIAgentConfig() {
  const { user } = useAuth()
  const [hireTarget, setHireTarget] = useState<AgentTemplate | null>(null)
  const [successAgent, setSuccessAgent] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [activeAgents, setActiveAgents] = useState<WorkspaceAgent[]>([])
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [hireLoading, setHireLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [activeData, templateData] = await Promise.all([
          getWorkspaceAgentsForUser(user),
          getAgentTemplates(),
        ])

        if (!cancelled) {
          setActiveAgents(activeData || [])
          setTemplates(templateData || [])
        }
      } catch (err) {
        console.error('Failed to load AI agents', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAgents()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const categories = ['All', 'Creator', 'Advertiser', 'Supplier', 'Pro']
  const filteredMarket = templates.filter((a) => filter === 'All' || a.category === filter)
  const hiredTemplateKeys = useMemo(() => new Set(activeAgents.map((agent) => agent.agent_key)), [activeAgents])

  async function handleConfirm(agent: AgentTemplate, name: string) {
    if (!user) return

    setHireLoading(true)
    try {
      const created = await hireWorkspaceAgent(user, agent, name)
      setActiveAgents((prev) => [...prev, created])
      setHireTarget(null)
      setSuccessAgent(created.name)
      setTimeout(() => setSuccessAgent(null), 3000)
    } catch (error) {
      console.error('Failed to hire workspace agent', error)
    } finally {
      setHireLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
      <div className="rounded-[32px] border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(17,33,53,0.96),rgba(8,19,34,0.88))] p-6 shadow-[0_18px_60px_rgba(2,8,23,0.35)] mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#091422] border border-cyan-500/10 flex items-center justify-center">
              <Bot size={18} className="text-cyan-200" />
            </div>
            <div>
              <h1 className="font-black text-2xl">AI Agents</h1>
              <p className="text-cyan-100/60 text-sm">Workspace-backed team members, marketplace templates, and operating coverage</p>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-cyan-400/10 bg-[#0a1525] p-4">
              <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Coverage</p>
              <p className="font-black text-2xl">{activeAgents.length}</p>
              <p className="text-cyan-100/60 text-xs mt-1">Active workspace operators</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/10 bg-[#0a1525] p-4">
              <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Templates</p>
              <p className="font-black text-2xl">{templates.length}</p>
              <p className="text-cyan-100/60 text-xs mt-1">Marketplace agents ready</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {successAgent && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <p className="text-emerald-300 text-sm font-medium"><strong>{successAgent}</strong> has joined your workspace.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="rounded-3xl border border-cyan-400/10 bg-[#091523] p-8 text-cyan-100/60 text-sm">
          Loading workspace agents...
        </div>
      ) : (
        <>
          {activeAgents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-cyan-200" />
                <p className="text-cyan-100/55 text-xs font-semibold uppercase tracking-wider">Your Team ({activeAgents.length})</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 p-4 rounded-[24px] group border border-cyan-400/10 bg-[#091523] hover:bg-[#0d1a2d] transition-colors shadow-[0_16px_40px_rgba(2,8,23,0.22)]">
                    <div className="relative flex-shrink-0">
                      {agent.avatar_img
                        ? <img src={agent.avatar_img} alt={agent.name} className="w-11 h-11 rounded-xl object-cover" />
                        : <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-xl font-bold text-white`}>{agent.name[0]}</div>
                      }
                      <div className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#091523]', agent.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{agent.name}</p>
                      <p className="text-cyan-100/55 text-xs">{agent.role}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"><Settings size={14} className="text-cyan-100/60" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-cyan-100/55" />
              <p className="font-bold text-lg">Agent Marketplace</p>
              <div className="ml-auto flex items-center gap-1 p-1 bg-[#091523] border border-cyan-500/10 rounded-xl overflow-x-auto scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={clsx('px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all', filter === category ? 'bg-cyan-300 text-[#04111f]' : 'text-cyan-100/60 hover:text-white')}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-cyan-400/10 bg-[#08111d] p-4 mb-4 flex items-center gap-3">
              <Sparkles size={16} className="text-cyan-200" />
              <p className="text-sm text-cyan-100/68">Templates are now sourced from Supabase so hiring a new agent updates your workspace state, not just local UI.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarket.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  hired={hiredTemplateKeys.has(agent.template_key)}
                  onHire={setHireTarget}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {hireTarget && (
        <HireModal agent={hireTarget} loading={hireLoading} onClose={() => setHireTarget(null)} onConfirm={handleConfirm} />
      )}
    </div>
  )
}
