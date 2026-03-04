import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, CheckSquare, Clock, Circle, CheckCircle2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { AI_AGENTS, GROUP_CHATS } from '../data/mock'
import clsx from 'clsx'

const STATUS_CONFIG = {
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'In Progress' },
  pending: { icon: Circle, color: 'text-olu-muted', bg: 'bg-white/05', label: 'Pending' },
}

const PRIORITY_COLOR = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-olu-muted bg-white/05',
}

function TaskItem({ task }) {
  const [status, setStatus] = useState(task.status)
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <div className="flex items-start gap-3 p-3 glass rounded-xl">
      <button onClick={() => setStatus(status === 'done' ? 'pending' : 'done')} className={clsx('mt-0.5 flex-shrink-0 transition-colors', status === 'done' ? 'text-emerald-400' : 'text-olu-muted hover:text-olu-text')}>
        <Icon size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', status === 'done' && 'line-through text-olu-muted')}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
          <span className="text-olu-muted text-xs">{task.due}</span>
        </div>
      </div>
      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', cfg.bg, cfg.color)}>{cfg.label}</span>
    </div>
  )
}

export default function TeamChat() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { currentRole } = useApp()
  const [tab, setTab] = useState('chat')
  const [input, setInput] = useState('')

  const isGroup = agentId?.startsWith('grp-')
  const allAgents = AI_AGENTS[currentRole] || []

  let agent, conversation, tasks

  if (isGroup) {
    const groupId = agentId.replace('grp-', '')
    const groups = GROUP_CHATS[currentRole] || []
    const group = groups.find(g => g.id === groupId) || groups[0]
    agent = group ? { name: group.name, icon: '👥', color: '[#2a2a2a]', role: 'Group Chat', status: 'online' } : null
    conversation = group?.conversation || []
    tasks = []
  } else {
    agent = allAgents.find(a => a.id === agentId) || allAgents[0]
    conversation = agent?.conversation || []
    tasks = agent?.tasks || []
  }

  const [messages, setMessages] = useState(conversation)

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([...messages, { from: 'user', text: input, time: 'Just now' }])
    setInput('')
    // Simulate agent reply
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'agent', text: 'Got it! I\'m on it. I\'ll update you as soon as I have progress. 🚀', time: 'Just now', replyTo: input }])
    }, 1200)
  }

  if (!agent) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-olu-muted">Agent not found.</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-olu-border flex-shrink-0">
        <button onClick={() => navigate('/team')} className="p-1.5 rounded-lg hover:bg-white/08 transition-colors mr-1">
          <ArrowLeft size={18} className="text-olu-muted" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-xl flex-shrink-0`}>
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <div className={clsx('w-1.5 h-1.5 rounded-full', agent.status === 'online' ? 'bg-emerald-400' : agent.status === 'busy' ? 'bg-amber-400' : 'bg-gray-500')} />
            <p className="text-olu-muted text-xs capitalize">{agent.status} · {agent.role}</p>
          </div>
        </div>
        {!isGroup && tasks.length > 0 && (
          <div className="flex gap-1">
            {['chat', 'tasks'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-[#7c3aed]/20 text-violet-400' : 'text-olu-muted hover:text-olu-text')}>
                {t === 'tasks' ? `Tasks (${tasks.filter(t => t.status !== 'done').length})` : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'tasks' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Active Tasks</p>
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('flex gap-3', msg.from === 'user' ? 'flex-row-reverse' : '')}
              >
                {msg.from !== 'user' && (
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}>
                    {msg.avatar || agent.icon}
                  </div>
                )}
                <div className={clsx('max-w-[80%]', msg.from === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                  {msg.from !== 'user' && isGroup && msg.from !== 'agent' && (
                    <p className="text-xs text-olu-muted px-1">{msg.from}</p>
                  )}
                  <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line', msg.from === 'user' ? 'bg-[#7c3aed] text-white rounded-tr-sm' : 'glass rounded-tl-sm')}>
                    {msg.text}
                  </div>
                  <p className="text-olu-muted text-xs px-1">{msg.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-olu-border flex-shrink-0">
            <div className="flex gap-3 items-end">
              <div className="flex-1 glass rounded-2xl overflow-hidden border border-olu-border focus-within:border-violet-500/50 transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message ${agent.name}...`}
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent text-sm placeholder:text-olu-muted focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="p-3 rounded-xl bg-[#7c3aed] text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
