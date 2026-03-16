import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Image as ImageIcon, Paperclip, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { ChatMessage, ChatFeatures, ChatAttachment } from '../domain/chat/types'
import { SCOPE_FEATURES } from '../domain/chat/types'
import type { ChatScope } from '../domain/chat/types'
import { getMessages, sendMessage, subscribeChatMessages, uploadChatImages } from '../domain/chat/api'

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
    <div className={clsx('flex gap-2.5 mb-3', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-1">
          {msg.sender_avatar ? (
            <img src={msg.sender_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br text-white text-xs font-bold', gradient)}>
              {initials}
            </div>
          )}
        </div>
      )}

      <div className={clsx('flex flex-col max-w-[75%]', isOwn && 'items-end')}>
        {/* Sender name */}
        {!isOwn && msg.sender_name && (
          <span className="text-[10px] text-[var(--olu-muted)] mb-0.5 ml-1">{msg.sender_name}</span>
        )}

        {/* Message content */}
        <div
          className={clsx(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-sky-600 text-white rounded-br-md'
              : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-bl-md'
          )}
        >
          {msg.content && (
            features.markdown ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1" dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }} />
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )
          )}

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

  const features: ChatFeatures = { ...SCOPE_FEATURES[scope], ...featureOverrides }

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
      setMessages((prev) => [...prev, msg])
    })
    return unsub
  }, [chatId])

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
    } catch (err) {
      console.error('Failed to send:', err)
    } finally {
      setSending(false)
    }
  }, [text, imageFiles, chatId, currentUserId, currentUserName, currentUserAvatar])

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
      <div className="border-t border-[var(--olu-card-border)] px-3 py-2.5 flex items-end gap-2">
        {features.images && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] text-[var(--olu-muted)] flex-shrink-0"
            >
              <ImageIcon size={18} />
            </button>
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
          </>
        )}
        {features.files && (
          <button className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] text-[var(--olu-muted)] flex-shrink-0">
            <Paperclip size={18} />
          </button>
        )}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={t('business.typeMessage')}
          rows={1}
          className="flex-1 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm resize-none max-h-32 focus:outline-none focus:border-cyan-400/50"
          style={{ minHeight: '38px' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && imageFiles.length === 0)}
          className="p-2 rounded-xl bg-sky-600 text-white hover:bg-cyan-400 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
