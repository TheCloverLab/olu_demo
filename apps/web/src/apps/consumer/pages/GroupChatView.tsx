import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, Send, Users } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useAuth } from '../../../context/AuthContext'
import type { WorkspaceExperience } from '../../../lib/supabase'
import {
  getExperience,
  getExperienceChatMessages,
  sendExperienceChatMessage,
  subscribeExperienceChat,
  type ExperienceChatMessage,
} from '../../../domain/experience/api'

type ChatMessage = {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  authorColor: string
  authorInitials: string
  text: string
  time: string
  isCurrentUser: boolean
}

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_MESSAGES: ChatMessage[] = [
  { id: 'm-1', authorId: 'u2', authorName: 'Alex Park', authorAvatar: '/images/fans/AlexPark.png', authorColor: 'from-pink-500 to-rose-600', authorInitials: 'AP', text: 'Hey everyone! Just finished the latest assignment from the masterclass. The layering technique is mind-blowing!', time: '10:23 AM', isCurrentUser: false },
  { id: 'm-2', authorId: 'u4', authorName: 'Mia Zhang', authorAvatar: '/images/fans/MeiSuzuki.png', authorColor: 'from-violet-500 to-purple-600', authorInitials: 'MZ', text: 'Nice! Can you share a screenshot? I\'m still working on mine', time: '10:25 AM', isCurrentUser: false },
  { id: 'm-3', authorId: 'u2', authorName: 'Alex Park', authorAvatar: '/images/fans/AlexPark.png', authorColor: 'from-pink-500 to-rose-600', authorInitials: 'AP', text: 'Sure! Here it is — the cyberpunk city scene with the neon reflections 🌃', time: '10:26 AM', isCurrentUser: false },
  { id: 'm-4', authorId: 'demo-consumer', authorName: 'You', authorAvatar: null, authorColor: 'from-cyan-500 to-blue-600', authorInitials: 'ME', text: 'That looks amazing! How did you get the reflection effect on the water?', time: '10:28 AM', isCurrentUser: true },
  { id: 'm-5', authorId: 'u3', authorName: 'Jordan Lee', authorAvatar: '/images/fans/JordanLee.png', authorColor: 'from-blue-500 to-blue-700', authorInitials: 'JL', text: 'I think that was covered in lesson 5 — the gradient masking technique. Check the course notes!', time: '10:30 AM', isCurrentUser: false },
  { id: 'm-6', authorId: 'u5', authorName: 'Sofia Martinez', authorAvatar: '/images/fans/DanaReyes.png', authorColor: 'from-rose-500 to-pink-600', authorInitials: 'SM', text: 'Who\'s planning to join the live session this weekend? Luna said she\'ll be doing a Q&A!', time: '10:35 AM', isCurrentUser: false },
  { id: 'm-7', authorId: 'u4', authorName: 'Mia Zhang', authorAvatar: '/images/fans/MeiSuzuki.png', authorColor: 'from-violet-500 to-purple-600', authorInitials: 'MZ', text: 'Count me in! 🙋‍♀️', time: '10:36 AM', isCurrentUser: false },
  { id: 'm-8', authorId: 'demo-consumer', authorName: 'You', authorAvatar: null, authorColor: 'from-cyan-500 to-blue-600', authorInitials: 'ME', text: 'I\'ll be there too. What time does it start?', time: '10:38 AM', isCurrentUser: true },
  { id: 'm-9', authorId: 'u5', authorName: 'Sofia Martinez', authorAvatar: '/images/fans/DanaReyes.png', authorColor: 'from-rose-500 to-pink-600', authorInitials: 'SM', text: '3 PM EST on Saturday. She posted it in the announcements!', time: '10:39 AM', isCurrentUser: false },
]

const COLORS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-green-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
]

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function toViewMessage(msg: ExperienceChatMessage, currentUserId: string): ChatMessage {
  const hash = msg.user_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return {
    id: msg.id,
    authorId: msg.user_id,
    authorName: msg.author_name,
    authorAvatar: msg.author_avatar,
    authorColor: msg.author_color || COLORS[hash % COLORS.length],
    authorInitials: getInitials(msg.author_name),
    text: msg.text,
    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isCurrentUser: msg.user_id === currentUserId,
  }
}

function MessageBubble({ msg, showAvatar }: { msg: ChatMessage; showAvatar: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-2.5', msg.isCurrentUser ? 'flex-row-reverse' : '')}
    >
      {!msg.isCurrentUser && (
        showAvatar ? (
          msg.authorAvatar ? (
            <img src={msg.authorAvatar} alt={msg.authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className={clsx('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white text-xs flex-shrink-0', msg.authorColor)}>
              {msg.authorInitials}
            </div>
          )
        ) : (
          <div className="w-8 flex-shrink-0" />
        )
      )}

      <div className={clsx('max-w-[80%] flex flex-col gap-0.5', msg.isCurrentUser ? 'items-end' : 'items-start')}>
        {showAvatar && !msg.isCurrentUser && (
          <p className="text-xs font-medium text-[var(--olu-text-secondary)] px-1">{msg.authorName}</p>
        )}
        <div className={clsx(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          msg.isCurrentUser
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

export default function GroupChatView() {
  const { experienceId } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set<string>())

  useEffect(() => {
    async function load() {
      if (!experienceId) return
      try {
        const exp = await getExperience(experienceId)
        setExperience(exp)

        if (IS_DEMO) {
          setMessages(DEMO_MESSAGES)
          setMemberCount(24)
          return
        }

        const userId = user?.id
        if (!userId) return

        const msgs = await getExperienceChatMessages(experienceId)
        const viewMsgs = msgs.map((m) => toViewMessage(m, userId))
        viewMsgs.forEach((m) => seenIds.current.add(m.id))
        setMessages(viewMsgs)

        // Count unique authors
        const uniqueAuthors = new Set(msgs.map((m) => m.user_id))
        setMemberCount(uniqueAuthors.size)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [experienceId, user?.id])

  // Subscribe to Realtime
  useEffect(() => {
    if (!experienceId || IS_DEMO || !user?.id) return
    const unsub = subscribeExperienceChat(experienceId, (msg) => {
      if (seenIds.current.has(msg.id)) return
      seenIds.current.add(msg.id)
      setMessages((prev) => [...prev, toViewMessage(msg, user.id)])
    })
    return unsub
  }, [experienceId, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !user?.id || !experienceId) return
    const text = input.trim()
    setInput('')

    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      authorId: user.id,
      authorName: user.name || 'You',
      authorAvatar: null,
      authorColor: 'from-cyan-500 to-blue-600',
      authorInitials: getInitials(user.name || 'You'),
      text,
      time: 'Just now',
      isCurrentUser: true,
    }
    setMessages((prev) => [...prev, optimistic])

    if (!IS_DEMO) {
      try {
        const saved = await sendExperienceChatMessage(
          experienceId,
          user.id,
          user.name || 'Anonymous',
          text,
        )
        // Replace optimistic with real message
        seenIds.current.add(saved.id)
        setMessages((prev) =>
          prev.map((m) => m.id === optimistic.id ? toViewMessage(saved, user.id) : m)
        )
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
        {experience?.cover ? (
          <img src={experience.cover} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center">
            <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-sm truncate">{experience?.name || 'Group Chat'}</h1>
          <p className="text-[var(--olu-muted)] text-xs flex items-center gap-1">
            <Users size={10} /> {memberCount} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Users size={32} className="mx-auto text-[var(--olu-muted)]" />
            <p className="text-sm text-[var(--olu-muted)]">{t('consumer.chatEmpty', 'Be the first to say something!')}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1]
          const showAvatar = !prevMsg || prevMsg.authorId !== msg.authorId
          return (
            <MessageBubble key={msg.id} msg={msg} showAvatar={showAvatar} />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--olu-border)] flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
          placeholder={`Message ${experience?.name || 'group'}...`}
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
