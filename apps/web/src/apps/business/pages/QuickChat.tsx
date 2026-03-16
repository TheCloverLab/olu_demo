import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare, Send } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listQuickChats, createQuickChat } from '../../../domain/project/api'
import { getChat, getMessages, sendMessage, subscribeChatMessages } from '../../../domain/chat/api'
import type { Chat, ChatMessage } from '../../../domain/chat/types'

export default function QuickChat() {
  const { convId } = useParams<{ convId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { workspace, currentUser } = useApp()

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoCreated = useRef(false)

  useEffect(() => {
    if (!workspace) return
    loadChats()
  }, [workspace])

  // Auto-create a new chat when landing on /business/chat with no convId
  useEffect(() => {
    if (convId || loading || autoCreated.current) return
    if (chats.length === 0) {
      autoCreated.current = true
      handleNew()
    }
  }, [convId, loading, chats.length])

  useEffect(() => {
    if (!convId) return
    const found = chats.find((c) => c.id === convId)
    if (found) {
      selectChat(found)
    } else if (!loading) {
      getChat(convId).then((chat) => {
        if (chat) selectChat(chat)
      }).catch(() => {})
    }
  }, [convId, chats, loading])

  useEffect(() => {
    if (!activeChat) return
    const unsub = subscribeChatMessages(activeChat.id, (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    return unsub
  }, [activeChat?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChats() {
    if (!workspace) return
    setLoading(true)
    try {
      const data = await listQuickChats(workspace.id)
      setChats(data)
    } catch (err) {
      console.error('Failed to load chats:', err)
    } finally {
      setLoading(false)
    }
  }

  async function selectChat(chat: Chat) {
    setActiveChat(chat)
    try {
      const msgs = await getMessages(chat.id)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
    if (chat.id !== convId) {
      navigate(`/business/chat/${chat.id}`, { replace: true })
    }
  }

  async function handleNew() {
    if (!workspace || !currentUser) return
    try {
      const chat = await createQuickChat(workspace.id, currentUser.id)
      setChats((prev) => [chat, ...prev])
      selectChat(chat)
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }

  async function handleSend() {
    if (!currentUser || !input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    try {
      // Auto-create chat if none active
      let chat = activeChat
      if (!chat && workspace) {
        chat = await createQuickChat(workspace.id, currentUser.id)
        setChats((prev) => [chat!, ...prev])
        setActiveChat(chat)
        navigate(`/business/chat/${chat.id}`, { replace: true })
      }
      if (!chat) return

      await sendMessage(chat.id, currentUser.id, 'user', text, {
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar_img ?? undefined,
      })
    } catch (err) {
      console.error('Failed to send:', err)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const isEmpty = !activeChat || messages.length === 0

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat list sidebar */}
      <div className="w-72 border-r border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] flex flex-col">
        <div className="p-3 border-b border-[var(--olu-card-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--olu-text)]">{t('quickChat.title', 'Chat')}</h2>
          <button
            onClick={handleNew}
            className="p-1.5 hover:bg-[var(--olu-accent-bg)] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--olu-muted)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && chats.length === 0 && (
            <div className="text-center py-8 text-[var(--olu-muted)] text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t('quickChat.empty', 'No chats yet')}</p>
            </div>
          )}
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`w-full text-left px-3 py-3 hover:bg-[var(--olu-accent-bg)] transition-colors ${
                activeChat?.id === chat.id ? 'bg-[var(--olu-accent-bg)]' : ''
              }`}
            >
              <p className="text-sm font-medium text-[var(--olu-text)] truncate">
                {chat.name || 'New Chat'}
              </p>
              <p className="text-xs text-[var(--olu-muted)] truncate mt-0.5 h-4">
                {chat.last_message || '\u00A0'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {isEmpty ? (
          /* Empty state: centered input */
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-2xl space-y-4">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-[var(--olu-muted)] opacity-20 mb-3" />
                <p className="text-[var(--olu-muted)] text-sm">
                  {t('quickChat.startTyping', 'Start typing to chat with AI')}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={t('quickChat.placeholder', 'Ask anything...')}
                  className="flex-1 px-4 py-3 bg-[var(--olu-input-bg)] border border-[var(--olu-input-border)] rounded-2xl text-[var(--olu-text)] placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-sky-400/50"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="p-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-sky-600 text-white rounded-br-sm'
                        : 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text)] rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--olu-card-border)] p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={t('quickChat.placeholder', 'Ask anything...')}
                  className="flex-1 px-4 py-2 bg-[var(--olu-input-bg)] border border-[var(--olu-input-border)] rounded-2xl text-[var(--olu-text)] placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-sky-400/50"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  {t('common.send', 'Send')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
