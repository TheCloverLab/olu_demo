import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, Send, Headphones } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import {
  ensureSocialChat,
  getSocialChatMessages,
  addSocialChatMessage,
} from '../../../domain/social/data'

type ChatMessage = {
  id: string
  fromType: 'user' | 'other'
  text: string
  time: string
}

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_MESSAGES: ChatMessage[] = [
  { id: 'm-1', fromType: 'other', text: 'Hi! Welcome to support. How can I help you today?', time: '10:00 AM' },
  { id: 'm-2', fromType: 'user', text: "Hi! I'm having trouble accessing the premium course content.", time: '10:02 AM' },
  { id: 'm-3', fromType: 'other', text: 'Let me look into that for you. Can you tell me which course you\'re trying to access?', time: '10:03 AM' },
  { id: 'm-4', fromType: 'user', text: 'The Advanced Digital Art Masterclass — it says "locked" even though I purchased the Pro membership.', time: '10:05 AM' },
  { id: 'm-5', fromType: 'other', text: "I see the issue — your payment is still being processed. It usually takes a few minutes. Let me check the status for you.", time: '10:06 AM' },
  { id: 'm-6', fromType: 'other', text: "Your payment has been confirmed now! Try refreshing the page and you should have full access. Let me know if it works.", time: '10:08 AM' },
]

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.fromType === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-2.5', isUser ? 'flex-row-reverse' : '')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center flex-shrink-0">
          <Headphones size={14} className="text-amber-600 dark:text-amber-400" />
        </div>
      )}

      <div className={clsx('max-w-[80%] flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-cyan-500 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)] rounded-tl-sm'
        )}>
          {msg.text}
        </div>
        <p className="text-[10px] text-[var(--olu-muted)] px-1">{msg.time}</p>
      </div>
    </motion.div>
  )
}

export default function SupportChat() {
  const { workspaceSlug } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [workspaceName, setWorkspaceName] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('Support')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return
      try {
        if (IS_DEMO) {
          setWorkspaceName('Pixel Realm')
          setMessages(DEMO_MESSAGES)
          setStaffName('Support Team')
          setLoading(false)
          return
        }

        const userId = user?.id
        if (!userId) { setLoading(false); return }

        // Find workspace by slug
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id, name, owner_user_id')
          .eq('slug', workspaceSlug)
          .single()

        if (!ws) { setLoading(false); return }
        setWorkspaceName(ws.name)

        const staffUserId = ws.owner_user_id
        const { data: staffUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', staffUserId)
          .single()

        if (staffUser) setStaffName(staffUser.name || 'Support')

        // Ensure 1-on-1 chat exists with staff
        const chat = await ensureSocialChat(userId, staffUserId)
        setChatId(chat.id)

        // Load messages
        const msgs = await getSocialChatMessages(chat.id)
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          fromType: m.from_type as 'user' | 'other',
          text: m.text,
          time: m.time || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceSlug, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    const optimistic: ChatMessage = {
      id: `m-${Date.now()}`,
      fromType: 'user',
      text,
      time: 'Just now',
    }
    setMessages((prev) => [...prev, optimistic])

    if (!IS_DEMO && chatId) {
      try {
        await addSocialChatMessage(chatId, 'user', text)
      } catch (err) {
        console.error('Failed to send message', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--olu-border)] flex-shrink-0">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center">
          <Headphones size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm truncate">{workspaceName || t('consumer.support', 'Support')}</h1>
          <p className="text-[var(--olu-muted)] text-xs">{staffName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Headphones size={32} className="mx-auto text-[var(--olu-muted)]" />
            <p className="text-sm text-[var(--olu-muted)]">{t('consumer.supportEmpty', 'Send a message to get help')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--olu-border)] flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
          placeholder={t('consumer.supportPlaceholder', 'Type a message...')}
          className="flex-1 px-4 py-2.5 bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)] rounded-xl text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-white text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
