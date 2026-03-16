import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { getChat } from '../../../domain/chat/api'
import type { Chat } from '../../../domain/chat/types'
import ChatRoom from '../../../components/ChatRoom'

export default function GroupChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatId) return
    setLoading(true)
    getChat(chatId)
      .then((c) => setChat(c))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!chat || !currentUser || !chatId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-[var(--olu-muted)]">Chat not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
        <button
          onClick={() => navigate('/business/team')}
          className="p-1.5 hover:bg-[var(--olu-accent-bg)] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--olu-muted)]" />
        </button>
        <Users className="w-5 h-5 text-[var(--olu-muted)]" />
        <h2 className="font-semibold text-[var(--olu-text)] truncate">{chat.name || 'Group Chat'}</h2>
      </div>

      {/* Chat */}
      <ChatRoom
        chatId={chatId}
        scope="team"
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
        currentUserAvatar={currentUser.avatar_img ?? undefined}
        className="flex-1"
      />
    </div>
  )
}
