import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Send, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { useApp } from '../../../context/AppContext'
import { addSocialChatMessage, ensureSocialChat, getSocialChatMessages, getSocialChatsByUser } from '../../../services/api'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { consumerExperience } = useApp()
  const [selected, setSelected] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [chats, setChats] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChats() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const targetUserId = searchParams.get('with')
        if (targetUserId && targetUserId !== user.id) {
          await ensureSocialChat(user.id, targetUserId)
        }

        const data = await getSocialChatsByUser(user.id)
        setChats(data || [])

        if (targetUserId) {
          const matched = (data || []).find((c: any) => c.with_user_id === targetUserId)
          if (matched?.id) {
            setSelected(matched.id)
          }
        }
      } catch (err) {
        console.error('Failed loading chats', err)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [user?.id, searchParams])

  useEffect(() => {
    async function loadMessages() {
      if (!selected) {
        setMessages([])
        return
      }

      try {
        const data = await getSocialChatMessages(selected)
        setMessages(
          (data || []).map((m: any) => ({
            from: m.from_type === 'user' ? 'user' : 'other',
            text: m.text,
            time: m.time,
          }))
        )
      } catch (err) {
        console.error('Failed loading messages', err)
        setMessages([])
      }
    }

    loadMessages()
  }, [selected])

  const chat = useMemo(() => chats.find((c) => c.id === selected), [chats, selected])
  const topicId = searchParams.get('topic')
  const activeTopic = topicId
    ? consumerExperience.community.topics.entries.find((topic) => topic.id === topicId)
    : null

  const sendMessage = async () => {
    if (!input.trim() || !selected) return
    const text = input.trim()
    setMessages((prev) => [...prev, { from: 'user', text, time: 'Just now' }])
    setChats((prev) => prev.map((c) => (c.id === selected ? { ...c, last_message: text, last_time: 'Just now', unread: 0 } : c)))
    setInput('')

    try {
      await addSocialChatMessage(selected, 'user', text, 'Just now')
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Loading messages...</div>
  }

  if (selected && chat) {
    const withUser = chat.with_user
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-olu-border flex-shrink-0">
          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/08 transition-colors">
            <ArrowLeft size={18} className="text-olu-muted" />
          </button>
          {withUser?.avatar_img ? (
            <img src={withUser.avatar_img} alt={withUser.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${withUser?.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
              {withUser?.initials || '?'}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{withUser?.name || 'User'}</p>
            <p className="text-olu-muted text-xs">{withUser?.handle || ''}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={clsx('flex gap-3', msg.from === 'user' ? 'flex-row-reverse' : '')}>
              {msg.from !== 'user' && (
                withUser?.avatar_img
                  ? <img src={withUser.avatar_img} alt={withUser.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${withUser?.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>{withUser?.initials || '?'}</div>
              )}
              <div className={clsx('max-w-[80%] flex flex-col gap-1', msg.from === 'user' ? 'items-end' : 'items-start')}>
                <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', msg.from === 'user' ? 'bg-white text-black rounded-tr-sm' : 'glass rounded-tl-sm')}>
                  {msg.text}
                </div>
                <p className="text-olu-muted text-xs px-1">{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-olu-border flex gap-3 flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${withUser?.name || 'user'}...`}
            className="flex-1 px-4 py-2.5 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-olu-border focus:border-white/20 transition-colors"
          />
          <button onClick={sendMessage} className="p-2.5 rounded-xl bg-white text-black hover:opacity-90 transition-opacity">
            <Send size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-black text-2xl mb-4">Messages</h1>
      {activeTopic && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
          <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-2">Topic lobby</p>
          <p className="font-semibold text-sm">{activeTopic.name}</p>
          <p className="text-sm text-olu-muted mt-2">{activeTopic.description}</p>
        </div>
      )}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-olu-muted" />
        <input placeholder="Search messages..." className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-transparent focus:border-white/15 transition-colors" />
      </div>
      <div className="space-y-2">
        {chats.map((chat) => (
          <motion.button key={chat.id} whileHover={{ x: 4 }} onClick={() => setSelected(chat.id)} className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left">
            <div className="relative flex-shrink-0">
              {chat.with_user?.avatar_img
                ? <img src={chat.with_user.avatar_img} alt={chat.with_user.name} className="w-12 h-12 rounded-full object-cover" />
                : <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.with_user?.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-bold text-white`}>{chat.with_user?.initials || '?'}</div>
              }
              {chat.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <span className="text-black text-xs font-bold">{chat.unread}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm">{chat.with_user?.name || 'User'}</span>
                <span className="text-olu-muted text-xs">{chat.last_time || ''}</span>
              </div>
              <p className="text-olu-muted text-xs line-clamp-1">{chat.last_message || ''}</p>
            </div>
          </motion.button>
        ))}
        {chats.length === 0 && <p className="text-olu-muted text-sm">No chats yet.</p>}
      </div>
    </div>
  )
}
