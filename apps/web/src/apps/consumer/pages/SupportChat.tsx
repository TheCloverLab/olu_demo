import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, Headphones } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { ensureSupportChat } from '../../../domain/chat/api'
import ChatRoom from '../../../components/ChatRoom'

export default function SupportChat() {
  const { workspaceSlug } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatId, setChatId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('Support')

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return
      try {
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

        // Ensure support chat exists (unified)
        const chat = await ensureSupportChat(ws.id, userId, staffUserId)
        setChatId(chat.id)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceSlug, user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  const header = (
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
  )

  if (!chatId || !user?.id) {
    return (
      <div className="flex flex-col h-full max-w-3xl mx-auto">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Headphones size={32} className="mx-auto text-[var(--olu-muted)]" />
            <p className="text-sm text-[var(--olu-muted)]">{t('consumer.supportEmpty', 'Send a message to get help')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <ChatRoom
        chatId={chatId}
        scope="support"
        currentUserId={user.id}
        currentUserName={user.name || undefined}
        currentUserAvatar={user.avatar_img ?? undefined}
        headerSlot={header}
        className="flex-1"
      />
    </div>
  )
}
