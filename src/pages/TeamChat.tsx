import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Clock, Circle, CheckCircle2, Loader2, Zap, AtSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { AI_AGENTS, GROUP_CHATS } from '../data/mock'
import clsx from 'clsx'

const FALLBACK_BY_ROLE = {
  'IP Manager': [
    "I'll review the licensing request and get back to you with a recommendation.",
    "Noted. I'll check the IP status and prepare a summary.",
    "I'll draft the counter-proposal and send it over shortly.",
  ],
  'Legal Officer': [
    "I'll monitor for any new unauthorized uses and report back.",
    "Understood. I'll prepare the DMCA takedown and file it immediately.",
    "I'll document the infringement and recommend next steps.",
  ],
  'Community Manager': [
    "I'll reach out to the top fans and keep you updated.",
    "On it — I'll prepare the community announcement.",
    "I'll organize the event details and share a draft with you.",
  ],
  'Growth Officer': [
    "I'll analyze the latest growth metrics and prepare a report.",
    "Understood. I'll run the campaign and track performance.",
    "I'll identify the best channels and draft a growth plan.",
  ],
  'Data Analyst': [
    "I'll pull the analytics data and prepare a summary.",
    "Understood. I'll run the numbers and highlight key insights.",
    "I'll generate the report and flag any anomalies.",
  ],
  'Creativity Officer': [
    "I'll brainstorm content ideas based on current trends.",
    "Got it. I'll draft a few concepts for your review.",
    "I'll put together a content calendar with fresh ideas.",
  ],
}
const FALLBACK_DEFAULT = [
  "Got it. I'll handle that and update you shortly.",
  "Understood. I'm on it.",
  "Sure, I'll take care of that now.",
]
const fallback = (role) => {
  const replies = FALLBACK_BY_ROLE[role] || FALLBACK_DEFAULT
  return replies[Math.floor(Math.random() * replies.length)]
}

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

function preprocessMarkdown(text) {
  // Convert inline • bullets to proper markdown list items
  return text.replace(/([^\n])\s*•\s*/g, '$1\n- ').replace(/^\s*•\s*/gm, '- ')
}

function buildSystemPrompt(agent) {
  return `You are ${agent.name}, an AI agent on the OLU platform — a next-gen creator economy platform.

Your role: ${agent.role}
Your specialty: ${agent.description}

You are chatting with Luna Chen, a professional digital artist and creator. She is your principal. Be proactive, concise, and professional. Use brief bullet points when listing items. Don't use excessive emojis. Respond in the same language the user writes in (English or Chinese).`
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
        {status === 'in_progress' && task.progress != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-olu-muted text-xs flex-shrink-0">{task.progress}%</span>
          </div>
        )}
      </div>
      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', cfg.bg, cfg.color)}>{cfg.label}</span>
    </div>
  )
}

// --- @mention helpers ---
function useMention(inputRef, participants) {
  const [mentionQuery, setMentionQuery] = useState(null) // null = closed, string = filter
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1) // cursor pos of '@'

  const filtered = mentionQuery !== null
    ? participants.filter(p => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : []

  const open = mentionQuery !== null && filtered.length > 0

  const detect = useCallback((value, cursorPos) => {
    // Walk backwards from cursor to find an unmatched '@'
    const before = value.slice(0, cursorPos)
    const atIdx = before.lastIndexOf('@')
    if (atIdx === -1 || (atIdx > 0 && /\S/.test(before[atIdx - 1]))) {
      setMentionQuery(null)
      return
    }
    const query = before.slice(atIdx + 1)
    if (/\s/.test(query) && query.length > 0) {
      setMentionQuery(null)
      return
    }
    setMentionQuery(query)
    setMentionStart(atIdx)
    setMentionIndex(0)
  }, [])

  const accept = useCallback((input, setInput, participant) => {
    const before = input.slice(0, mentionStart)
    const after = input.slice(mentionStart + 1 + (mentionQuery?.length || 0))
    setInput(before + '@' + participant.name + ' ' + after)
    setMentionQuery(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [mentionStart, mentionQuery, inputRef])

  const handleKey = useCallback((e, input, setInput) => {
    if (!open) return false
    if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filtered.length - 1)); return true }
    if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return true }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(input, setInput, filtered[mentionIndex]); return true }
    if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return true }
    return false
  }, [open, filtered, mentionIndex, accept])

  return { open, filtered, mentionIndex, detect, accept, handleKey }
}

function MentionDropdown({ filtered, mentionIndex, onSelect }) {
  return (
    <AnimatePresence>
      {filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.12 }}
          className="absolute bottom-full left-0 mb-2 w-56 glass border border-olu-border rounded-xl overflow-hidden shadow-lg z-50"
        >
          <div className="px-3 py-2 border-b border-olu-border">
            <p className="text-olu-muted text-xs font-medium flex items-center gap-1"><AtSign size={12} /> Mention someone</p>
          </div>
          {filtered.map((p, i) => (
            <button
              key={p.id || p.name}
              onMouseDown={e => { e.preventDefault(); onSelect(p) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                i === mentionIndex ? 'bg-white/10 text-white' : 'text-olu-text hover:bg-white/05'
              )}
            >
              {p.avatarImg
                ? <img src={p.avatarImg} alt={p.name} className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                : <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {p.icon || p.name[0]}
                  </div>
              }
              <span className="font-medium truncate">{p.name}</span>
              {p.role && <span className="text-olu-muted text-xs ml-auto flex-shrink-0">{p.role}</span>}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Render text with highlighted @mentions
function renderWithMentions(text, participantNames) {
  if (!participantNames?.length) return text
  const pattern = new RegExp(`(@(?:${participantNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g')
  const parts = text.split(pattern)
  return parts.map((part, i) =>
    pattern.test(part)
      ? <span key={i} className="text-sky-400 font-medium">{part}</span>
      : part
  )
}

export default function TeamChat() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { currentRole } = useApp()
  const [tab, setTab] = useState('chat')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [thinking, setThinking] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const isGroup = agentId?.startsWith('grp-')
  const allAgents = AI_AGENTS[currentRole] || []

  let agent, tasks, groupParticipants = []

  if (isGroup) {
    const groupId = agentId.replace('grp-', '')
    const groups = GROUP_CHATS[currentRole] || []
    const group = groups.find(g => g.id === groupId) || groups[0]
    agent = group ? { name: group.name, icon: '👥', color: '[#2a2a2a]', role: 'Group Chat', status: 'online', conversation: group?.conversation || [] } : null
    tasks = []
    // Build participant list from agent data
    if (group?.participants) {
      groupParticipants = group.participants
        .filter(name => name !== 'Luna' && name !== 'You') // exclude self
        .map(name => {
          const found = allAgents.find(a => a.name === name)
          return found || { name, id: name.toLowerCase(), role: '', color: 'from-gray-600 to-gray-500' }
        })
    }
  } else {
    agent = allAgents.find(a => a.id === agentId) || allAgents[0]
    tasks = agent?.tasks || []
  }

  const mention = useMention(textareaRef, groupParticipants)
  const participantNames = groupParticipants.map(p => p.name)

  const [messages, setMessages] = useState(agent?.conversation || [])

  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    return () => clearTimeout(t)
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')

    const userMsg = { from: 'user', text: userText, time: 'Just now' }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const apiMessages = [
        { role: 'system', content: buildSystemPrompt(agent) },
        ...next
          .filter(m => m.text && m.text.trim())
          .slice(-20) // keep last 20 messages max
          .map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      // Add an empty agent message to stream into
      setMessages(prev => [...prev, { from: 'agent', text: '', time: 'Just now' }])
      setLoading(false)
      setStreaming(true)

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line for next chunk

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') break
          if (payload.startsWith('[ERROR:') || payload === '[FALLBACK]') {
            console.error('API error payload:', payload)
            setMessages(prev => {
              const msgs = [...prev]
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: fallback(agent.role) }
              return msgs
            })
            break
          }
          try {
            const json = JSON.parse(payload)
            const delta = json.choices?.[0]?.delta || {}
            if (delta.reasoning_content) {
              setThinking(prev => (prev + delta.reasoning_content).slice(-120))
            }
            const token = delta.content || ''
            if (token) {
              setThinking('') // clear thinking hint once content starts
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: msgs[msgs.length - 1].text + token }
                return msgs
              })
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { from: 'agent', text: fallback(agent.role), time: 'Just now' }])
    } finally {
      setLoading(false)
      setStreaming(false)
      setThinking('')
    }
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
        <div className="relative flex-shrink-0">
          {agent.avatarImg
            ? <img src={agent.avatarImg} alt={agent.name} className="w-10 h-10 rounded-xl object-cover" />
            : <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg font-bold text-white`}>{agent.name[0]}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <div className={clsx('w-1.5 h-1.5 rounded-full', loading ? 'bg-amber-400' : agent.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500')} />
            <p className="text-olu-muted text-xs capitalize">{loading ? 'typing...' : `${agent.status} · ${agent.role}`}</p>
          </div>
        </div>
        {!isGroup && tasks.length > 0 && (
          <div className="flex gap-1">
            {['chat', 'tasks'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-white/10 text-sky-400' : 'text-olu-muted hover:text-olu-text')}>
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
                {msg.from !== 'user' && (() => {
                  const participant = isGroup && msg.from !== 'agent' ? allAgents.find(a => a.name === msg.from) : null
                  const avatarSrc = participant?.avatarImg || agent.avatarImg
                  const avatarColor = participant?.color || agent.color
                  const avatarLabel = participant?.name?.[0] || agent.name[0]
                  return avatarSrc
                    ? <img src={avatarSrc} alt={participant?.name || agent.name} className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-0.5" />
                    : <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5`}>{avatarLabel}</div>
                })()}
                <div className={clsx('max-w-[80%]', msg.from === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                  {msg.from !== 'user' && isGroup && msg.from !== 'agent' && (() => {
                    const participant = allAgents.find(a => a.name === msg.from)
                    return (
                      <p className="text-xs text-olu-muted px-1">{msg.from}{participant?.role ? ` · ${participant.role}` : ''}</p>
                    )
                  })()}
                  <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', msg.from === 'user' ? 'bg-white text-black rounded-tr-sm' : 'glass rounded-tl-sm')}>
                    {msg.from === 'agent' ? (
                      msg.text ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-pre:bg-white/10 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-headings:text-white">
                          <ReactMarkdown>{preprocessMarkdown(msg.text)}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-olu-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-olu-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-olu-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )
                    ) : (isGroup && participantNames.length > 0)
                      ? renderWithMentions(msg.text, participantNames)
                      : msg.text}
                  </div>
                  {!(msg.from === 'agent' && i === messages.length - 1 && (loading || streaming)) && (
                    <p className="text-olu-muted text-xs px-1">{msg.time}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                {agent.avatarImg
                  ? <img src={agent.avatarImg} alt={agent.name} className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-0.5" />
                  : <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5`}>{agent.name[0]}</div>
                }
                <div className="px-4 py-3 glass rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <Loader2 size={14} className="text-olu-muted animate-spin" />
                  <span className="text-olu-muted text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {thinking && (
            <div className="px-4 py-2 border-t border-olu-border">
              <p className="text-olu-muted text-xs italic line-clamp-2">Thinking: {thinking}...</p>
            </div>
          )}
          <div className="p-4 border-t border-olu-border flex-shrink-0">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                {isGroup && (
                  <MentionDropdown
                    filtered={mention.filtered}
                    mentionIndex={mention.mentionIndex}
                    onSelect={p => mention.accept(input, setInput, p)}
                  />
                )}
                <div className="glass rounded-2xl overflow-hidden border border-olu-border focus-within:border-white/20 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    if (isGroup) mention.detect(e.target.value, e.target.selectionStart)
                  }}
                  onKeyDown={e => {
                    if (isGroup && mention.handleKey(e, input, setInput)) return
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                  }}
                  placeholder={isGroup ? `Message the group... (@ to mention)` : `Message ${agent.name}...`}
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent text-sm placeholder:text-olu-muted focus:outline-none resize-none"
                />
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl bg-white text-black disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
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
