import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Send, Headphones, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { useApp } from '../../../context/AppContext'
import { supabase } from '../../../lib/supabase'
import { listSupportChats, getMessages, sendMessage as sendChatMessage, subscribeChatMessages } from '../../../domain/chat/api'
import type { Chat, ChatMessage as UnifiedMessage, ChatMember } from '../../../domain/chat/types'
import { setAiSupportEnabled, getAiSupportEnabled } from '../../../domain/product/api'

type SupportChatView = Chat & {
  members?: ChatMember[]
  customer: {
    id: string
    name: string | null
    handle: string | null
    avatar_img: string | null
    avatar_color: string | null
    initials: string | null
  } | null
}

type ViewMessage = {
  id: string
  isCustomer: boolean
  text: string
  time: string
}

function CustomerAvatar({ customer, size = 'md' }: { customer: SupportChatView['customer']; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (customer?.avatar_img) {
    return <img src={customer.avatar_img} alt="" className={clsx(sz, 'rounded-full object-cover flex-shrink-0')} />
  }
  const color = customer?.avatar_color || 'from-gray-600 to-gray-500'
  return (
    <div className={clsx(sz, `bg-gradient-to-br ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`)}>
      {customer?.initials || '?'}
    </div>
  )
}

function ChatListItem({ chat, active, onClick }: { chat: SupportChatView; active: boolean; onClick: () => void }) {
  const name = chat.customer?.name || chat.customer?.handle || 'Customer'
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left',
        active
          ? 'bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)]'
          : 'hover:bg-[var(--olu-card-hover)] border border-transparent'
      )}
    >
      <CustomerAvatar customer={chat.customer} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{name}</span>
          {chat.last_message_at && (
            <span className="text-[10px] text-[var(--olu-muted)] flex-shrink-0">
              {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {chat.last_message && (
          <p className="text-xs text-[var(--olu-text-secondary)] truncate mt-0.5">{chat.last_message}</p>
        )}
      </div>
    </button>
  )
}

function ConversationView({ chat, currentUserId, onBack }: { chat: SupportChatView; currentUserId: string; onBack: () => void }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ViewMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set<string>())
  const name = chat.customer?.name || chat.customer?.handle || 'Customer'

  useEffect(() => {
    setLoading(true)
    getMessages(chat.id)
      .then((msgs) => {
        const viewMsgs = msgs.map((m): ViewMessage => ({
          id: m.id,
          isCustomer: m.sender_id !== currentUserId,
          text: m.content || '',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
        viewMsgs.forEach((m) => seenIds.current.add(m.id))
        setMessages(viewMsgs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [chat.id, currentUserId])

  // Realtime
  useEffect(() => {
    const unsub = subscribeChatMessages(chat.id, (raw) => {
      if (raw.sender_id === currentUserId) return
      if (seenIds.current.has(raw.id)) return
      seenIds.current.add(raw.id)
      setMessages((prev) => [...prev, {
        id: raw.id,
        isCustomer: true,
        text: raw.content || '',
        time: new Date(raw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    })
    return unsub
  }, [chat.id, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    const optimistic: ViewMessage = {
      id: `m-${Date.now()}`,
      isCustomer: false,
      text,
      time: 'Just now',
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const sent = await sendChatMessage(chat.id, currentUserId, 'user', text)
      seenIds.current.add(sent.id)
    } catch (err) {
      console.error('Failed to send reply', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--olu-border)] flex-shrink-0">
        <button onClick={onBack} className="md:hidden p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <CustomerAvatar customer={chat.customer} size="sm" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm truncate">{name}</h2>
          <p className="text-[var(--olu-muted)] text-xs">
            {chat.customer?.handle ? `@${chat.customer.handle}` : 'Customer'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={20} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <MessageSquare size={32} className="mx-auto text-[var(--olu-muted)]" />
            <p className="text-sm text-[var(--olu-muted)]">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx('flex gap-2.5', msg.isCustomer ? '' : 'flex-row-reverse')}
            >
              {msg.isCustomer && <CustomerAvatar customer={chat.customer} size="sm" />}
              <div className={clsx('max-w-[80%] flex flex-col gap-0.5', msg.isCustomer ? 'items-start' : 'items-end')}>
                <div className={clsx(
                  'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                  msg.isCustomer
                    ? 'bg-gray-100 dark:bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)] rounded-tl-sm'
                    : 'bg-cyan-500 text-white rounded-tr-sm'
                )}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-[var(--olu-muted)] px-1">{msg.time}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-[var(--olu-border)] flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendReply()}
          placeholder={t('business.supportReplyPlaceholder', 'Type a reply...')}
          className="flex-1 px-4 py-2.5 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-[var(--olu-card-border)] focus:ring-1 focus:ring-cyan-400/20 transition-colors"
        />
        <button
          onClick={sendReply}
          disabled={!input.trim() || sending}
          className="p-2.5 rounded-xl bg-cyan-300 text-[#04111f] hover:bg-cyan-200 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default function SupportCenter() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspace } = useApp()
  const [chats, setChats] = useState<SupportChatView[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<SupportChatView | null>(null)
  const [masterToggle, setMasterToggle] = useState(false)

  useEffect(() => {
    if (!user?.id || !workspace?.id) return

    listSupportChats(workspace.id)
      .then(async (chatData) => {
        const enriched: SupportChatView[] = await Promise.all(
          chatData.map(async (chat) => {
            const customerMember = (chat.members || []).find((m: ChatMember) => m.role === 'member')
            let customer: SupportChatView['customer'] = null

            if (customerMember) {
              const { data: customerUser } = await supabase
                .from('users')
                .select('id, name, handle, avatar_img, avatar_color, initials')
                .eq('id', customerMember.user_id)
                .single()
              customer = customerUser
            }

            return { ...chat, customer }
          })
        )
        setChats(enriched)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id, workspace?.id])

  useEffect(() => {
    if (!workspace?.id) return
    getAiSupportEnabled(workspace.id).then(setMasterToggle).catch(() => {})
  }, [workspace?.id])

  const aiEnabled = masterToggle

  async function toggleMaster() {
    if (!workspace?.id) return
    const next = !masterToggle
    setMasterToggle(next)
    try {
      await setAiSupportEnabled(workspace.id, next)
    } catch {
      setMasterToggle(!next)
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
    <div className="h-full flex flex-col md:flex-row">
      <div className={clsx(
        'md:w-80 md:border-r md:border-[var(--olu-border)] flex flex-col flex-shrink-0',
        activeChat ? 'hidden md:flex' : 'flex'
      )}>
        <div className="px-4 md:px-4 py-4 border-b border-[var(--olu-border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-amber-600 dark:text-amber-400" />
              <h1 className="font-bold text-lg">{t('nav.support', 'Support')}</h1>
            </div>
            <span className="text-xs text-[var(--olu-text-secondary)]">
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={toggleMaster}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
              aiEnabled
                ? 'border-[var(--olu-card-border)] bg-[var(--olu-accent-bg)]'
                : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)]'
            )}
          >
            <Sparkles size={16} className={aiEnabled ? 'text-cyan-500' : 'text-[var(--olu-muted)]'} />
            <div className="flex-1 text-left">
              <p className="text-xs font-medium">AI Support</p>
              <p className="text-[10px] text-[var(--olu-muted)]">
                {aiEnabled ? 'Auto-replies enabled' : 'Off — manual replies only'}
              </p>
            </div>
            <div className={clsx(
              'w-9 h-5 rounded-full transition-colors relative',
              aiEnabled ? 'bg-cyan-500' : 'bg-gray-500/40'
            )}>
              <div className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                aiEnabled ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </div>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
          {chats.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Headphones size={32} className="mx-auto text-[var(--olu-muted)]" />
              <p className="text-sm text-[var(--olu-muted)]">No support conversations yet</p>
              <p className="text-xs text-[var(--olu-muted)]">Customers can reach you from your workspace page</p>
            </div>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                active={activeChat?.id === chat.id}
                onClick={() => setActiveChat(chat)}
              />
            ))
          )}
        </div>
      </div>

      <div className={clsx(
        'flex-1 min-w-0',
        activeChat ? 'flex' : 'hidden md:flex'
      )}>
        {activeChat && user?.id ? (
          <ConversationView
            key={activeChat.id}
            chat={activeChat}
            currentUserId={user.id}
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MessageSquare size={32} className="mx-auto text-[var(--olu-muted)]" />
              <p className="text-sm text-[var(--olu-muted)]">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
