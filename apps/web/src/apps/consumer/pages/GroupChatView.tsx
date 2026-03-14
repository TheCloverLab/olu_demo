import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import type { WorkspaceExperience } from '../../../lib/supabase'
import { getExperience } from '../../../domain/experience/api'
import { getChatByExperience, joinChat } from '../../../domain/chat/api'
import ChatRoom from '../../../components/ChatRoom'

export default function GroupChatView() {
  const { experienceId } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!experienceId || !user?.id) return
      try {
        const exp = await getExperience(experienceId)
        setExperience(exp)

        // Find or auto-join the unified chat for this experience
        const chat = await getChatByExperience(experienceId)
        if (chat) {
          setChatId(chat.id)
          // Ensure user is a member
          await joinChat(chat.id, user.id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [experienceId, user?.id])

  if (loading || !user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--olu-muted)]">Chat not available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <ChatRoom
        chatId={chatId}
        scope="experience"
        currentUserId={user.id}
        currentUserName={user.name || 'Anonymous'}
        currentUserAvatar={user.avatar_img ?? undefined}
        headerSlot={
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
              <h1 className="font-semibold text-sm truncate">{experience?.name || t('consumer.groupChat', 'Group Chat')}</h1>
            </div>
          </div>
        }
        className="h-full"
      />
    </div>
  )
}
