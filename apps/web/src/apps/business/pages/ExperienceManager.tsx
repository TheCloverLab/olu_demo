import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, MessageSquare, BookOpen, Users, ChevronRight, ExternalLink, Play } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import type { WorkspaceExperience, ExperienceType } from '../../../lib/supabase'
import { listExperiences, createExperience } from '../../../domain/experience/api'

const TYPE_META: Record<ExperienceType, { label: string; icon: typeof MessageSquare; color: string; bg: string }> = {
  forum: { label: 'Forum', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-400/10' },
  course: { label: 'Course', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-400/10' },
  group_chat: { label: 'Group Chat', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/10' },
  video: { label: 'Video', icon: Play, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-400/10' },
}

const CREATABLE_TYPES: { type: ExperienceType; description: string }[] = [
  { type: 'forum', description: 'Discussion forum with posts and comments' },
  { type: 'course', description: 'Structured lessons with chapters' },
  { type: 'group_chat', description: 'Real-time group messaging room' },
  { type: 'video', description: 'Video gallery with YouTube links' },
]

function CreatePanel({ onCreated, onClose, workspaceId }: { onCreated: () => void; onClose: () => void; workspaceId: string }) {
  const [selectedType, setSelectedType] = useState<ExperienceType | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!selectedType || !name.trim()) return
    setSaving(true)
    try {
      await createExperience(workspaceId, selectedType, name.trim())
      onCreated()
    } catch (err) {
      console.error('Failed to create experience', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Add Experience</h3>
        <button onClick={onClose} className="text-xs text-[var(--olu-muted)] hover:text-[var(--olu-text)]">Cancel</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {CREATABLE_TYPES.map(({ type, description }) => {
          const meta = TYPE_META[type]
          const Icon = meta.icon
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={clsx(
                'p-3 rounded-xl text-left transition-colors border',
                selectedType === type
                  ? 'border-[var(--olu-card-border)] bg-[var(--olu-accent-bg)]'
                  : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)]'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={meta.color} />
                <span className="font-semibold text-sm">{meta.label}</span>
              </div>
              <p className="text-xs text-[var(--olu-text-secondary)]">{description}</p>
            </button>
          )
        })}
      </div>

      {selectedType && (
        <div className="space-y-3 pt-2 border-t border-[var(--olu-card-border)]">
          <div>
            <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${TYPE_META[selectedType].label}`}
              className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--olu-card-border)]"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create {TYPE_META[selectedType].label}
          </button>
        </div>
      )}
    </div>
  )
}

function ExperienceCard({ exp }: { exp: WorkspaceExperience }) {
  const navigate = useNavigate()
  const meta = TYPE_META[exp.type]
  const Icon = meta.icon

  const editorPath = exp.type === 'forum' ? `/business/experiences/forum?id=${exp.id}`
    : exp.type === 'course' ? `/business/experiences/courses?id=${exp.id}`
    : `/business/experiences/edit?id=${exp.id}`

  const consumerPath = exp.type === 'forum' ? `/forum/${exp.id}`
    : exp.type === 'course' ? `/course/${exp.id}`
    : exp.type === 'group_chat' ? `/group-chat/${exp.id}`
    : exp.type === 'video' ? `/video/${exp.id}`
    : null

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden hover:border-[var(--olu-card-border)] transition-colors">
      <div
        className="cursor-pointer"
        onClick={() => navigate(editorPath)}
      >
        {exp.cover ? (
          <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${exp.cover})` }} />
        ) : (
          <div className={clsx('h-20 bg-gradient-to-br flex items-center justify-center', TYPE_META[exp.type]?.bg || 'bg-gray-100 dark:bg-gray-800')}>
            <Icon size={24} className={meta.color} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
                <Icon size={16} className={meta.color} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{exp.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[var(--olu-muted)] text-xs">{meta.label}</span>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    exp.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400'
                  )}>
                    {exp.status === 'active' ? 'published' : exp.status}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-[var(--olu-muted)] flex-shrink-0 mt-2" />
          </div>
        </div>
      </div>
      {consumerPath && (
        <div className="px-4 pb-3 -mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(consumerPath, '_blank') }}
            className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)] hover:text-cyan-500 transition-colors"
          >
            <ExternalLink size={12} />
            View as consumer
          </button>
        </div>
      )}
    </div>
  )
}

export default function ExperienceManager() {
  const { t } = useTranslation()
  const { workspace } = useApp()
  const [experiences, setExperiences] = useState<WorkspaceExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const workspaceId = workspace?.id

  function reload() {
    if (!workspaceId) return
    setLoading(true)
    listExperiences(workspaceId)
      .then(setExperiences)
      .catch(() => setExperiences([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs tracking-wider mb-2">{t('nav.workspace')}</p>
          <h1 className="font-black text-2xl">{t('nav.experiences', 'Experiences')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {experiences.length} experience{experiences.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {showCreate && workspaceId && (
        <CreatePanel
          workspaceId={workspaceId}
          onCreated={() => { setShowCreate(false); reload() }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {experiences.length === 0 ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center space-y-3">
          <MessageSquare size={32} className="text-[var(--olu-muted)] mx-auto" />
          <p className="text-[var(--olu-text-secondary)] text-sm">No experiences yet.</p>
          <p className="text-[var(--olu-muted)] text-xs">Add a Forum, Course, or Group Chat to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.id} exp={exp} />
          ))}
        </div>
      )}
    </div>
  )
}
