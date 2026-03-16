import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MessageSquare,
  ListTodo,
  FileText,
  Settings,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  GripVertical,
  Flag,
  Upload,
  Download,
  Trash2,
  UserPlus,
  X,
  Users,
} from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getProject,
  listProjectChats,
  getDefaultChat,
  listTasks,
  createTask,
  updateTask,
  listFiles,
  uploadProjectFile,
  getFileDownloadUrl,
  deleteProjectFile,
  listParticipants,
  addParticipant,
  removeParticipant,
  listWorkspaceMembers,
  subscribeProjectTasks,
  streamProjectChatMessage,
} from '../../../domain/project/api'
import { getMessages, sendMessage, subscribeChatMessages } from '../../../domain/chat/api'
import type { Project, ProjectTask, ProjectFile, ProjectParticipant, TaskStatus, TaskPriority } from '../../../domain/project/types'
import type { Chat, ChatMessage } from '../../../domain/chat/types'

type Tab = 'chat' | 'tasks' | 'files' | 'settings'

const TASK_STATUS_ICON = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertTriangle,
} as const

const TASK_STATUS_COLOR = {
  pending: 'text-gray-400',
  in_progress: 'text-blue-500',
  done: 'text-green-500',
  blocked: 'text-red-500',
} as const

const KANBAN_COLUMNS: { key: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { key: 'pending', label: 'Pending', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  { key: 'in_progress', label: 'In Progress', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { key: 'done', label: 'Done', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { key: 'blocked', label: 'Blocked', color: 'text-red-500', bgColor: 'bg-red-500/10' },
]

const PRIORITY_BADGE: Record<TaskPriority, { color: string; label: string }> = {
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', label: 'Urgent' },
  high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', label: 'High' },
  medium: { color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', label: 'Medium' },
  low: { color: 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500', label: 'Low' },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentUser } = useApp()

  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<Tab>('chat')
  const [loading, setLoading] = useState(true)

  // Chat state
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // Task state
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null)

  // File state
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [uploading, setUploading] = useState(false)

  // Team state
  const [participants, setParticipants] = useState<ProjectParticipant[]>([])
  const [wsMembers, setWsMembers] = useState<{ id: string; name: string; avatar_url: string | null; email: string | null }[]>([])
  const [showAddMember, setShowAddMember] = useState(false)

  useEffect(() => {
    if (!id) return
    loadProject()
  }, [id])

  useEffect(() => {
    if (!chat) return
    const unsub = subscribeChatMessages(chat.id, (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    return unsub
  }, [chat?.id])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeProjectTasks(id, () => {
      loadTasks()
    })
    return unsub
  }, [id])

  async function loadProject() {
    if (!id) return
    setLoading(true)
    try {
      const [proj, defaultChat, taskList, fileList, participantList] = await Promise.all([
        getProject(id),
        getDefaultChat(id),
        listTasks(id),
        listFiles(id),
        listParticipants(id),
      ])
      setProject(proj)
      setTasks(taskList)
      setFiles(fileList)
      setParticipants(participantList)
      if (defaultChat) {
        setChat(defaultChat)
        const msgs = await getMessages(defaultChat.id)
        setMessages(msgs)
      }
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks() {
    if (!id) return
    const taskList = await listTasks(id)
    setTasks(taskList)
  }

  async function handleSend() {
    if (!chat || !currentUser || !project || !input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    setIsStreaming(true)
    setStreamingText('')
    try {
      // Save user message to chat
      await sendMessage(chat.id, currentUser.id, 'user', text, {
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar_url || undefined,
      })

      // Stream from Lead Agent
      let fullResponse = ''
      await streamProjectChatMessage(
        project.id,
        project.workspace_id,
        text,
        (event) => {
          if (event.type === 'content') {
            fullResponse += event.text
            setStreamingText(fullResponse)
          } else if (event.type === 'tool') {
            // Show tool usage indicator
            setStreamingText((prev) => prev + `\n*Using ${event.name}...*\n`)
          } else if (event.type === 'done') {
            setIsStreaming(false)
          }
        },
        { sessionId: chat.id }
      )

      // Save full agent response to chat
      if (fullResponse) {
        await sendMessage(chat.id, 'lead-agent', 'agent', fullResponse, {
          senderName: 'Lead Agent',
        })
      }
      setStreamingText('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setInput(text)
      setStreamingText('')
      setIsStreaming(false)
    } finally {
      setSending(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, ProjectTask[]> = {
      pending: [], in_progress: [], done: [], blocked: [],
    }
    tasks.forEach((t) => {
      if (grouped[t.status]) grouped[t.status].push(t)
    })
    return grouped
  }, [tasks])

  async function handleCreateTask() {
    if (!id || !newTaskTitle.trim()) return
    try {
      await createTask(id, newTaskTitle.trim(), {
        description: newTaskDesc.trim() || undefined,
        priority: newTaskPriority,
      })
      setNewTaskTitle('')
      setNewTaskDesc('')
      setNewTaskPriority('medium')
      setShowCreateTask(false)
      await loadTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  async function handleToggleTask(task: ProjectTask) {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      await updateTask(task.id, { status: newStatus })
      await loadTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setDraggedTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggedTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as TaskStatus

    // Check if dropped on a column
    if (['pending', 'in_progress', 'done', 'blocked'].includes(targetStatus)) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== targetStatus) {
        // Optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
        )
        try {
          await updateTask(taskId, { status: targetStatus })
        } catch (err) {
          console.error('Failed to update task status:', err)
          await loadTasks() // revert on error
        }
      }
    } else {
      // Dropped on another task — get that task's status
      const targetTask = tasks.find((t) => t.id === over.id)
      if (targetTask) {
        const task = tasks.find((t) => t.id === taskId)
        if (task && task.status !== targetTask.status) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: targetTask.status } : t))
          )
          try {
            await updateTask(taskId, { status: targetTask.status })
          } catch (err) {
            console.error('Failed to update task status:', err)
            await loadTasks()
          }
        }
      }
    }
  }

  // ── File handlers ──────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || !id || !currentUser) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        await uploadProjectFile(id, file, currentUser.id)
      }
      const updated = await listFiles(id)
      setFiles(updated)
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploading(false)
      e.target.value = '' // reset input
    }
  }

  async function handleFileDownload(file: ProjectFile) {
    try {
      const url = await getFileDownloadUrl(file.file_path)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to get download URL:', err)
    }
  }

  async function handleFileDelete(file: ProjectFile) {
    if (!id) return
    try {
      await deleteProjectFile(file.id, file.file_path)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  // ── Team handlers ──────────────────────────────────

  async function handleShowAddMember() {
    if (!project) return
    setShowAddMember(true)
    if (wsMembers.length === 0) {
      try {
        const members = await listWorkspaceMembers(project.workspace_id)
        setWsMembers(members)
      } catch (err) {
        console.error('Failed to load workspace members:', err)
      }
    }
  }

  async function handleAddMember(userId: string) {
    if (!id || !currentUser) return
    try {
      await addParticipant(id, userId, currentUser.id)
      const updated = await listParticipants(id)
      setParticipants(updated)
      setShowAddMember(false)
    } catch (err) {
      console.error('Failed to add participant:', err)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!id) return
    try {
      await removeParticipant(id, userId)
      setParticipants((prev) => prev.filter((p) => p.user_id !== userId))
    } catch (err) {
      console.error('Failed to remove participant:', err)
    }
  }

  const availableMembers = wsMembers.filter(
    (m) => !participants.some((p) => p.user_id === m.id)
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--olu-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--olu-muted)]">{t('projects.notFound', 'Project not found')}</p>
      </div>
    )
  }

  const tabs: { key: Tab; icon: typeof MessageSquare; label: string; count?: number }[] = [
    { key: 'chat', icon: MessageSquare, label: t('projects.tabs.chat', 'Chat') },
    { key: 'tasks', icon: ListTodo, label: t('projects.tabs.tasks', 'Tasks'), count: tasks.filter((t) => t.status !== 'done').length },
    { key: 'files', icon: FileText, label: t('projects.tabs.files', 'Files'), count: files.length },
    { key: 'settings', icon: Settings, label: t('projects.tabs.settings', 'Settings') },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Project header */}
      <div className="border-b border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/business/projects')}
            className="p-1.5 hover:bg-[var(--olu-accent-bg)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--olu-muted)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[var(--olu-text)] truncate">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-[var(--olu-muted)] truncate">{project.description}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 -mb-[1px]">
          {tabs.map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
                tab === key
                  ? 'border-[var(--olu-primary)] text-[var(--olu-primary)] bg-[var(--olu-accent-bg)]'
                  : 'border-transparent text-[var(--olu-muted)] hover:text-[var(--olu-text)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-[var(--olu-primary)]/10 text-[var(--olu-primary)] rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-[var(--olu-muted)]">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('projects.chatEmpty', 'Start a conversation with AI about this project')}</p>
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
                        : 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text)] rounded-bl-sm'
                    }`}
                  >
                    {msg.sender_name && msg.sender_type !== 'user' && (
                      <p className="text-xs font-medium text-[var(--olu-muted)] mb-1">{msg.sender_name}</p>
                    )}
                    {msg.sender_type === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:rounded-lg [&_code]:text-xs [&_p]:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Streaming response */}
              {isStreaming && streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text)] rounded-bl-sm">
                    <p className="text-xs font-medium text-[var(--olu-muted)] mb-1">Lead Agent</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:rounded-lg [&_code]:text-xs [&_p]:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
              {/* Typing indicator */}
              {sending && !streamingText && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[var(--olu-muted)] rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-[var(--olu-muted)] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-[var(--olu-muted)] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--olu-card-border)] p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={t('projects.chatPlaceholder', 'Type a message...')}
                  className="flex-1 px-4 py-2 bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)] rounded-2xl text-[var(--olu-text)] placeholder:text-[var(--olu-muted)]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2 bg-[var(--olu-primary)] text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {t('common.send', 'Send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="px-4 md:px-6 py-4 space-y-4 overflow-y-auto h-full">
            {/* Add task bar */}
            <div className="flex items-center gap-2">
              {!showCreateTask ? (
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('projects.addTask', 'Add Task')}
                </button>
              ) : (
                <div className="w-full bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-xl p-4 space-y-3">
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newTaskTitle.trim() && handleCreateTask()}
                    placeholder={t('projects.taskTitlePlaceholder', 'Task title...')}
                    className="w-full px-3 py-2 bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)] rounded-lg text-sm text-[var(--olu-text)] placeholder:text-[var(--olu-muted)]"
                    autoFocus
                  />
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder={t('projects.taskDescPlaceholder', 'Description (optional)...')}
                    rows={2}
                    className="w-full px-3 py-2 bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)] rounded-lg text-sm text-[var(--olu-text)] placeholder:text-[var(--olu-muted)] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5 text-[var(--olu-muted)]" />
                      {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setNewTaskPriority(p)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            newTaskPriority === p
                              ? PRIORITY_BADGE[p].color
                              : 'text-[var(--olu-muted)] hover:bg-[var(--olu-accent-bg)]'
                          }`}
                        >
                          {PRIORITY_BADGE[p].label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowCreateTask(false); setNewTaskTitle(''); setNewTaskDesc('') }}
                        className="px-3 py-1.5 text-xs text-[var(--olu-muted)] hover:text-[var(--olu-text)]"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                      <button
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle.trim()}
                        className="px-3 py-1.5 text-xs bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {t('common.create', 'Create')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kanban Board */}
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-[var(--olu-muted)]">
                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('projects.noTasks', 'No tasks yet. AI will create tasks as you chat.')}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {KANBAN_COLUMNS.map((col) => (
                    <KanbanColumn
                      key={col.key}
                      column={col}
                      tasks={tasksByStatus[col.key]}
                      onToggle={handleToggleTask}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {draggedTask && <TaskCard task={draggedTask} isDragging />}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        )}

        {tab === 'files' && (
          <div className="px-4 md:px-6 py-4 space-y-4 overflow-y-auto h-full">
            {/* Upload button */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? t('common.uploading', 'Uploading...') : t('projects.uploadFile', 'Upload File')}
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12 text-[var(--olu-muted)]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('projects.noFiles', 'No files yet. AI will add deliverables here.')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-lg group"
                  >
                    <FileText className="w-5 h-5 text-[var(--olu-muted)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--olu-text)] truncate">{file.name}</p>
                      <p className="text-xs text-[var(--olu-muted)]">
                        {file.size_bytes ? formatFileSize(file.size_bytes) : ''} · {file.created_by || 'unknown'} · {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="p-1.5 hover:bg-[var(--olu-accent-bg)] rounded-lg transition-colors"
                        title={t('common.download', 'Download')}
                      >
                        <Download className="w-4 h-4 text-[var(--olu-muted)]" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="px-4 md:px-6 py-4 space-y-4 overflow-y-auto h-full">
            {/* General info */}
            <div className="bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-2xl p-4 space-y-3">
              <h3 className="font-medium text-[var(--olu-text)]">{t('projects.config.general', 'General')}</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-[var(--olu-muted)]">{t('projects.config.runtime', 'Runtime')}</label>
                  <p className="text-sm text-[var(--olu-text)] capitalize">{project.runtime_type}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--olu-muted)]">{t('projects.config.status', 'Status')}</label>
                  <p className="text-sm text-[var(--olu-text)] capitalize">{project.status}</p>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[var(--olu-text)]">
                  <Users className="w-4 h-4 inline mr-1.5" />
                  {t('projects.team', 'Team')} ({participants.length})
                </h3>
                <button
                  onClick={handleShowAddMember}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t('projects.addMember', 'Add')}
                </button>
              </div>

              {/* Add member dropdown */}
              {showAddMember && (
                <div className="border border-[var(--olu-card-border)] rounded-lg p-3 bg-[var(--olu-accent-bg)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[var(--olu-muted)]">{t('projects.selectMember', 'Select workspace member')}</p>
                    <button onClick={() => setShowAddMember(false)} className="p-1 text-[var(--olu-muted)]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {availableMembers.length === 0 ? (
                    <p className="text-xs text-[var(--olu-muted)]">{t('projects.noMembers', 'All workspace members are already in this project')}</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {availableMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleAddMember(member.id)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors text-left"
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[var(--olu-primary)]/20 flex items-center justify-center text-xs text-[var(--olu-primary)]">
                              {member.name?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-[var(--olu-text)]">{member.name}</p>
                            {member.email && <p className="text-[10px] text-[var(--olu-muted)]">{member.email}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Participant list */}
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg">
                    {p.user?.avatar_url ? (
                      <img src={p.user.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--olu-primary)]/20 flex items-center justify-center text-sm text-[var(--olu-primary)]">
                        {p.user?.name?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--olu-text)]">{p.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-[var(--olu-muted)] capitalize">{p.role}</p>
                    </div>
                    {p.role !== 'owner' && project.owner_id === currentUser?.id && (
                      <button
                        onClick={() => handleRemoveMember(p.user_id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title={t('common.remove', 'Remove')}
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kanban Column ────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onToggle,
}: {
  column: (typeof KANBAN_COLUMNS)[number]
  tasks: ProjectTask[]
  onToggle: (task: ProjectTask) => void
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.key,
    data: { type: 'column', status: column.key },
  })

  const StatusIcon = TASK_STATUS_ICON[column.key]

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition-colors min-h-[200px] ${
        isOver
          ? 'border-[var(--olu-primary)] bg-[var(--olu-primary)]/5'
          : 'border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]/50'
      }`}
    >
      <div className="px-3 py-2 border-b border-[var(--olu-card-border)]">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-3.5 h-3.5 ${column.color}`} />
          <span className="text-xs font-medium text-[var(--olu-text)]">{column.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${column.bgColor} ${column.color}`}>
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onToggle={onToggle} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

// ── Sortable Task Card (wrapped) ─────────────────────────────

function SortableTaskCard({
  task,
  onToggle,
}: {
  task: ProjectTask
  onToggle: (task: ProjectTask) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard task={task} onToggle={onToggle} dragListeners={listeners} />
    </div>
  )
}

// ── Task Card ────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
  isDragging,
  dragListeners,
}: {
  task: ProjectTask
  onToggle?: (task: ProjectTask) => void
  isDragging?: boolean
  dragListeners?: Record<string, unknown>
}) {
  return (
    <div
      className={`bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-lg p-2.5 text-left transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-[var(--olu-primary)]' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-[var(--olu-muted)] hover:text-[var(--olu-text)]"
          {...dragListeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onToggle?.(task)}
            className={`text-xs font-medium text-left w-full ${
              task.status === 'done' ? 'line-through text-[var(--olu-muted)]' : 'text-[var(--olu-text)]'
            }`}
          >
            {task.title}
          </button>
          {task.description && (
            <p className="text-[10px] text-[var(--olu-muted)] mt-0.5 line-clamp-2">{task.description}</p>
          )}
          {task.priority !== 'medium' && (
            <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[task.priority].color}`}>
              {PRIORITY_BADGE[task.priority].label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
