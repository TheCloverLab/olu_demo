import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare, Send } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listQuickChats, createQuickChat } from '../../../domain/project/api'
import { getChat, sendMessage, streamQuickChat } from '../../../domain/chat/api'
import type { Chat, ChatMessage } from '../../../domain/chat/types'
import ChatRoom from '../../../components/ChatRoom'

export default function QuickChat() {
  const { convId } = useParams<{ convId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { workspace, currentUser } = useApp()

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspace) return
    loadChats()
  }, [workspace])

  useEffect(() => {
    if (!convId) return
    const found = chats.find((c) => c.id === convId)
    if (found) {
      setActiveChat(found)
    } else if (!loading) {
      getChat(convId).then((chat) => {
        if (chat) setActiveChat(chat)
      }).catch(() => {})
    }
  }, [convId, chats, loading])

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

  function selectChat(chat: Chat) {
    setActiveChat(chat)
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

  async function handleFirstSend() {
    if (!currentUser || !workspace || !input.trim() || creating) return
    const message = input.trim()
    setCreating(true)
    setInput('')
    try {
      const chat = await createQuickChat(workspace.id, currentUser.id)
      setChats((prev) => [chat, ...prev])
      setActiveChat(chat)
      navigate(`/business/chat/${chat.id}`, { replace: true })

      // Send the initial message
      const sent = await sendMessage(chat.id, currentUser.id, 'user', message, {
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar_img ?? undefined,
      })

      // Trigger AI reply
      handleAfterSend(chat.id, message, sent)
    } catch (err) {
      console.error('Failed to create chat:', err)
    } finally {
      setCreating(false)
    }
  }

  // Trigger AI reply after user sends a message
  const handleAfterSend = useCallback(async (
    chatId: string,
    message: string,
    _sentMsg: ChatMessage,
    opts?: { model?: string; provider?: string; reasoning?: boolean },
  ) => {
    if (!workspace) return
    try {
      let aiContent = ''
      let aiReasoning = ''
      await streamQuickChat(workspace.id, message, (event) => {
        if (event.type === 'content') {
          aiContent += event.text
        } else if (event.type === 'reasoning') {
          aiReasoning += event.text
        }
      }, { sessionId: chatId, model: opts?.model, provider: opts?.provider })

      // Save AI reply to DB (realtime subscription will show it in ChatRoom)
      if (aiContent) {
        await sendMessage(chatId, 'ai-assistant', 'agent', aiContent, {
          senderName: 'AI Assistant',
          messageType: 'text',
          metadata: aiReasoning ? { reasoning: aiReasoning } : undefined,
        })
      }
    } catch (err) {
      console.error('AI reply failed:', err)
    }
  }, [workspace])

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
        {!activeChat ? (
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
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleFirstSend()}
                  placeholder={t('quickChat.placeholder', 'Ask anything...')}
                  className="flex-1 px-4 py-3 bg-[var(--olu-input-bg)] border border-[var(--olu-input-border)] rounded-2xl text-[var(--olu-text)] placeholder:text-[var(--olu-muted)] focus:outline-none focus:border-sky-400/50"
                  autoFocus
                />
                <button
                  onClick={handleFirstSend}
                  disabled={!input.trim() || creating}
                  className="p-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : currentUser ? (
          <ChatRoom
            chatId={activeChat.id}
            scope="quick"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserAvatar={currentUser.avatar_img ?? undefined}
            onAfterSend={handleAfterSend}
            className="flex-1"
          />
        ) : null}
      </div>
    </div>
  )
}
