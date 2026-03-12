import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Clock, Circle, CheckCircle2, Loader2, AtSign, AlertTriangle, Brain, ChevronDown, ChevronRight, Image as ImageIcon, X, Copy, Check, Square, RefreshCcw, DollarSign, Pause } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceAgentsWithTasksForUser } from '../../../domain/agent/api'
import { approveBudgetAPI, pauseBudget } from '../../../domain/agent/runtime-api'
import {
  getAgentConversation,
  getWorkspaceGroupChatsForUser,
  getWorkspaceGroupMessages,
  postAgentConversationMessage,
  postWorkspaceGroupMessage,
  uploadTeamChatImages,
} from '../../../domain/team/api'
import { subscribeGroupChatMessages, subscribeConversations } from '../../../domain/team/data'
import type { ChatAttachment } from '../../../lib/supabase'
import clsx from 'clsx'

type ModelOption = {
  id: string
  provider: string
  providerLabel: string
  model: string
  label: string
  supportsVision: boolean
  isDefault?: boolean
}

type ToolCallSummary = {
  name: string
  args: Record<string, unknown>
  result: string
}

type ChatMessage = {
  from: string
  text: string
  rawText?: string
  images?: string[]
  attachments?: ChatAttachment[]
  reasoning?: string
  notice?: string
  toolCalls?: ToolCallSummary[]
  time: string
  _realtimeId?: string
}

type PendingAgentRequest = {
  userText: string
  attachments: ChatAttachment[]
  runtimeImages?: string[]
}

const STATUS_CONFIG = {
  done: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/10', label: 'Done' },
  in_progress: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-400/10', label: 'In Progress' },
  pending: { icon: Circle, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-[var(--olu-accent-bg)]', label: 'Pending' },
}

const PRIORITY_COLOR = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-400/10',
  low: 'text-[var(--olu-text-secondary)] bg-[var(--olu-accent-bg)]',
}

function preprocessMarkdown(text) {
  // Convert inline • bullets to proper markdown list items
  return text.replace(/([^\n])\s*•\s*/g, '$1\n- ').replace(/^\s*•\s*/gm, '- ')
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Failed reading image'))
    reader.readAsDataURL(file)
  })
}

async function copyText(text: string) {
  if (!text) return
  await navigator.clipboard.writeText(text)
}

function runtimeErrorMessage(code) {
  const map = {
    'provider-fetch-failed': 'Agent runtime could not reach the model provider. No AI reply was generated.',
    'vision-unsupported': 'The selected model does not support images.',
  }

  if (code in map) return map[code as keyof typeof map]
  if (code?.startsWith('provider-http-')) {
    return `Agent runtime returned ${code.replace('provider-http-', 'HTTP ')} from the model provider. No AI reply was generated.`
  }

  return `Agent runtime failed (${code || 'unknown-error'}). No AI reply was generated.`
}

function isToolDebugEnabled() {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  const debugTools = params.get('debugTools')
  const storageKey = 'olu-chat-debug-tools'

  if (debugTools === '1') {
    window.localStorage.setItem(storageKey, '1')
    return true
  }

  if (debugTools === '0') {
    window.localStorage.removeItem(storageKey)
    return false
  }

  return window.localStorage.getItem(storageKey) === '1'
}

function TaskItem({ task }) {
  const [status, setStatus] = useState(task.status)
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <div className="flex items-start gap-3 p-4 rounded-[24px] border border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
      <button onClick={() => setStatus(status === 'done' ? 'pending' : 'done')} className={clsx('mt-0.5 flex-shrink-0 transition-colors', status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)]')}>
        <Icon size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', status === 'done' && 'line-through text-[var(--olu-text-secondary)]')}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>{task.priority}</span>
          <span className="text-[var(--olu-text-secondary)] text-xs">{task.due}</span>
        </div>
        {status === 'in_progress' && task.progress != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-[var(--olu-text-secondary)] text-xs flex-shrink-0">{task.progress}%</span>
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
          className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(2,8,23,0.12)] z-50 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]"
        >
          <div className="px-3 py-2 border-b border-[var(--olu-card-border)]">
            <p className="text-[var(--olu-text-secondary)] text-xs font-medium flex items-center gap-1"><AtSign size={12} /> Mention someone</p>
          </div>
          {filtered.map((p, i) => (
            <button
              key={p.id || p.name}
              onMouseDown={e => { e.preventDefault(); onSelect(p) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                i === mentionIndex ? 'bg-cyan-300 text-[#04111f]' : 'text-white hover:bg-[var(--olu-card-hover)]'
              )}
            >
              {p.avatarImg
                ? <img src={p.avatarImg} alt={p.name} className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                : <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${p.color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {p.icon || p.name[0]}
                  </div>
              }
              <span className="font-medium truncate">{p.name}</span>
              {p.role && <span className={clsx('text-xs ml-auto flex-shrink-0', i === mentionIndex ? 'text-[#04111f]/70' : 'text-[var(--olu-text-secondary)]')}>{p.role}</span>}
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
      ? <span key={i} className="text-sky-600 dark:text-sky-400 font-medium">{part}</span>
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

function CodeBlock({ className, children }: { className?: string; children?: any }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || 'text'
  const code = String(children || '').replace(/\n$/, '')

  const onCopy = async () => {
    await copyText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-input-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--olu-card-border)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--olu-input-placeholder)]">
        <span>{language}</span>
        <button onClick={onCopy} className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] hover:text-olu-text transition-colors">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <Highlight theme={themes.vsDark} code={code} language={language as any}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${highlightClassName} overflow-x-auto px-4 py-3 text-[13px] leading-6`} style={{ ...style, background: 'transparent', margin: 0 }}>
            {tokens.map((line, index) => (
              <div key={index} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

// --- Budget cards ---

type BudgetApprovalData = { type: 'budget_approval_required'; budget_id: string; task: string; options: number[]; currency: string; available_balance: number }
type BudgetProgressData = {
  type: 'budget_progress'; budget_id: string; task: string; approved: number; spent: number; remaining: number
  currency: string; status: string; breakdown?: { item: string; amount: number }[]
}

function parseBudgetFromToolCalls(toolCalls: ToolCallSummary[]): BudgetApprovalData | BudgetProgressData | null {
  for (const tc of toolCalls) {
    if (tc.name === 'request_budget' || tc.name === 'report_budget_usage') {
      try {
        const data = JSON.parse(tc.result)
        if (data?.type === 'budget_approval_required' || data?.type === 'budget_progress') return data
      } catch { /* ignore */ }
    }
  }
  return null
}

function BudgetApprovalCard({ data, onApprove }: { data: BudgetApprovalData; onApprove: (amount: number) => void }) {
  const [approved, setApproved] = useState<number | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [customVal, setCustomVal] = useState('')

  function handleApprove(amount: number) {
    setApproved(amount)
    onApprove(amount)
  }

  if (approved !== null) {
    return (
      <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          <span className="font-semibold text-sm">Budget Approved: ${approved}</span>
        </div>
        <p className="text-xs text-[var(--olu-muted)] mt-1">{data.task}</p>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign size={16} className="text-amber-500" />
        <span className="font-semibold text-sm">Budget Approval Required</span>
      </div>
      <p className="text-xs text-[var(--olu-text-secondary)]">{data.task}</p>
      {data.available_balance > 0 && (
        <p className="text-xs text-[var(--olu-muted)]">Available balance: ${data.available_balance.toFixed(2)}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {data.options.map((amount) => (
          <button
            key={amount}
            onClick={() => handleApprove(amount)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-sm font-medium text-amber-600 dark:text-amber-300 transition-colors"
          >
            ${amount}
          </button>
        ))}
        {!customMode ? (
          <button
            onClick={() => setCustomMode(true)}
            className="px-4 py-2 rounded-xl bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)] border border-[var(--olu-card-border)] text-sm text-[var(--olu-text-secondary)] transition-colors"
          >
            Custom
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-[var(--olu-text-secondary)]">$</span>
            <input
              autoFocus
              type="number"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && customVal) handleApprove(Number(customVal)) }}
              className="w-20 px-2 py-1.5 rounded-lg bg-[var(--olu-input-bg)] border border-[var(--olu-card-border)] text-sm focus:outline-none focus:border-amber-400"
              placeholder="Amount"
            />
            <button
              onClick={() => customVal && handleApprove(Number(customVal))}
              disabled={!customVal}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-amber-600 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetProgressCard({ data, onStop }: { data: BudgetProgressData; onStop?: () => void }) {
  const pct = data.approved > 0 ? Math.min(100, (data.spent / data.approved) * 100) : 0
  const statusColors: Record<string, { bar: string; badge: string; label: string }> = {
    in_progress: { bar: 'bg-amber-400', badge: 'bg-amber-400/10 text-amber-600 dark:text-amber-400', label: 'In Progress' },
    paused: { bar: 'bg-gray-400', badge: 'bg-gray-400/10 text-gray-500', label: 'Paused' },
    completed: { bar: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400', label: 'Completed' },
    cancelled: { bar: 'bg-red-400', badge: 'bg-red-400/10 text-red-500', label: 'Cancelled' },
  }
  const st = statusColors[data.status] || statusColors.in_progress

  return (
    <div className="mt-3 rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-[var(--olu-text-secondary)]" />
          <span className="font-semibold text-sm">{data.task}</span>
        </div>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', st.badge)}>{st.label}</span>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full transition-all', st.bar)} style={{ width: `${Math.max(3, pct)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-[var(--olu-text-secondary)]">
          <span>Spent: ${data.spent.toFixed(2)}</span>
          <span>Remaining: ${data.remaining.toFixed(2)}</span>
          <span>Budget: ${data.approved.toFixed(2)}</span>
        </div>
      </div>

      {data.breakdown && data.breakdown.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-[var(--olu-card-border)]">
          {data.breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-[var(--olu-text-secondary)]">{item.item}</span>
              <span className="font-medium">${item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {data.status === 'in_progress' && onStop && (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-500 transition-colors"
        >
          <Pause size={12} />
          Stop & Return Funds
        </button>
      )}
    </div>
  )
}

function ToolCallCards({ toolCalls }: { toolCalls: ToolCallSummary[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const onCopy = async (index: number, value: string) => {
    await copyText(value)
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1200)
  }

  return (
    <div className="mt-3 space-y-2">
      {toolCalls.map((toolCall, index) => (
        <div key={`${toolCall.name}-${index}`} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-input-bg)]/90 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-olu-text">{toolCall.name}</p>
            <button
              onClick={() => onCopy(index, JSON.stringify(toolCall.args, null, 2))}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] hover:text-olu-text transition-colors"
            >
              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedIndex === index ? 'Copied args' : 'Copy args'}</span>
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-black/20 px-3 py-2 text-xs leading-5 text-[var(--olu-sidebar-text)]">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      ))}
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
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('olu-chat-model') || '')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number; label: string } | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [retryMode, setRetryMode] = useState<'upload' | 'request' | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatScrollTopRef = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingRequestRef = useRef<PendingAgentRequest | null>(null)
  const [liveAgents, setLiveAgents] = useState<any[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedAgentDbId, setSelectedAgentDbId] = useState<string | null>(null)
  const [selectedGroupDbId, setSelectedGroupDbId] = useState<string | null>(null)
  const [liveGroups, setLiveGroups] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const showToolDebug = isToolDebugEnabled()

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
                rawText: m.text,
                images: (m.attachments || []).map((attachment: ChatAttachment) => attachment.url),
                attachments: m.attachments || [],
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
          (conv || []).map((m: any) => {
            const metaEntry = (m.attachments || []).find((a: any) => a.type === 'metadata')
            let meta: any = {}
            if (metaEntry?.path) {
              try { meta = JSON.parse(metaEntry.path) } catch {}
            }
            const realAttachments = (m.attachments || []).filter((a: any) => a.type !== 'metadata')
            return {
              from: m.from_type === 'user' ? 'user' : 'agent',
              text: m.text,
              rawText: m.text,
              images: realAttachments.map((attachment: ChatAttachment) => attachment.url),
              attachments: realAttachments,
              toolCalls: meta.toolCalls,
              reasoning: meta.reasoning,
              notice: meta.notice,
              time: m.time,
            }
          })
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

  // Realtime subscription
  useEffect(() => {
    if (isGroup && selectedGroupDbId) {
      return subscribeGroupChatMessages(selectedGroupDbId, (raw: any) => {
        // Skip own messages (already added optimistically)
        if (raw.from_name === 'You') return
        setMessages((prev) => {
          if (prev.some((m: any) => m._realtimeId === raw.id)) return prev
          return [...prev, {
            from: raw.from_name,
            text: raw.text,
            rawText: raw.text,
            images: (raw.attachments || []).map((a: any) => a.url),
            attachments: raw.attachments || [],
            time: raw.time,
            _realtimeId: raw.id,
          }]
        })
      })
    }
    if (!isGroup && selectedAgentDbId) {
      return subscribeConversations(selectedAgentDbId, (raw: any) => {
        // Skip own messages (already added optimistically)
        if (raw.from_type === 'user') return
        setMessages((prev) => {
          if (prev.some((m: any) => m._realtimeId === raw.id)) return prev
          return [...prev, {
            from: 'agent',
            text: raw.text,
            rawText: raw.text,
            images: [],
            attachments: [],
            time: raw.time,
            _realtimeId: raw.id,
          }]
        })
      })
    }
  }, [isGroup, selectedGroupDbId, selectedAgentDbId])

  useEffect(() => {
    if (tab !== 'chat') return
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    return () => clearTimeout(t)
  }, [messages, loading])

  useEffect(() => {
    if (tab !== 'chat') return
    const t = window.setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollTopRef.current
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [tab])

  useEffect(() => () => {
    abortControllerRef.current?.abort()
  }, [])

  // Fetch available models
  useEffect(() => {
    const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'
    fetch(`${AGENT_RUNTIME_URL}/models`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.models?.length) return

        const options: ModelOption[] = data.models
        setAvailableModels(options)

        setSelectedModel((current) => {
          if (current && options.some((option) => option.id === current)) return current
          if (current) {
            const legacyMatch = options.find((option) => option.provider === current)
            if (legacyMatch) {
              localStorage.setItem('olu-chat-model', legacyMatch.id)
              return legacyMatch.id
            }
          }
          const fallback = options.find((option) => option.isDefault) || options[0]
          if (fallback) localStorage.setItem('olu-chat-model', fallback.id)
          return fallback?.id || current
        })
      })
      .catch(() => {})
  }, [])

  const selectedModelOption = availableModels.find((option) => option.id === selectedModel) || null
  const selectedModelSupportsVision = Boolean(selectedModelOption?.supportsVision)
  const filteredModels = modelSearch
    ? availableModels.filter((m) => m.model.toLowerCase().includes(modelSearch.toLowerCase()) || m.providerLabel.toLowerCase().includes(modelSearch.toLowerCase()))
    : availableModels
  const groupedModels = filteredModels.reduce<Record<string, ModelOption[]>>((acc, option) => {
    if (!acc[option.providerLabel]) acc[option.providerLabel] = []
    acc[option.providerLabel].push(option)
    return acc
  }, {})

  useEffect(() => {
    if (selectedModelSupportsVision || attachedImages.length === 0) return
    attachedImages.forEach((img) => URL.revokeObjectURL(img.preview))
    setAttachedImages([])
    setRuntimeError(runtimeErrorMessage('vision-unsupported'))
  }, [selectedModelSupportsVision, attachedImages])

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

  const stopGeneration = useCallback(() => {
    if (!abortControllerRef.current) return
    abortControllerRef.current.abort()
    abortControllerRef.current = null
    setLoading(false)
    setStreaming(false)
    setThinking('')
    setRuntimeError('Generation stopped.')
    setRetryMode('request')
  }, [])

  const sendAgentRequest = useCallback(async ({
    userText,
    attachments,
    runtimeImages,
    replaceLastAgent = false,
  }: PendingAgentRequest & { replaceLastAgent?: boolean }) => {
    if (!selectedAgentDbId || !agent) return

    const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'
    const controller = new AbortController()
    abortControllerRef.current = controller
    pendingRequestRef.current = { userText, attachments, runtimeImages }
    setLoading(true)
    setStreaming(true)
    setRetryMode(null)

    try {
      const res = await fetch(`${AGENT_RUNTIME_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceId: agent.workspace_id || '',
          agentId: selectedAgentDbId,
          agentName: agent.name,
          agentRole: agent.role,
          message: userText,
          provider: selectedModelOption?.provider,
          model: selectedModelOption?.model,
          sessionId: `web-${selectedAgentDbId}`,
          images: runtimeImages,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('agent-runtime /chat error:', res.status, errorText)
        let errorCode = 'provider-fetch-failed'
        try {
          const parsed = JSON.parse(errorText)
          if (parsed?.error === 'vision-unsupported') errorCode = 'vision-unsupported'
        } catch {
          // Ignore invalid JSON and keep the generic error code.
        }
        setRetryMode('request')
        setRuntimeError(runtimeErrorMessage(errorCode))
        return
      }

      const result = await res.json()
      const assistantText = result.response || 'Done.'

      setMessages((prev) => {
        const base = replaceLastAgent && prev[prev.length - 1]?.from === 'agent' ? prev.slice(0, -1) : prev
        return [
          ...base,
          {
            from: 'agent',
            text: assistantText,
            rawText: assistantText,
            reasoning: result.reasoning,
            notice: result.notice,
            toolCalls: result.toolCalls,
            time: 'Just now',
          },
        ]
      })

      if (assistantText.trim()) {
        try {
          const meta: ChatAttachment[] = []
          if (result.toolCalls || result.reasoning || result.notice) {
            meta.push({
              type: 'metadata' as any,
              url: '',
              path: JSON.stringify({
                toolCalls: result.toolCalls,
                reasoning: result.reasoning,
                notice: result.notice,
              }),
            })
          }
          const saved = await postAgentConversationMessage(selectedAgentDbId, 'agent', assistantText, 'Just now', meta.length ? meta : undefined)
          if (saved?.id) {
            setMessages((prev) => {
              const last = [...prev]
              for (let i = last.length - 1; i >= 0; i--) {
                if (last[i].from === 'agent' && !last[i]._realtimeId) {
                  last[i] = { ...last[i], _realtimeId: saved.id }
                  break
                }
              }
              return last
            })
          }
        } catch (err) {
          console.error('Failed saving assistant message', err)
        }
      }

      setRuntimeError(null)
      setRetryMode(null)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setRetryMode('request')
      setRuntimeError(runtimeErrorMessage('provider-fetch-failed'))
    } finally {
      abortControllerRef.current = null
      setLoading(false)
      setStreaming(false)
      setThinking('')
    }
  }, [agent, selectedAgentDbId, selectedModelOption])

  const retryLastAgentRequest = useCallback(async () => {
    if (!pendingRequestRef.current) return
    setRuntimeError(null)
    await sendAgentRequest({
      ...pendingRequestRef.current,
      replaceLastAgent: true,
    })
  }, [sendAgentRequest])

  const regenerateLastResponse = useCallback(async () => {
    const lastUser = [...messages].reverse().find((msg) => msg.from === 'user')
    if (!lastUser || !selectedAgentDbId) return
    setRuntimeError(null)
    await sendAgentRequest({
      userText: lastUser.rawText || '',
      attachments: lastUser.attachments || [],
      runtimeImages: lastUser.images,
      replaceLastAgent: true,
    })
  }, [messages, selectedAgentDbId, sendAgentRequest])

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input
    if ((!text.trim() && attachedImages.length === 0) || loading) return
    if (!user?.id) return

    const userText = text.trim()
    setRuntimeError(null)
    setRetryMode(null)
    const images = [...attachedImages]
    const imageFiles = images.map((img) => img.file)
    let runtimeImages: string[] | undefined

    if (imageFiles.length > 0 && !selectedModelSupportsVision) {
      setRuntimeError(runtimeErrorMessage('vision-unsupported'))
      return
    }

    if (imageFiles.length > 0) {
      try {
        runtimeImages = await Promise.all(imageFiles.map((file) => fileToDataUrl(file)))
      } catch (err) {
        console.error('Failed encoding chat images', err)
        setRuntimeError('Image processing failed. The message was not sent.')
        return
      }
    }

    // Show message immediately with local preview URLs
    const localPreviews = images.map((img) => img.preview)
    const userMsg = {
      from: 'user',
      text: userText || (images.length ? `[${images.length} image(s)]` : ''),
      rawText: userText,
      images: localPreviews,
      attachments: [] as ChatAttachment[],
      time: 'Just now',
    }

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setAttachedImages([])

    const next = [...messages, userMsg]
    setMessages(next)

    // Upload images in background, then update message with real URLs
    let attachments: ChatAttachment[] = []
    if (imageFiles.length > 0) {
      try {
        const scope = isGroup
          ? `group-${selectedGroupDbId || agentId || 'unknown'}`
          : `agent-${selectedAgentDbId || agentId || 'unknown'}`
        setUploadProgress({ completed: 0, total: imageFiles.length, label: 'Uploading images...' })
        for (const file of imageFiles) {
          const [attachment] = await uploadTeamChatImages(user.auth_id || user.id, scope, [file])
          if (attachment) attachments.push(attachment)
          setUploadProgress((prev) => prev ? { ...prev, completed: prev.completed + 1 } : prev)
        }
        // Update message with real URLs
        setMessages((prev) => prev.map((m) =>
          m === userMsg ? { ...m, images: attachments.map((a) => a.url), attachments } : m,
        ))
      } catch (err) {
        console.error('Failed uploading chat images', err)
        setUploadProgress(null)
        setRetryMode('upload')
        setRuntimeError('Image upload failed. The message was not sent.')
        return
      }
    }
    setUploadProgress(null)
    images.forEach((img) => URL.revokeObjectURL(img.preview))

    if (isGroup) {
      if (selectedGroupDbId) {
        try {
          await postWorkspaceGroupMessage(selectedGroupDbId, 'You', userText, undefined, attachments)
        } catch (err) {
          console.error('Failed saving group message', err)
        }
      }
      return
    }

    try {
      if (selectedAgentDbId) {
        try {
          await postAgentConversationMessage(selectedAgentDbId, 'user', userText, 'Just now', attachments)
        } catch (err) {
          console.error('Failed saving user message', err)
        }
      }

      await sendAgentRequest({
        userText,
        attachments,
        runtimeImages,
      })
    } catch (e) {
      setRuntimeError(runtimeErrorMessage('provider-fetch-failed'))
    }
  }

  if (!dataLoaded && !agent) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[var(--olu-text-secondary)]">Loading chat...</p>
    </div>
  )

  if (!agent) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[var(--olu-text-secondary)]">Agent not found.</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--olu-card-border)] flex-shrink-0 rounded-t-[28px] bg-[image:var(--olu-chat-header-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
        <button onClick={() => navigate('/business/team')} className="p-1.5 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors mr-1">
          <ArrowLeft size={18} className="text-[var(--olu-text-secondary)]" />
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
            <p className="text-[var(--olu-text-secondary)] text-xs capitalize">{loading ? 'typing...' : `${agent.status} · ${agent.role}`}</p>
          </div>
        </div>
        {!isGroup && tasks.length > 0 && (
          <div className="flex gap-1">
            {['chat', 'tasks'].map(t => (
              <button key={t} onClick={() => {
                if (tab === 'chat' && chatScrollRef.current) {
                  chatScrollTopRef.current = chatScrollRef.current.scrollTop
                }
                setTab(t)
              }}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-cyan-300 text-[#04111f]' : 'text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)] bg-[var(--olu-input-bg)] border border-[var(--olu-card-border)]')}>
                {t === 'tasks' ? `Tasks (${tasks.filter(t => t.status !== 'done').length})` : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'tasks' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 rounded-b-[28px] bg-[image:var(--olu-chat-area-bg)] border-x border-b border-[var(--olu-card-border)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
          <p className="text-[var(--olu-text-secondary)] text-xs font-semibold uppercase tracking-wider mb-3">Active Tasks</p>
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      ) : (
        <>
          {runtimeError && (
            <div className="px-4 pt-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-100">
                <AlertTriangle size={16} className="mt-0.5 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                <div className="flex-1">
                  <p>{runtimeError}</p>
                  {retryMode && (
                    <button
                      onClick={retryMode === 'upload' ? sendMessage : retryLastAgentRequest}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-100 hover:bg-amber-400/15"
                    >
                      <RefreshCcw size={12} />
                      <span>{retryMode === 'upload' ? 'Retry upload' : 'Retry request'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {uploadProgress && (
            <div className="px-4 pt-4">
              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm text-[var(--olu-sidebar-text)]">
                  <span>{uploadProgress.label}</span>
                  <span>{uploadProgress.completed}/{uploadProgress.total}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300 transition-all"
                    style={{ width: `${Math.max(8, (uploadProgress.completed / uploadProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Messages */}
          <div
            ref={chatScrollRef}
            onScroll={(e) => {
              chatScrollTopRef.current = e.currentTarget.scrollTop
            }}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[image:var(--olu-chat-area-bg)] border-x border-[var(--olu-card-border)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]"
          >
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
                      <p className="text-xs text-[var(--olu-text-secondary)] px-1">{msg.from}{participant?.role ? ` · ${participant.role}` : ''}</p>
                    )
                  })()}
                  <div className={clsx(
                    'px-5 py-3.5 rounded-[24px] text-[15px] leading-7 border shadow-[0_2px_12px_rgba(2,8,23,0.08)]',
                    msg.from === 'user'
                      ? 'bg-[var(--olu-chat-user-bg)] text-[var(--olu-chat-user-text)] border-[var(--olu-chat-user-border)] rounded-tr-[10px]'
                      : 'bg-[var(--olu-chat-agent-bg)] text-[var(--olu-chat-agent-text)] border-[var(--olu-chat-agent-border)] rounded-tl-[10px]'
                  )}>
                    {msg.from === 'agent' ? (
                      msg.text ? (
                        <>
                          {showReasoning && msg.reasoning && (
                            <ReasoningBlock text={msg.reasoning} />
                          )}
                          <div className={clsx(
                            'prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 prose-pre:px-3 prose-pre:py-2 prose-code:px-1 prose-code:rounded prose-headings:mb-2',
                            'dark:prose-invert prose-headings:text-[var(--olu-text)] prose-code:bg-black/5 dark:prose-code:bg-white/10 prose-code:text-[var(--olu-text)] prose-pre:bg-[var(--olu-input-bg)]'
                          )}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: ({ inline, className, children }) => (
                                  inline
                                    ? <code className="rounded bg-olu-surface px-1 py-0.5 text-olu-text">{children}</code>
                                    : <CodeBlock className={className}>{children}</CodeBlock>
                                ),
                                img: ({ src, alt }) => (
                                  <img
                                    src={src}
                                    alt={alt || 'Generated image'}
                                    className="rounded-xl max-w-full my-2 cursor-zoom-in border border-[var(--olu-card-border)]"
                                    style={{ maxHeight: 400 }}
                                    loading="lazy"
                                    onClick={() => src && setExpandedImage(String(src))}
                                  />
                                ),
                                table: ({ children }) => (
                                  <div className="my-3 overflow-x-auto">
                                    <table className="min-w-full border-collapse text-sm">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="border-b border-[var(--olu-card-border)] text-[var(--olu-sidebar-text)]">
                                    {children}
                                  </thead>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2 align-top border-t border-[var(--olu-card-border)]">
                                    {children}
                                  </td>
                                ),
                              }}
                            >{preprocessMarkdown(msg.text)}</ReactMarkdown>
                          </div>
                          {msg.notice && (
                            <p className="mt-3 rounded-xl border border-[var(--olu-card-border)] bg-cyan-500/5 px-3 py-2 text-xs text-[var(--olu-sidebar-text)]">
                              {msg.notice}
                            </p>
                          )}
                          {showToolDebug && msg.toolCalls?.length > 0 && <ToolCallCards toolCalls={msg.toolCalls} />}
                          {msg.toolCalls && (() => {
                            const budgetData = parseBudgetFromToolCalls(msg.toolCalls)
                            if (!budgetData) return null
                            if (budgetData.type === 'budget_approval_required') {
                              return <BudgetApprovalCard data={budgetData} onApprove={async (amount) => {
                                try {
                                  await approveBudgetAPI(budgetData.budget_id, amount)
                                  sendMessage(`Budget approved: $${amount}. Proceed with the task.`)
                                } catch (err) {
                                  sendMessage(`Budget approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                                }
                              }} />
                            }
                            if (budgetData.type === 'budget_progress') {
                              return <BudgetProgressCard data={budgetData} onStop={async () => {
                                try {
                                  await pauseBudget(budgetData.budget_id)
                                  sendMessage('Budget paused. Remaining funds returned to wallet.')
                                } catch (err) {
                                  sendMessage(`Failed to pause budget: ${err instanceof Error ? err.message : 'Unknown error'}`)
                                }
                              }} />
                            }
                            return null
                          })()}
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
                          <img
                            key={j}
                            src={src}
                            alt=""
                            onClick={() => setExpandedImage(src)}
                            className="rounded-lg max-w-[200px] max-h-[150px] cursor-zoom-in object-cover border border-cyan-200/20"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    {!(msg.from === 'agent' && i === messages.length - 1 && (loading || streaming)) && (
                      <p className="text-[var(--olu-text-secondary)] text-xs">{msg.time}</p>
                    )}
                    {!isGroup && msg.from === 'agent' && i === messages.length - 1 && !loading && (
                      <button
                        onClick={regenerateLastResponse}
                        className="inline-flex items-center gap-1 text-xs text-[var(--olu-text-secondary)] hover:text-olu-text transition-colors"
                      >
                        <RefreshCcw size={12} />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
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
                <div className="px-5 py-3.5 rounded-[24px] rounded-tl-[10px] bg-[var(--olu-chat-agent-bg)] border border-[var(--olu-chat-agent-border)] flex items-center gap-2 shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
                  <Loader2 size={15} className="text-[var(--olu-text-secondary)] animate-spin" />
                  <span className="text-[var(--olu-text-secondary)] text-[15px] leading-7">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
          <AnimatePresence>
            {expandedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/90 p-6"
                onClick={() => setExpandedImage(null)}
              >
                <button
                  onClick={() => setExpandedImage(null)}
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <X size={18} />
                </button>
                <img
                  src={expandedImage}
                  alt="Expanded attachment"
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-full max-w-full rounded-2xl border border-[var(--olu-card-border)] shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          {thinking && (
            <div className="px-4 py-2 border-x border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
              <p className="text-[var(--olu-text-secondary)] text-xs italic line-clamp-2">Thinking: {thinking}...</p>
            </div>
          )}
          <div
            className="p-4 border-x border-b border-[var(--olu-card-border)] rounded-b-[28px] bg-[var(--olu-section-bg)] flex-shrink-0"
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
                  <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--olu-card-border)]">
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
              <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-input-bg)] focus-within:border-[var(--olu-card-border)] transition-colors">
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
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendMessage() }
                  }}
                  onPaste={e => {
                    const files = Array.from(e.clipboardData.files)
                    if (files.some(f => f.type.startsWith('image/'))) {
                      e.preventDefault()
                      if (!selectedModelSupportsVision) {
                        setRuntimeError(runtimeErrorMessage('vision-unsupported'))
                        return
                      }
                      addImages(files)
                    }
                  }}
                  placeholder={isGroup ? `Message the group... (@ to mention)` : `Message ${agent.name}...`}
                  rows={1}
                  className="w-full px-4 pt-3 pb-1 bg-transparent text-sm text-[var(--olu-input-text)] placeholder:text-[var(--olu-input-placeholder)] focus:outline-none resize-none"
                  style={{ maxHeight: 120 }}
                />
                {/* Toolbar row inside the input container */}
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-0.5">
                    {/* Image attach */}
                    {selectedModelSupportsVision && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => { if (e.target.files) addImages(e.target.files); e.target.value = '' }}
                        />
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-lg text-[var(--olu-input-placeholder)] hover:text-[var(--olu-sidebar-text)] hover:bg-[var(--olu-card-hover)] transition-all"
                          title="Attach image"
                        >
                          <ImageIcon size={16} />
                        </button>
                      </>
                    )}
                    {/* Reasoning toggle — only for models that support it (Kimi) */}
                    {(['default', 'kimi'].includes(selectedModelOption?.provider || '')) && (
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowReasoning(!showReasoning)}
                        title={showReasoning ? 'Hide reasoning' : 'Show reasoning'}
                        className={clsx(
                          'p-2 rounded-lg transition-all',
                          showReasoning ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10' : 'text-[var(--olu-input-placeholder)] hover:text-[var(--olu-text-secondary)]'
                        )}
                      >
                        <Brain size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Model selector — hidden for marketplace (openclaw) agents */}
                    {availableModels.length > 1 && agent?.runtime_type !== 'openclaw' && (
                      <div className="relative">
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => setShowModelMenu(!showModelMenu)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--olu-input-placeholder)] hover:text-[var(--olu-sidebar-text)] hover:bg-[var(--olu-card-hover)] transition-all whitespace-nowrap"
                        >
                          {selectedModelOption ? `${selectedModelOption.providerLabel} · ${selectedModelOption.model}` : 'Model'}
                        </button>
                        <AnimatePresence>
                          {showModelMenu && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => { setShowModelMenu(false); setModelSearch('') }} />
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="absolute bottom-full right-0 mb-2 z-50 flex flex-col min-w-[260px] max-h-80 rounded-xl bg-[var(--olu-input-bg)] border border-[var(--olu-card-border)] shadow-2xl"
                              >
                                <div className="px-3 pt-2 pb-1 border-b border-[var(--olu-card-border)]">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={modelSearch}
                                    onChange={(e) => setModelSearch(e.target.value)}
                                    placeholder="Search models..."
                                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-xs text-[var(--olu-text)] placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-cyan-400"
                                  />
                                </div>
                                <div className="overflow-y-auto py-1 max-h-64">
                                {Object.keys(groupedModels).length === 0 && modelSearch && (
                                  <div className="px-4 py-3 text-xs text-[var(--olu-muted)] text-center">No models found</div>
                                )}
                                {Object.entries(groupedModels).map(([providerLabel, models]) => (
                                  <div key={providerLabel} className="py-1">
                                    <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--olu-input-placeholder)]">
                                      {providerLabel}
                                    </div>
                                    {models.map((m) => (
                                      <button
                                        key={m.id}
                                        onClick={() => {
                                          setSelectedModel(m.id)
                                          localStorage.setItem('olu-chat-model', m.id)
                                          setShowModelMenu(false)
                                          setModelSearch('')
                                        }}
                                        className={clsx(
                                          'w-full px-4 py-2.5 text-left text-sm transition-colors',
                                          selectedModel === m.id ? 'text-cyan-700 dark:text-cyan-300 bg-[var(--olu-accent-bg-strong)]' : 'text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)] hover:bg-[var(--olu-card-hover)]'
                                        )}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="truncate">{m.model}</span>
                                          {m.supportsVision && <span className="text-[10px] text-emerald-600 dark:text-emerald-300 flex-shrink-0">Vision</span>}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Send */}
                    <button
                      onClick={loading ? stopGeneration : sendMessage}
                      disabled={uploadProgress !== null || (!loading && !input.trim() && attachedImages.length === 0)}
                      className={clsx(
                        'p-2 rounded-lg transition-opacity',
                        loading
                          ? 'bg-amber-400 text-[#04111f] hover:opacity-90'
                          : 'bg-cyan-300 text-[#04111f] hover:opacity-90',
                        (uploadProgress !== null || (!loading && !input.trim() && attachedImages.length === 0)) && 'opacity-40'
                      )}
                    >
                      {loading ? <Square size={14} /> : <Send size={14} />}
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
