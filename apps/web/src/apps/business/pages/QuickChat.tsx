import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare, Send, Archive, ArchiveRestore, Pencil, Check, X } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listQuickChats, createQuickChat } from '../../../domain/project/api'
import { getChat, sendMessage, streamQuickChat, updateChatName, archiveChat, unarchiveChat } from '../../../domain/chat/api'
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
  const [showArchived, setShowArchived] = useState(false)

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null)

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

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId) renameRef.current?.focus()
  }, [renamingId])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

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

  const activeChats = chats.filter((c) => !c.is_archived)
  const archivedChats = chats.filter((c) => c.is_archived)

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
      const chatName = message.length > 40 ? message.slice(0, 40) + '…' : message
      const chat = await createQuickChat(workspace.id, currentUser.id, chatName)
      setChats((prev) => [chat, ...prev])
      setActiveChat(chat)
      navigate(`/business/chat/${chat.id}`, { replace: true })

      const sent = await sendMessage(chat.id, currentUser.id, 'user', message, {
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar_img ?? undefined,
      })

      handleAfterSend(chat.id, message, sent)
    } catch (err) {
      console.error('Failed to create chat:', err)
    } finally {
      setCreating(false)
    }
  }

  async function handleRename(chatId: string) {
    const name = renameValue.trim()
    if (!name) { setRenamingId(null); return }
    try {
      await updateChatName(chatId, name)
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, name } : c))
    } catch (err) {
      console.error('Failed to rename:', err)
    }
    setRenamingId(null)
  }

  async function handleArchive(chatId: string) {
    try {
      await archiveChat(chatId)
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, is_archived: true } : c))
      if (activeChat?.id === chatId) setActiveChat(null)
    } catch (err) {
      console.error('Failed to archive:', err)
    }
  }

  async function handleUnarchive(chatId: string) {
    try {
      await unarchiveChat(chatId)
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, is_archived: false } : c))
    } catch (err) {
      console.error('Failed to unarchive:', err)
    }
  }

  const handleAfterSend = useCallback((
    chatId: string,
    message: string,
    _sentMsg: ChatMessage,
    opts?: { model?: string; provider?: string; reasoning?: boolean },
  ): (() => void) | void => {
    if (!workspace) return

    // Rename "New Chat" to first message
    const chat = chats.find((c) => c.id === chatId)
    if (chat?.name === 'New Chat') {
      const newName = message.length > 40 ? message.slice(0, 40) + '…' : message
      updateChatName(chatId, newName).then(() => {
        setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, name: newName } : c))
      }).catch(() => {})
    }

    const controller = new AbortController()

    ;(async () => {
      try {
        let aiContent = ''
        let aiReasoning = ''
        await streamQuickChat(workspace.id, message, (event) => {
          if (event.type === 'content') {
            aiContent += event.text
          } else if (event.type === 'reasoning') {
            aiReasoning += event.text
          }
        }, { sessionId: chatId, model: opts?.model, provider: opts?.provider, signal: controller.signal })

        if (aiContent) {
          await sendMessage(chatId, 'ai-assistant', 'agent', aiContent, {
            senderName: 'AI Assistant',
            messageType: 'text',
            metadata: aiReasoning ? { reasoning: aiReasoning } : undefined,
          })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('AI reply failed:', err)
      }
    })()

    return () => controller.abort()
  }, [workspace, chats])

  function renderChatItem(chat: Chat, isArchived = false) {
    if (renamingId === chat.id) {
      return (
        <div key={chat.id} className="flex items-center gap-1 px-3 py-2">
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(chat.id)
              if (e.key === 'Escape') setRenamingId(null)
            }}
            className="flex-1 px-2 py-1 text-sm bg-[var(--olu-input-bg)] border border-[var(--olu-input-border)] rounded-lg text-[var(--olu-text)] focus:outline-none focus:border-sky-400"
          />
          <button onClick={() => handleRename(chat.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setRenamingId(null)} className="p-1 text-[var(--olu-muted)] hover:bg-[var(--olu-accent-bg)] rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }

    return (
      <button
        key={chat.id}
        onClick={() => !isArchived && selectChat(chat)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ chatId: chat.id, x: e.clientX, y: e.clientY })
        }}
        className={`w-full text-left px-3 py-3 hover:bg-[var(--olu-accent-bg)] transition-colors group ${
          activeChat?.id === chat.id ? 'bg-[var(--olu-accent-bg)]' : ''
        } ${isArchived ? 'opacity-60' : ''}`}
      >
        <p className="text-sm font-medium text-[var(--olu-text)] truncate">
          {chat.name || 'New Chat'}
        </p>
        <p className="text-xs text-[var(--olu-muted)] truncate mt-0.5 h-4">
          {chat.last_message || '\u00A0'}
        </p>
      </button>
    )
  }

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
          {!loading && activeChats.length === 0 && !showArchived && (
            <div className="text-center py-8 text-[var(--olu-muted)] text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t('quickChat.empty', 'No chats yet')}</p>
            </div>
          )}
          {activeChats.map((chat) => renderChatItem(chat))}

          {/* Archived section */}
          {archivedChats.length > 0 && (
            <>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--olu-muted)] hover:text-[var(--olu-text)] hover:bg-[var(--olu-accent-bg)] transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                {t('quickChat.archived', 'Archived')} ({archivedChats.length})
              </button>
              {showArchived && archivedChats.map((chat) => renderChatItem(chat, true))}
            </>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const chat = chats.find((c) => c.id === contextMenu.chatId)
              setRenameValue(chat?.name || '')
              setRenamingId(contextMenu.chatId)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--olu-text)] hover:bg-[var(--olu-accent-bg)] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('common.rename', 'Rename')}
          </button>
          {chats.find((c) => c.id === contextMenu.chatId)?.is_archived ? (
            <button
              onClick={() => { handleUnarchive(contextMenu.chatId); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--olu-text)] hover:bg-[var(--olu-accent-bg)] transition-colors"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              {t('common.unarchive', 'Unarchive')}
            </button>
          ) : (
            <button
              onClick={() => { handleArchive(contextMenu.chatId); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--olu-text)] hover:bg-[var(--olu-accent-bg)] transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              {t('common.archive', 'Archive')}
            </button>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
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
        ) : activeChat.is_archived ? (
          <div className="flex-1 flex flex-col">
            <ChatRoom
              chatId={activeChat.id}
              scope="quick"
              currentUserId={currentUser?.id || ''}
              className="flex-1"
            />
            <div className="border-t border-[var(--olu-card-border)] px-4 py-3 text-center">
              <p className="text-sm text-[var(--olu-muted)] mb-2">{t('quickChat.archivedHint', 'This chat is archived.')}</p>
              <button
                onClick={() => handleUnarchive(activeChat.id)}
                className="px-4 py-1.5 text-sm text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
              >
                <ArchiveRestore className="w-4 h-4 inline mr-1" />
                {t('common.unarchive', 'Unarchive')}
              </button>
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
