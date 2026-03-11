import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Clock, Circle, CheckCircle2, Loader2, Zap, AtSign, AlertTriangle, Brain, ChevronDown, ChevronRight, Plus, X, Mic, MicOff, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceAgentsWithTasksForUser } from '../../../domain/agent/api'
import {
  getAgentConversation,
  getWorkspaceGroupChatsForUser,
  getWorkspaceGroupMessages,
  postAgentConversationMessage,
  postWorkspaceGroupMessage,
} from '../../../domain/team/api'
import clsx from 'clsx'

const STATUS_CONFIG = {
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'In Progress' },
  pending: { icon: Circle, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10', label: 'Pending' },
}

const PRIORITY_COLOR = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-cyan-100/45 bg-cyan-500/10',
}

function preprocessMarkdown(text) {
  // Convert inline • bullets to proper markdown list items
  return text.replace(/([^\n])\s*•\s*/g, '$1\n- ').replace(/^\s*•\s*/gm, '- ')
}

function runtimeErrorMessage(code) {
  const map = {
    'provider-fetch-failed': 'Agent runtime could not reach the model provider. No AI reply was generated.',
  }

  if (code in map) return map[code as keyof typeof map]
  if (code?.startsWith('provider-http-')) {
    return `Agent runtime returned ${code.replace('provider-http-', 'HTTP ')} from the model provider. No AI reply was generated.`
  }

  return `Agent runtime failed (${code || 'unknown-error'}). No AI reply was generated.`
}

function TaskItem({ task }) {
  const [status, setStatus] = useState(task.status)
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <div className="flex items-start gap-3 p-4 rounded-[24px] border border-cyan-500/10 bg-[#121821] shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
      <button onClick={() => setStatus(status === 'done' ? 'pending' : 'done')} className={clsx('mt-0.5 flex-shrink-0 transition-colors', status === 'done' ? 'text-emerald-400' : 'text-cyan-100/45 hover:text-white')}>
        <Icon size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium text-white', status === 'done' && 'line-through text-cyan-100/45')}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
          <span className="text-cyan-100/45 text-xs">{task.due}</span>
        </div>
        {status === 'in_progress' && task.progress != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-cyan-100/45 text-xs flex-shrink-0">{task.progress}%</span>
          </div>
        )}
      </div>
      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', cfg.bg, cfg.color)}>{cfg.label}</span>
    </div>
  )
}

// --- @mention helpers ---
function useMention(inputRef: any, participants: any[]) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null) // null = closed, string = filter
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
          className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(2,8,23,0.35)] z-50 border border-cyan-500/10 bg-[#0c1624]"
        >
          <div className="px-3 py-2 border-b border-cyan-500/10">
            <p className="text-cyan-100/45 text-xs font-medium flex items-center gap-1"><AtSign size={12} /> Mention someone</p>
          </div>
          {filtered.map((p, i) => (
            <button
              key={p.id || p.name}
              onMouseDown={e => { e.preventDefault(); onSelect(p) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                i === mentionIndex ? 'bg-cyan-300 text-[#04111f]' : 'text-white hover:bg-[#121f31]'
              )}
            >
              {p.avatarImg
                ? <img src={p.avatarImg} alt={p.name} className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                : <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {p.icon || p.name[0]}
                  </div>
              }
              <span className="font-medium truncate">{p.name}</span>
              {p.role && <span className={clsx('text-xs ml-auto flex-shrink-0', i === mentionIndex ? 'text-[#04111f]/70' : 'text-cyan-100/45')}>{p.role}</span>}
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

function ReasoningBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mb-2 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-purple-300/80 hover:text-purple-200 transition-colors"
      >
        <Brain size={12} />
        <span className="font-medium">Thinking</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-xs text-purple-100/60 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamChat() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState('chat')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [thinking, setThinking] = useState('')
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [showReasoning, setShowReasoning] = useState(true)
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string }[]>([])
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('olu-chat-model') || 'default')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [availableModels, setAvailableModels] = useState<{ name: string; model: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [liveAgents, setLiveAgents] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedAgentDbId, setSelectedAgentDbId] = useState<string | null>(null)
  const [selectedGroupDbId, setSelectedGroupDbId] = useState<string | null>(null)
  const [liveGroups, setLiveGroups] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const isGroup = agentId?.startsWith('grp-')
  const allAgents = liveAgents

  let agent: any
  let tasks: any[]
  let groupParticipants: any[] = []

  if (isGroup) {
    const groupId = (agentId || '').replace('grp-', '')
    const groups = liveGroups || []
    const group = groups.find((g: any) => g.chat_key === groupId || g.id === groupId) || groups[0]
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
    agent = allAgents.find(a => a.id === agentId || a.agent_key === agentId) || allAgents[0]
    tasks = agent?.tasks || []
  }

  const mention = useMention(textareaRef, groupParticipants)
  const participantNames = groupParticipants.map((p) => p.name)

  useEffect(() => {
    async function loadLiveData() {
      if (!user?.id) {
        setDataLoaded(true)
        return
      }

      try {
        if (isGroup) {
          const groupKey = (agentId || '').replace('grp-', '')
          const groups = await getWorkspaceGroupChatsForUser(user.id)
          setLiveGroups(groups || [])
          const group = (groups || []).find((g: any) => g.chat_key === groupKey || g.id === groupKey)
          if (group?.id) {
            setSelectedGroupDbId(group.id)
            const groupMessages = await getWorkspaceGroupMessages(group.id)
            setMessages(
              (groupMessages || []).map((m: any) => ({
                from: m.from_name === 'You' ? 'user' : m.from_name,
                text: m.text,
                time: m.time,
              }))
            )
            setDataLoaded(true)
            return
          }
          setMessages([])
          setDataLoaded(true)
          return
        }

        const agentRows = await getWorkspaceAgentsWithTasksForUser(user)
        const mappedAgents = (agentRows || []).map((a: any) => ({
          ...a,
          avatarImg: a.avatar_img,
          lastMessage: a.last_message,
          lastTime: a.last_time,
        }))
        setLiveAgents(mappedAgents)

        const selected = mappedAgents.find((a: any) => a.id === agentId || a.agent_key === agentId)
        if (!selected?.id) {
          setMessages([])
          setDataLoaded(true)
          return
        }

        setSelectedAgentDbId(selected.id)
        const conv = await getAgentConversation(selected.id)
        setMessages(
          (conv || []).map((m: any) => ({
            from: m.from_type === 'user' ? 'user' : 'agent',
            text: m.text,
            time: m.time,
          }))
        )
        setDataLoaded(true)
        return
      } catch (err) {
        console.error('Failed to load live team chat data', err)
      }

      setMessages([])
      setDataLoaded(true)
    }

    loadLiveData()
  }, [user?.id, agentId, isGroup])

  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    return () => clearTimeout(t)
  }, [messages, loading])

  // Fetch available models
  useEffect(() => {
    const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'
    fetch(`${AGENT_RUNTIME_URL}/models`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.providers) setAvailableModels(data.providers)
      })
      .catch(() => {})
  }, [])

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 4 - attachedImages.length)
      .map(file => ({ file, preview: URL.createObjectURL(file) }))
    setAttachedImages(prev => [...prev, ...newImages].slice(0, 4))
  }, [attachedImages.length])

  const removeImage = useCallback((index: number) => {
    setAttachedImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const sendMessage = async () => {
    if ((!input.trim() && attachedImages.length === 0) || loading) return
    const userText = input.trim()
    setInput('')
    setRuntimeError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Capture and clear images
    const images = [...attachedImages]
    setAttachedImages([])

    const userMsg = {
      from: 'user',
      text: userText || (images.length ? `[${images.length} image(s)]` : ''),
      images: images.map(img => img.preview),
      time: 'Just now',
    }
    const next = [...messages, userMsg]
    setMessages(next)

    if (isGroup) {
      if (selectedGroupDbId) {
        try {
          await postWorkspaceGroupMessage(selectedGroupDbId, 'You', userText)
        } catch (err) {
          console.error('Failed saving group message', err)
        }
      }
      return
    }

    setLoading(true)

    try {
      if (selectedAgentDbId) {
        try {
          await postAgentConversationMessage(selectedAgentDbId, 'user', userText, 'Just now')
        } catch (err) {
          console.error('Failed saving user message', err)
        }
      }

      const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'

      // Convert images to base64 for the API
      const imageBase64s = await Promise.all(
        images.map(img => new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(img.file)
        }))
      )

      const res = await fetch(`${AGENT_RUNTIME_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: agent.workspace_id || '',
          agentId: selectedAgentDbId,
          agentName: agent.name,
          agentRole: agent.role,
          message: userText,
          model: selectedModel !== 'default' ? selectedModel : undefined,
          images: imageBase64s.length ? imageBase64s : undefined,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('agent-runtime /chat error:', res.status, errorText)
        setRuntimeError(runtimeErrorMessage('provider-fetch-failed'))
        return
      }

      const result = await res.json()
      const assistantText = result.response || 'Done.'

      const toolInfo = result.toolCalls?.length
        ? `\n\n---\n*Used ${result.toolCalls.length} tool(s): ${result.toolCalls.map((tc: any) => tc.name).join(', ')}*`
        : ''

      setMessages(prev => [...prev, {
        from: 'agent',
        text: assistantText + toolInfo,
        reasoning: result.reasoning,
        time: 'Just now',
      }])

      if (selectedAgentDbId && assistantText.trim()) {
        try {
          await postAgentConversationMessage(selectedAgentDbId, 'agent', assistantText, 'Just now')
        } catch (err) {
          console.error('Failed saving assistant message', err)
        }
      }
    } catch (e) {
      setRuntimeError(runtimeErrorMessage('provider-fetch-failed'))
      setMessages(prev => prev.filter((msg, index) => !(index === prev.length - 1 && msg.from === 'agent' && !msg.text)))
    } finally {
      setLoading(false)
      setStreaming(false)
      setThinking('')
    }
  }

  if (!dataLoaded && !agent) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-cyan-100/45">Loading chat...</p>
    </div>
  )

  if (!agent) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-cyan-100/45">Agent not found.</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-cyan-500/10 flex-shrink-0 rounded-t-[28px] bg-[linear-gradient(135deg,rgba(13,27,46,0.92),rgba(8,18,33,0.84))] shadow-[0_18px_60px_rgba(2,8,23,0.18)]">
        <button onClick={() => navigate('/business/team')} className="p-1.5 rounded-lg hover:bg-cyan-400/10 transition-colors mr-1">
          <ArrowLeft size={18} className="text-cyan-100/60" />
        </button>
        <div className="relative flex-shrink-0">
          {agent.avatarImg
            ? <img src={agent.avatarImg} alt={agent.name} className="w-10 h-10 rounded-xl object-cover" />
            : <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg font-bold text-white`}>{agent.name[0]}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <div className={clsx('w-1.5 h-1.5 rounded-full', loading ? 'bg-amber-400' : agent.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500')} />
            <p className="text-cyan-100/55 text-xs capitalize">{loading ? 'typing...' : `${agent.status} · ${agent.role}`}</p>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            title={showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            className={clsx(
              'p-1.5 rounded-lg transition-all',
              showReasoning ? 'text-purple-300 bg-purple-500/15' : 'text-cyan-100/35 hover:text-cyan-100/55'
            )}
          >
            <Brain size={16} />
          </button>
          {!isGroup && tasks.length > 0 && (
            <>
              {['chat', 'tasks'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-cyan-300 text-[#04111f]' : 'text-cyan-100/55 hover:text-white bg-[#0b1523] border border-cyan-500/10')}>
                  {t === 'tasks' ? `Tasks (${tasks.filter(t => t.status !== 'done').length})` : t}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {tab === 'tasks' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(7,18,33,0.92),rgba(4,11,22,0.96))] border-x border-b border-cyan-500/10 shadow-[0_24px_60px_rgba(2,8,23,0.24)]">
          <p className="text-cyan-100/45 text-xs font-semibold uppercase tracking-wider mb-3">Active Tasks</p>
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      ) : (
        <>
          {runtimeError && (
            <div className="px-4 pt-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 flex items-start gap-2 text-sm text-amber-100">
                <AlertTriangle size={16} className="mt-0.5 text-amber-300 flex-shrink-0" />
                <span>{runtimeError}</span>
              </div>
            </div>
          )}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[linear-gradient(180deg,rgba(7,18,33,0.92),rgba(4,11,22,0.96))] border-x border-cyan-500/10 shadow-[0_24px_60px_rgba(2,8,23,0.24)]">
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
                      <p className="text-xs text-cyan-100/45 px-1">{msg.from}{participant?.role ? ` · ${participant.role}` : ''}</p>
                    )
                  })()}
                  <div className={clsx(
                    'px-5 py-3.5 rounded-[24px] text-[15px] leading-7 border shadow-[0_16px_40px_rgba(2,8,23,0.18)]',
                    msg.from === 'user'
                      ? 'bg-cyan-300 text-[#04111f] border-cyan-200/60 rounded-tr-[10px]'
                      : 'bg-[#121821] text-white border-cyan-500/10 rounded-tl-[10px]'
                  )}>
                    {msg.from === 'agent' ? (
                      msg.text ? (
                        <>
                          {showReasoning && msg.reasoning && (
                            <ReasoningBlock text={msg.reasoning} />
                          )}
                          <div className={clsx(
                            'prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 prose-pre:px-3 prose-pre:py-2 prose-code:px-1 prose-code:rounded prose-headings:mb-2',
                            'prose-invert prose-headings:text-white prose-code:bg-white/10 prose-code:text-cyan-100 prose-pre:bg-[#0b1523]'
                          )}>
                            <ReactMarkdown
                              components={{
                                img: ({ src, alt }) => (
                                  <img
                                    src={src}
                                    alt={alt || 'Generated image'}
                                    className="rounded-xl max-w-full my-2 border border-cyan-500/10"
                                    style={{ maxHeight: 400 }}
                                    loading="lazy"
                                  />
                                ),
                              }}
                            >{preprocessMarkdown(msg.text)}</ReactMarkdown>
                          </div>
                        </>
                      ) : (
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-100/45 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-100/45 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-100/45 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )
                    ) : (isGroup && participantNames.length > 0)
                      ? renderWithMentions(msg.text, participantNames)
                      : msg.text}
                    {msg.images?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.images.map((src: string, j: number) => (
                          <img key={j} src={src} alt="" className="rounded-lg max-w-[200px] max-h-[150px] object-cover border border-cyan-200/20" />
                        ))}
                      </div>
                    )}
                  </div>
                  {!(msg.from === 'agent' && i === messages.length - 1 && (loading || streaming)) && (
                    <p className="text-cyan-100/45 text-xs px-1">{msg.time}</p>
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
                <div className="px-4 py-3 rounded-[24px] rounded-tl-[10px] bg-[#121821] border border-cyan-500/10 flex items-center gap-1.5 shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
                  <Loader2 size={14} className="text-cyan-100/45 animate-spin" />
                  <span className="text-cyan-100/55 text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {thinking && (
            <div className="px-4 py-2 border-x border-cyan-500/10 bg-[#071221]">
              <p className="text-cyan-100/45 text-xs italic line-clamp-2">Thinking: {thinking}...</p>
            </div>
          )}
          <div
            className="p-4 border-x border-b border-cyan-500/10 rounded-b-[28px] bg-[#071221] flex-shrink-0"
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => {
              e.preventDefault()
              e.stopPropagation()
              if (e.dataTransfer.files.length) addImages(e.dataTransfer.files)
            }}
          >
            {/* Image previews */}
            {attachedImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/20">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              {isGroup && (
                <MentionDropdown
                  filtered={mention.filtered}
                  mentionIndex={mention.mentionIndex}
                  onSelect={p => mention.accept(input, setInput, p)}
                />
              )}
              <div className="rounded-2xl border border-cyan-500/10 bg-[#0b1523] focus-within:border-cyan-300/40 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    if (isGroup) mention.detect(e.target.value, e.target.selectionStart)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => {
                    if (isGroup && mention.handleKey(e, input, setInput)) return
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                  }}
                  onPaste={e => {
                    const files = Array.from(e.clipboardData.files)
                    if (files.some(f => f.type.startsWith('image/'))) {
                      e.preventDefault()
                      addImages(files)
                    }
                  }}
                  placeholder={isGroup ? `Message the group... (@ to mention)` : `Message ${agent.name}...`}
                  rows={1}
                  className="w-full px-4 pt-3 pb-1 bg-transparent text-sm text-white placeholder:text-cyan-100/35 focus:outline-none resize-none"
                  style={{ maxHeight: 120 }}
                />
                {/* Toolbar row inside the input container */}
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-0.5">
                    {/* Image attach */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => { if (e.target.files) addImages(e.target.files); e.target.value = '' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg text-cyan-100/40 hover:text-cyan-100/70 hover:bg-cyan-500/10 transition-all"
                      title="Attach image"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Model selector */}
                    {availableModels.length > 1 && (
                      <>
                        <button
                          onClick={() => setShowModelMenu(!showModelMenu)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium text-cyan-100/40 hover:text-cyan-100/70 hover:bg-cyan-500/10 transition-all whitespace-nowrap"
                        >
                          {(availableModels.find(m => m.name === selectedModel)?.model || 'default').split('-').slice(0, 2).join('-')}
                        </button>
                        <AnimatePresence>
                          {showModelMenu && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                              <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-32 pointer-events-none">
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 8 }}
                                  className="py-1 rounded-xl bg-[#0b1523] border border-cyan-500/20 shadow-2xl whitespace-nowrap pointer-events-auto"
                                >
                                  {availableModels.map(m => (
                                    <button
                                      key={m.name}
                                      onClick={() => {
                                        setSelectedModel(m.name)
                                        localStorage.setItem('olu-chat-model', m.name)
                                        setShowModelMenu(false)
                                      }}
                                      className={clsx(
                                        'w-full px-4 py-2.5 text-left text-sm transition-colors',
                                        selectedModel === m.name ? 'text-cyan-300 bg-cyan-500/10' : 'text-cyan-100/60 hover:text-white hover:bg-cyan-500/5'
                                      )}
                                    >
                                      {m.model}
                                    </button>
                                  ))}
                                </motion.div>
                              </div>
                            </>
                          )}
                        </AnimatePresence>
                      </>
                    )}

                    {/* Send */}
                    <button
                      onClick={sendMessage}
                      disabled={(!input.trim() && attachedImages.length === 0) || loading}
                      className="p-2 rounded-lg bg-cyan-300 text-[#04111f] disabled:opacity-40 transition-opacity hover:opacity-90"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
