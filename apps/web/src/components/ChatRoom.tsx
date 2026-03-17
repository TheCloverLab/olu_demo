import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Image as ImageIcon, Paperclip, X, Loader2, Brain, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import type { ChatMessage, ChatFeatures, ChatAttachment } from '../domain/chat/types'
import { SCOPE_FEATURES } from '../domain/chat/types'
import type { ChatScope } from '../domain/chat/types'
import { getMessages, sendMessage, subscribeChatMessages, uploadChatImages } from '../domain/chat/api'
import type { ModelOption } from '@olu/shared'

// ── Message Bubble ────────────────────────────────────────────

function avatarColor(id: string): string {
  const gradients = [
    'from-violet-500 to-fuchsia-500',
    'from-pink-500 to-rose-600',
    'from-blue-500 to-blue-700',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600',
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return gradients[Math.abs(hash) % gradients.length]
}

function MessageBubble({
  msg,
  isOwn,
  features,
}: {
  msg: ChatMessage
  isOwn: boolean
  features: ChatFeatures
}) {
  const gradient = avatarColor(msg.sender_id)
  const initials = (msg.sender_name || '?').slice(0, 2).toUpperCase()

  const [showReasoning, setShowReasoning] = useState(false)

  // Extract reasoning from metadata
  const reasoning = !isOwn && msg.metadata && !Array.isArray(msg.metadata)
    ? (msg.metadata as Record<string, unknown>).reasoning as string | undefined
    : undefined

  // Extract images from metadata
  const images: string[] = []
  if (msg.metadata && Array.isArray(msg.metadata)) {
    for (const att of msg.metadata as ChatAttachment[]) {
      if (att?.type === 'image' && att?.url) images.push(att.url)
    }
  } else if (msg.metadata?.attachments && Array.isArray(msg.metadata.attachments)) {
    for (const att of msg.metadata.attachments) {
      if (att?.type === 'image' && att?.url) images.push(att.url)
    }
  }

  // Tool call rendering
  if (msg.message_type === 'tool_call' && features.toolCalls) {
    return (
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <div className="rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] p-3 text-xs font-mono text-[var(--olu-muted)]">
            <div className="font-semibold text-[var(--olu-text-secondary)] mb-1">Tool Call</div>
            <pre className="whitespace-pre-wrap">{msg.content}</pre>
          </div>
        </div>
      </div>
    )
  }

  // System message
  if (msg.sender_type === 'system' || msg.message_type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-[var(--olu-muted)] bg-[var(--olu-card-bg)] px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div className={clsx('flex gap-3 mb-4', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-0.5">
          {msg.sender_avatar ? (
            <img src={msg.sender_avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
          ) : (
            <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br text-white text-xs font-bold', gradient)}>
              {initials}
            </div>
          )}
        </div>
      )}

      <div className={clsx('flex flex-col max-w-[80%]', isOwn && 'items-end')}>
        {/* Sender name */}
        {!isOwn && msg.sender_name && (
          <span className="text-[10px] text-[var(--olu-muted)] mb-0.5 px-1">{msg.sender_name}</span>
        )}

        {/* Message content */}
        <div
          data-testid={isOwn ? 'msg-user' : 'msg-agent'}
          className={clsx(
            'rounded-[24px] px-5 py-3.5 text-[15px] leading-7 break-words border shadow-[0_2px_12px_rgba(2,8,23,0.08)]',
            isOwn
              ? 'bg-[var(--olu-chat-user-bg)] text-[var(--olu-chat-user-text)] border-[var(--olu-chat-user-border)] rounded-tr-[10px]'
              : 'bg-[var(--olu-chat-agent-bg)] text-[var(--olu-chat-agent-text)] border-[var(--olu-chat-agent-border)] rounded-tl-[10px]'
          )}
        >
          {/* Reasoning (collapsible) */}
          {reasoning && (
            <div className="mb-2">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Brain size={12} />
                <span>Thinking</span>
                <ChevronDown size={12} className={clsx('transition-transform', showReasoning && 'rotate-180')} />
              </button>
              {showReasoning && (
                <div className="mt-1.5 text-xs opacity-70 whitespace-pre-wrap border-l-2 border-purple-500/30 pl-3">
                  {reasoning}
                </div>
              )}
            </div>
          )}
          {msg.content ? (
            features.markdown ? (
              <div
                className={clsx(
                  'prose prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-pre:px-3 prose-pre:py-2 prose-code:px-1 prose-code:rounded',
                  isOwn
                    ? 'prose-p:text-[var(--olu-chat-user-text)] prose-headings:text-[var(--olu-chat-user-text)] prose-strong:text-[var(--olu-chat-user-text)] prose-code:text-[var(--olu-chat-user-text)] prose-code:bg-black/10'
                    : 'dark:prose-invert prose-headings:text-[var(--olu-text)] prose-code:bg-black/5 dark:prose-code:bg-white/10',
                )}
                dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )
          ) : msg.sender_type !== 'user' ? (
            /* Loading dots for empty agent messages */
            <span className="flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-45 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-45 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-45 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : null}

          {/* Inline images */}
          {images.length > 0 && (
            <div className={clsx('flex gap-1 mt-1.5', images.length > 1 && 'flex-wrap')}>
              {images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-lg max-h-48 max-w-full object-cover cursor-pointer hover:opacity-90"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--olu-muted)] mt-0.5 mx-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  )
}

// ── Simple Markdown ───────────────────────────────────────────

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// ── Image Preview ─────────────────────────────────────────────

function ImagePreview({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  return (
    <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
      {files.map((f, i) => (
        <div key={i} className="relative flex-shrink-0">
          <img
            src={URL.createObjectURL(f)}
            alt=""
            className="h-16 w-16 object-cover rounded-lg border border-[var(--olu-card-border)]"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Main ChatRoom Component ───────────────────────────────────

export interface ChatRoomProps {
  chatId: string
  scope: ChatScope
  currentUserId: string
  currentUserName?: string
  currentUserAvatar?: string
  /** Override default scope features */
  features?: Partial<ChatFeatures>
  /** Extra header content (e.g. model selector for agent scope) */
  headerSlot?: React.ReactNode
  /** Custom message renderer for special types */
  renderMessage?: (msg: ChatMessage, defaultRender: React.ReactNode) => React.ReactNode
  /** Called after a message is successfully sent (e.g. to trigger AI reply) */
  onAfterSend?: (chatId: string, message: string, sentMsg: ChatMessage, opts?: { model?: string; provider?: string; reasoning?: boolean }) => void
  /** Called when model selection changes (parent can use for AI calls) */
  onModelChange?: (model: ModelOption | null) => void
  className?: string
}

export default function ChatRoom({
  chatId,
  scope,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  features: featureOverrides,
  headerSlot,
  renderMessage,
  onAfterSend,
  onModelChange,
  className,
}: ChatRoomProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const seenIds = useRef(new Set<string>())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Model selector state
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('olu-chat-model') || '')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  // Reasoning toggle
  const [reasoningEnabled, setReasoningEnabled] = useState(true)

  const features: ChatFeatures = { ...SCOPE_FEATURES[scope], ...featureOverrides }

  // Fetch available models
  useEffect(() => {
    if (!features.modelSelector) return
    const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'
    fetch(`${AGENT_RUNTIME_URL}/models`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.models?.length) return
        const options: ModelOption[] = data.models
        setAvailableModels(options)
        setSelectedModel((current) => {
          if (current && options.some((o) => o.id === current)) return current
          const fallback = options.find((o) => o.isDefault) || options[0]
          if (fallback) localStorage.setItem('olu-chat-model', fallback.id)
          return fallback?.id || current
        })
      })
      .catch(() => {})
  }, [features.modelSelector])

  // Computed model values
  const selectedModelOption = availableModels.find((o) => o.id === selectedModel) || null
  const filteredModels = modelSearch
    ? availableModels.filter(
        (m) =>
          m.model.toLowerCase().includes(modelSearch.toLowerCase()) ||
          m.providerLabel.toLowerCase().includes(modelSearch.toLowerCase()),
      )
    : availableModels
  const groupedModels = filteredModels.reduce<Record<string, ModelOption[]>>((acc, o) => {
    if (!acc[o.providerLabel]) acc[o.providerLabel] = []
    acc[o.providerLabel].push(o)
    return acc
  }, {})

  // Notify parent of model change
  useEffect(() => {
    onModelChange?.(selectedModelOption)
  }, [selectedModelOption, onModelChange])

  // Load messages
  useEffect(() => {
    if (!chatId) return
    setLoading(true)
    getMessages(chatId)
      .then((msgs) => {
        setMessages(msgs)
        msgs.forEach((m) => seenIds.current.add(m.id))
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [chatId])

  // Subscribe to realtime
  useEffect(() => {
    if (!chatId) return
    const unsub = subscribeChatMessages(chatId, (msg) => {
      if (seenIds.current.has(msg.id)) return
      seenIds.current.add(msg.id)
      setMessages((prev) => {
        // If this is from the current user, replace any optimistic message
        // with matching content (handles realtime firing before sendMessage returns)
        if (msg.sender_id === currentUserId) {
          const optIdx = prev.findIndex(
            (m) => m.id.startsWith('opt-') && m.sender_id === currentUserId && m.content === msg.content
          )
          if (optIdx >= 0) {
            return prev.map((m, i) => (i === optIdx ? msg : m))
          }
        }
        return [...prev, msg]
      })
    })
    return unsub
  }, [chatId, currentUserId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed && imageFiles.length === 0) return

    setSending(true)
    try {
      // Upload images if any
      let metadata: Record<string, unknown> = {}
      if (imageFiles.length > 0) {
        const attachments = await uploadChatImages(currentUserId, chatId, imageFiles)
        metadata = { attachments }
      }

      // Optimistic insert
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        chat_id: chatId,
        sender_id: currentUserId,
        sender_type: 'user',
        sender_name: currentUserName || null,
        sender_avatar: currentUserAvatar || null,
        message_type: imageFiles.length > 0 ? 'image' : 'text',
        content: trimmed || null,
        metadata,
        created_at: new Date().toISOString(),
      }
      seenIds.current.add(optimistic.id)
      setMessages((prev) => [...prev, optimistic])
      setText('')
      setImageFiles([])

      // Actually send
      const sent = await sendMessage(chatId, currentUserId, 'user', trimmed || '', {
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        messageType: imageFiles.length > 0 ? 'image' : 'text',
        metadata,
      })
      seenIds.current.add(sent.id)
      // Replace optimistic message with real one
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? sent : m))

      // Trigger AI reply if handler provided
      if (onAfterSend && trimmed) {
        onAfterSend(chatId, trimmed, sent, {
          model: selectedModelOption?.id || undefined,
          reasoning: reasoningEnabled,
        })
      }
    } catch (err) {
      console.error('Failed to send:', err)
    } finally {
      setSending(false)
    }
  }, [text, imageFiles, chatId, currentUserId, currentUserName, currentUserAvatar, onAfterSend])

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle image paste / drop
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!features.images) return
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((i) => i.type.startsWith('image/'))
    if (imageItems.length > 0) {
      e.preventDefault()
      const newFiles = imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[]
      setImageFiles((prev) => [...prev, ...newFiles].slice(0, 4))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!features.images) return
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files].slice(0, 4))
    }
  }

  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center h-full', className)}>
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div
      className={clsx('flex flex-col h-full', className)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Header slot */}
      {headerSlot}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--olu-muted)]">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          const defaultBubble = (
            <MessageBubble key={msg.id} msg={msg} isOwn={isOwn} features={features} />
          )
          return renderMessage ? (
            <div key={msg.id}>{renderMessage(msg, defaultBubble)}</div>
          ) : (
            defaultBubble
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imageFiles.length > 0 && (
        <ImagePreview
          files={imageFiles}
          onRemove={(i) => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}

      {/* Input */}
      <div className="border-t border-[var(--olu-card-border)] px-3 py-2.5">
        {/* Hidden file input */}
        {features.images && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              setImageFiles((prev) => [...prev, ...files].slice(0, 4))
              e.target.value = ''
            }}
          />
        )}

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={t('business.typeMessage')}
          rows={1}
          className="w-full bg-transparent text-sm resize-none max-h-32 focus:outline-none text-[var(--olu-text)] placeholder:text-[var(--olu-muted)]"
          style={{ minHeight: '38px' }}
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between mt-1">
          {/* Left: image + reasoning */}
          <div className="flex items-center gap-0.5">
            {features.images && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-[var(--olu-muted)] hover:text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] transition-all"
                title="Attach image"
              >
                <ImageIcon size={16} />
              </button>
            )}
            {features.files && (
              <button className="p-2 rounded-lg text-[var(--olu-muted)] hover:text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] transition-all">
                <Paperclip size={16} />
              </button>
            )}
            {features.reasoning && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setReasoningEnabled(!reasoningEnabled)}
                title={reasoningEnabled ? 'Reasoning on' : 'Reasoning off'}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  reasoningEnabled
                    ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10'
                    : 'text-[var(--olu-muted)] hover:text-[var(--olu-text-secondary)]',
                )}
              >
                <Brain size={16} />
              </button>
            )}
          </div>

          {/* Right: model selector + send */}
          <div className="flex items-center gap-1.5">
            {features.modelSelector && availableModels.length > 1 && (
              <div className="relative">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--olu-muted)] hover:text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)] transition-all whitespace-nowrap"
                >
                  {selectedModelOption
                    ? `${selectedModelOption.providerLabel} · ${selectedModelOption.model}`
                    : 'Model'}
                </button>
                <AnimatePresence>
                  {showModelMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setShowModelMenu(false)
                          setModelSearch('')
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-full right-0 mb-2 z-50 flex flex-col min-w-[260px] max-h-80 rounded-xl bg-[var(--olu-input-bg,var(--olu-card-bg))] border border-[var(--olu-card-border)] shadow-2xl"
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
                            <div className="px-4 py-3 text-xs text-[var(--olu-muted)] text-center">
                              No models found
                            </div>
                          )}
                          {Object.entries(groupedModels).map(([providerLabel, models]) => (
                            <div key={providerLabel} className="py-1">
                              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--olu-muted)]">
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
                                    selectedModel === m.id
                                      ? 'text-cyan-700 dark:text-cyan-300 bg-[var(--olu-accent-bg)]'
                                      : 'text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)] hover:bg-[var(--olu-card-hover)]',
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="truncate">{m.model}</span>
                                    {m.supportsVision && (
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-300 flex-shrink-0">
                                        Vision
                                      </span>
                                    )}
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
            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && imageFiles.length === 0)}
              className="p-2 rounded-lg bg-sky-600 text-white hover:bg-cyan-400 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
