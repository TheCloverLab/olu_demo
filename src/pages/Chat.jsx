import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Send, ArrowLeft } from 'lucide-react'
import { SOCIAL_CHATS } from '../data/mock'
import clsx from 'clsx'

export default function Chat() {
  const [selected, setSelected] = useState(null)
  const [input, setInput] = useState('')
  const [chats, setChats] = useState(SOCIAL_CHATS)

  const chat = chats.find(c => c.id === selected)

  const sendMessage = () => {
    if (!input.trim() || !selected) return
    setChats(prev => prev.map(c => c.id === selected ? {
      ...c,
      lastMessage: input,
      lastTime: 'Just now',
      unread: 0,
      conversation: [...c.conversation, { from: 'user', text: input, time: 'Just now' }]
    } : c))
    setInput('')
  }

  if (selected && chat) {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-olu-border flex-shrink-0">
          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/08 transition-colors">
            <ArrowLeft size={18} className="text-olu-muted" />
          </button>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center font-bold text-white text-xs`}>
            {chat.initials}
          </div>
          <div>
            <p className="font-semibold text-sm">{chat.with}</p>
            <p className="text-olu-muted text-xs">{chat.handle}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {chat.conversation.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={clsx('flex gap-3', msg.from === 'user' ? 'flex-row-reverse' : '')}>
              {msg.from !== 'user' && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
                  {chat.initials}
                </div>
              )}
              <div className={clsx('max-w-[80%] flex flex-col gap-1', msg.from === 'user' ? 'items-end' : 'items-start')}>
                <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', msg.from === 'user' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm' : 'glass rounded-tl-sm')}>
                  {msg.text}
                </div>
                <p className="text-olu-muted text-xs px-1">{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-4 border-t border-olu-border flex gap-3 flex-shrink-0">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${chat.with}...`}
            className="flex-1 px-4 py-2.5 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-olu-border focus:border-violet-500/50 transition-colors" />
          <button onClick={sendMessage} className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity">
            <Send size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-black text-2xl mb-4">Messages</h1>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-olu-muted" />
        <input placeholder="Search messages..." className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-transparent focus:border-violet-500/40 transition-colors" />
      </div>
      <div className="space-y-2">
        {chats.map((chat) => (
          <motion.button key={chat.id} whileHover={{ x: 4 }} onClick={() => setSelected(chat.id)}
            className="w-full flex items-center gap-3 p-4 glass glass-hover rounded-2xl text-left">
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chat.avatarColor} flex items-center justify-center font-bold text-white`}>
                {chat.initials}
              </div>
              {chat.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{chat.unread}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm">{chat.with}</span>
                <span className="text-olu-muted text-xs">{chat.lastTime}</span>
              </div>
              <p className="text-olu-muted text-xs line-clamp-1">{chat.lastMessage}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
