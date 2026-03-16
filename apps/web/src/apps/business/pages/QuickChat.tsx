import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare, Clock } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listQuickChats, createQuickChat } from '../../../domain/project/api'
import { getMessages, sendMessage, subscribeChatMessages } from '../../../domain/chat/api'
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

  useEffect(() => {
    if (!workspace) return
    loadChats()
  }, [workspace])

  useEffect(() => {
    if (convId && chats.length > 0) {
      const found = chats.find((c) => c.id === convId)
      if (found) selectChat(found)
    }
  }, [convId, chats])

  useEffect(() => {
    if (!activeChat) return
    const unsub = subscribeChatMessages(activeChat.id, (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    return unsub
  }, [activeChat?.id])

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
    if (!activeChat || !currentUser || !input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      await sendMessage(activeChat.id, currentUser.id, 'user', text, {
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar_url || undefined,
      })
    } catch (err) {
      console.error('Failed to send:', err)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat list sidebar */}
      <div className="w-72 border-r border-[var(--olu-border)] bg-[var(--olu-surface)] flex flex-col">
        <div className="p-3 border-b border-[var(--olu-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--olu-text)]">{t('quickChat.title', 'Chat')}</h2>
          <button
            onClick={handleNew}
            className="p-1.5 hover:bg-[var(--olu-bg)] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--olu-text-secondary)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--olu-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && chats.length === 0 && (
            <div className="text-center py-8 text-[var(--olu-text-secondary)] text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t('quickChat.empty', 'No chats yet')}</p>
            </div>
          )}
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`w-full text-left px-3 py-2.5 border-b border-[var(--olu-border)]/50 hover:bg-[var(--olu-bg)] transition-colors ${
                activeChat?.id === chat.id ? 'bg-[var(--olu-bg)]' : ''
              }`}
            >
              <p className="text-sm font-medium text-[var(--olu-text)] truncate">
                {chat.name || 'New Chat'}
              </p>
              {chat.last_message && (
                <p className="text-xs text-[var(--olu-text-secondary)] truncate mt-0.5">
                  {chat.last_message}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageSquare className="w-16 h-16 mx-auto text-[var(--olu-text-secondary)] opacity-30" />
              <p className="text-[var(--olu-text-secondary)]">
                {t('quickChat.selectOrNew', 'Select a chat or start a new one')}
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                {t('quickChat.newChat', 'New Chat')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-[var(--olu-text-secondary)]">
                  <p>{t('quickChat.startTyping', 'Start typing to chat with AI')}</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.sender_type === 'user'
                        ? 'bg-[var(--olu-primary)] text-white rounded-br-sm'
                        : 'bg-[var(--olu-surface)] border border-[var(--olu-border)] text-[var(--olu-text)] rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--olu-border)] p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={t('quickChat.placeholder', 'Ask anything...')}
                  className="flex-1 px-4 py-2 bg-[var(--olu-bg)] border border-[var(--olu-border)] rounded-xl text-[var(--olu-text)] placeholder:text-[var(--olu-text-secondary)]"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2 bg-[var(--olu-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
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
