import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, ArrowLeft, Send, Headphones, Bot } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { ensureSupportChat, getMessages, sendMessage as sendChatMessage, subscribeChatMessages } from '../../../domain/chat/api'
import type { ChatMessage as UnifiedMessage } from '../../../domain/chat/types'

const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'

type ViewMessage = {
  id: string
  fromType: 'user' | 'other'
  text: string
  time: string
  isAi?: boolean
}

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_MESSAGES: ViewMessage[] = [
  { id: 'm-1', fromType: 'other', text: 'Hi! Welcome to support. How can I help you today?', time: '10:00 AM' },
  { id: 'm-2', fromType: 'user', text: "Hi! I'm having trouble accessing the premium course content.", time: '10:02 AM' },
  { id: 'm-3', fromType: 'other', text: 'Let me look into that for you. Can you tell me which course you\'re trying to access?', time: '10:03 AM' },
  { id: 'm-4', fromType: 'user', text: 'The Advanced Digital Art Masterclass — it says "locked" even though I purchased the Pro membership.', time: '10:05 AM' },
  { id: 'm-5', fromType: 'other', text: "I see the issue — your payment is still being processed. It usually takes a few minutes. Let me check the status for you.", time: '10:06 AM' },
  { id: 'm-6', fromType: 'other', text: "Your payment has been confirmed now! Try refreshing the page and you should have full access. Let me know if it works.", time: '10:08 AM' },
]

function toViewMessage(msg: UnifiedMessage, currentUserId: string): ViewMessage {
  const isUser = msg.sender_id === currentUserId
  return {
    id: msg.id,
    fromType: isUser ? 'user' : 'other',
    text: msg.content || '',
    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAi: msg.sender_type === 'agent',
  }
}

function MessageBubble({ msg }: { msg: ViewMessage }) {
  const isUser = msg.fromType === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-2.5', isUser ? 'flex-row-reverse' : '')}
    >
      {!isUser && (
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          msg.isAi
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10'
            : 'bg-gradient-to-br from-amber-500/20 to-amber-600/10'
        )}>
          {msg.isAi ? (
            <Bot size={14} className="text-cyan-600 dark:text-cyan-400" />
          ) : (
            <Headphones size={14} className="text-amber-600 dark:text-amber-400" />
          )}
        </div>
      )}

      <div className={clsx('max-w-[80%] flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
        {msg.isAi && (
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium px-1">AI Assistant</span>
        )}
        <div className={clsx(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-cyan-500 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-gray-100 dark:bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)] rounded-tl-sm'
        )}>
          {isUser ? msg.text : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                table: ({ children }) => <table className="border-collapse text-xs my-1.5 w-full">{children}</table>,
                th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-semibold bg-gray-200 dark:bg-gray-700">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{children}</td>,
                code: ({ children, className }) => {
                  if (className) return <pre className="bg-black/10 dark:bg-black/30 rounded-lg px-3 py-2 overflow-x-auto text-xs my-1.5"><code>{children}</code></pre>
                  return <code className="bg-black/10 dark:bg-black/20 rounded px-1 py-0.5 text-xs">{children}</code>
                },
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">{children}</a>,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          )}
        </div>
        <p className="text-[10px] text-[var(--olu-muted)] px-1">{msg.time}</p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-cyan-600 dark:text-cyan-400" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--olu-muted)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function generateDemoReply(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('price') || lower.includes('cost')) return "Our plans start from $9.99/month. Would you like details?"
  if (lower.includes('hi') || lower.includes('hello')) return "Hello! Welcome to our support. How can I help you today?"
  return "Thanks for reaching out! I've noted your message. Is there anything else you can share?"
}

export default function SupportChat() {
  const { workspaceSlug } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [workspaceName, setWorkspaceName] = useState('')
  const [messages, setMessages] = useState<ViewMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('Support')
  const [aiTyping, setAiTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set<string>())
  const wsRef = useRef<{ id: string; name: string } | null>(null)
  const agentRef = useRef<{ id: string; name: string; role?: string; avatarImg?: string } | null>(null)

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

        wsRef.current = { id: ws.id, name: ws.name }

        // Find support agent for this workspace
        const { data: agents } = await supabase
          .from('workspace_agents')
          .select('id, name, role, avatar_img')
          .eq('workspace_id', ws.id)
          .eq('support_enabled', true)
          .limit(1)
        if (agents?.[0]) {
          agentRef.current = { id: agents[0].id, name: agents[0].name, role: agents[0].role, avatarImg: agents[0].avatar_img }
        }

        // Ensure support chat exists (unified)
        const chat = await ensureSupportChat(ws.id, userId, staffUserId)
        setChatId(chat.id)

        // Load messages
        const msgs = await getMessages(chat.id)
        const viewMsgs = msgs.map((m) => toViewMessage(m, userId))
        viewMsgs.forEach((m) => seenIds.current.add(m.id))
        setMessages(viewMsgs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceSlug, user?.id])

  // Realtime subscription
  useEffect(() => {
    if (!chatId || !user?.id) return
    const unsub = subscribeChatMessages(chatId, (raw) => {
      if (raw.sender_id === user.id) return  // skip own messages
      if (raw.sender_type === 'agent') return  // skip agent messages (added locally from runtime)
      if (seenIds.current.has(raw.id)) return
      seenIds.current.add(raw.id)
      setMessages((prev) => [...prev, toViewMessage(raw, user.id)])
    })
    return unsub
  }, [chatId, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    const optimistic: ViewMessage = {
      id: `m-${Date.now()}`,
      fromType: 'user',
      text,
      time: 'Just now',
    }
    setMessages((prev) => [...prev, optimistic])

    if (IS_DEMO) {
      setAiTyping(true)
      setTimeout(() => {
        const aiMsg: ViewMessage = {
          id: `ai-${Date.now()}`,
          fromType: 'other',
          text: generateDemoReply(text),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true,
        }
        setMessages((prev) => [...prev, aiMsg])
        setAiTyping(false)
      }, 1200 + Math.random() * 800)
      return
    }

    if (chatId && user?.id) {
      try {
        const sent = await sendChatMessage(chatId, user.id, 'user', text, {
          senderName: user.name || 'Anonymous',
        })
        seenIds.current.add(sent.id)

        // Trigger AI auto-reply via agent runtime
        const agent = agentRef.current
        const ws = wsRef.current
        if (agent && ws) {
          setAiTyping(true)
          try {
            const res = await fetch(`${AGENT_RUNTIME_URL}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workspaceId: ws.id,
                agentId: agent.id,
                agentName: agent.name,
                agentRole: `${agent.role || 'Customer support assistant'} for ${ws.name}. Reply in the same language as the user. Be concise and helpful.\nYou have tools to query the database in real-time: list_products, list_experiences, get_course_content, search_workspace_content. Use them to answer detailed questions about products, courses, pricing, etc.`,
                message: text,
                sessionId: chatId,
              }),
            })
            if (res.ok) {
              const result = await res.json()
              const replyText = result.response || result.text || ''
              if (replyText.trim()) {
                const saved = await sendChatMessage(chatId, agent.id, 'agent', replyText, {
                  senderName: agent.name,
                  senderAvatar: agent.avatarImg,
                })
                seenIds.current.add(saved.id)
                setMessages((prev) => [...prev, toViewMessage(saved, user.id)])
              }
            }
          } catch (err) {
            console.error('AI auto-reply failed', err)
          } finally {
            setAiTyping(false)
          }
        }
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
        {aiTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--olu-border)] flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
          placeholder={t('consumer.supportPlaceholder', 'Type a message...')}
          className="flex-1 px-4 py-2.5 bg-[var(--olu-card-bg)] border border-gray-200 dark:border-[var(--olu-card-border)] rounded-xl text-sm placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-white text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
