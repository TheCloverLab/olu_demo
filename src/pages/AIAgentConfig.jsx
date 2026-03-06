import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Plus, Settings, Trash2, ShoppingBag, Check, X, Star, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { AI_AGENTS } from '../data/mock'
import clsx from 'clsx'

const MARKETPLACE_AGENTS = [
  { id: 'ip_manager', name: 'IP Manager', avatarImg: '/images/agents/lisa.jpg', color: 'from-zinc-600 to-zinc-500', category: 'Creator', price: 'Free', rating: 4.9, reviews: 1240, description: 'Manages IP licensing, authorizations, and royalty collection.', model: 'GPT-4o', costPer1k: 0.005 },
  { id: 'legal', name: 'Legal Officer', avatarImg: '/images/agents/debian.jpg', color: 'from-red-500 to-rose-600', category: 'Creator', price: 'Free', rating: 4.8, reviews: 890, description: 'Monitors unauthorized use and sends DMCA takedowns.', model: 'Claude 3.5 Sonnet', costPer1k: 0.003 },
  { id: 'community', name: 'Community Manager', avatarImg: '/images/agents/aria.jpg', color: 'from-pink-500 to-rose-500', category: 'Creator', price: 'Free', rating: 4.7, reviews: 2100, description: 'Runs community events and rewards top customers.', model: 'Gemini 2.0 Flash', costPer1k: 0.0001 },
  { id: 'growth', name: 'Growth Officer', avatarImg: '/images/agents/zephyr.jpg', color: 'from-emerald-500 to-teal-600', category: 'Creator', price: 'Free', rating: 4.6, reviews: 1560, description: 'Drives follower and subscriber growth across platforms.', model: 'Claude 3.5 Sonnet', costPer1k: 0.003 },
  { id: 'analyst', name: 'Data Analyst', avatarImg: '/images/agents/eric.jpg', color: 'from-blue-500 to-indigo-600', category: 'Creator', price: 'Free', rating: 4.9, reviews: 3200, description: 'Deep analytics across all platforms with actionable insights.', model: 'GPT-4o', costPer1k: 0.005 },
  { id: 'creativity', name: 'Creativity Officer', avatarImg: '/images/agents/nova.jpg', color: 'from-orange-400 to-amber-500', category: 'Creator', price: 'Free', rating: 4.8, reviews: 2800, description: 'Content ideation based on trends and audience behavior.', model: 'Gemini 2.0 Flash', costPer1k: 0.0001 },
  { id: 'marketing', name: 'Marketing Manager', avatarImg: '/images/agents/max.jpg', color: 'from-blue-500 to-cyan-500', category: 'Advertiser', price: 'Free', rating: 4.7, reviews: 980, description: 'End-to-end influencer campaign planning and execution.', model: 'GPT-4o', costPer1k: 0.005 },
  { id: 'channel', name: 'Channel Manager', avatarImg: '/images/agents/chan.jpg', color: 'from-emerald-500 to-green-600', category: 'Supplier', price: 'Free', rating: 4.5, reviews: 560, description: 'Connects creators and suppliers for merch partnerships.', model: 'GPT-4o mini', costPer1k: 0.00015 },
  { id: 'finance', name: 'Finance Officer', avatarImg: '/images/agents/finance.jpg', color: 'from-yellow-500 to-amber-600', category: 'Pro', price: '$9.99/mo', rating: 4.9, reviews: 1100, description: 'Cross-border payments, invoicing, and financial reporting.', model: 'Claude 3.5 Sonnet', costPer1k: 0.003 },
  { id: 'translation', name: 'Localization Agent', avatarImg: '/images/agents/localization.jpg', color: 'from-cyan-500 to-blue-600', category: 'Pro', price: '$4.99/mo', rating: 4.6, reviews: 430, description: 'Translates and localizes content for global audiences.', model: 'Gemini 2.0 Flash', costPer1k: 0.0001 },
]

function AgentCard({ agent, onHire }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="glass glass-hover rounded-2xl p-4 flex flex-col">
      <img src={agent.avatarImg} alt={agent.name} className="w-12 h-12 rounded-xl object-cover mb-3" />
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-sm">{agent.name}</h3>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', agent.price === 'Free' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-olu-muted')}>{agent.price}</span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <Star size={11} className="text-amber-400" fill="currentColor" />
        <span className="text-xs font-semibold">{agent.rating}</span>
        <span className="text-olu-muted text-xs">({agent.reviews.toLocaleString()})</span>
      </div>
      <p className="text-olu-muted text-xs leading-relaxed flex-1 mb-2">{agent.description}</p>
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-medium">{agent.model}</span>
        <span className="text-olu-muted">${agent.costPer1k}/1K tokens</span>
      </div>
      <button onClick={() => onHire(agent)} className="w-full py-2 rounded-xl bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
        <Plus size={12} /> Hire Agent
      </button>
    </motion.div>
  )
}

function HireModal({ agent, onClose, onConfirm }) {
  const [name, setName] = useState('')
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-olu-surface border border-olu-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-olu-border">
            <h3 className="font-bold">Hire {agent.name}</h3>
            <p className="text-olu-muted text-xs mt-0.5">Give your new AI teammate a name</p>
          </div>
          <div className="p-5">
            <img src={agent.avatarImg} alt={agent.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
            <label className="text-xs font-semibold text-olu-muted uppercase tracking-wider block mb-2">Agent Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Give your agent a name, like Ashley, Ada, or Luca."
              className="w-full p-3 glass rounded-xl text-sm focus:outline-none border border-olu-border focus:border-white/30 transition-colors mb-4 placeholder:text-olu-muted/60"
            />
            <p className="text-xs text-olu-muted mb-4">This agent will join your team as <strong>{name || agent.name}</strong>, {agent.role || agent.name}. You can rename or remove them anytime.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-olu-border text-sm font-medium text-olu-muted hover:text-olu-text transition-colors">Cancel</button>
              <button onClick={() => onConfirm(agent, name || agent.name)} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity">Hire {name || agent.name}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AIAgentConfig() {
  const { currentRole } = useApp()
  const [hireTarget, setHireTarget] = useState(null)
  const [hired, setHired] = useState(new Set())
  const [successAgent, setSuccessAgent] = useState(null)
  const [filter, setFilter] = useState('All')
  const activeAgents = AI_AGENTS[currentRole] || []

  const categories = ['All', 'Creator', 'Advertiser', 'Supplier', 'Pro']
  const filteredMarket = MARKETPLACE_AGENTS.filter(a => filter === 'All' || a.category === filter)

  const handleConfirm = (agent, name) => {
    setHired(prev => new Set([...prev, agent.id]))
    setHireTarget(null)
    setSuccessAgent(name)
    setTimeout(() => setSuccessAgent(null), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">AI Agents</h1>
          <p className="text-olu-muted text-sm">Your intelligent team members</p>
        </div>
      </div>

      <AnimatePresence>
        {successAgent && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <p className="text-emerald-300 text-sm font-medium"><strong>{successAgent}</strong> has joined your team! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Agents */}
      {activeAgents.length > 0 && (
        <div className="mb-8">
          <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Your Team ({activeAgents.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 p-4 glass rounded-2xl group">
                <div className="relative flex-shrink-0">
                  {agent.avatarImg
                    ? <img src={agent.avatarImg} alt={agent.name} className="w-11 h-11 rounded-xl object-cover" />
                    : <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl font-bold text-white`}>{agent.name[0]}</div>
                  }
                  <div className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-olu-card', agent.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{agent.name}</p>
                  <p className="text-olu-muted text-xs">{agent.role}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Settings size={14} className="text-olu-muted" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketplace */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={16} className="text-olu-muted" />
          <p className="font-bold text-lg">Agent Marketplace</p>
          <div className="ml-auto flex items-center gap-1 p-1 bg-olu-card rounded-xl overflow-x-auto scrollbar-hide">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={clsx('px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all', filter === c ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarket.map((agent) => (
            <div key={agent.id} className="relative">
              {hired.has(agent.id) && (
                <div className="absolute inset-0 bg-olu-bg/80 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 rounded-full">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-300 text-xs font-semibold">Hired</span>
                  </div>
                </div>
              )}
              <AgentCard agent={agent} onHire={setHireTarget} />
            </div>
          ))}
        </div>
      </div>

      {hireTarget && (
        <HireModal agent={hireTarget} onClose={() => setHireTarget(null)} onConfirm={handleConfirm} />
      )}
    </div>
  )
}
