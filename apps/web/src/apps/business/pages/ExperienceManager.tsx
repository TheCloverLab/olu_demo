import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2, MessageSquare, BookOpen, Users, Headphones, Eye, EyeOff, Lock, GripVertical } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import type { WorkspaceExperience, ExperienceType, ExperienceVisibility } from '../../../lib/supabase'
import { listExperiences, createExperience, updateExperience, deleteExperience } from '../../../domain/experience/api'

const TYPE_META: Record<ExperienceType, { label: string; icon: typeof MessageSquare; color: string; bg: string }> = {
  forum: { label: 'Forum', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-400/10' },
  course: { label: 'Course', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-400/10' },
  group_chat: { label: 'Group Chat', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/10' },
  support_chat: { label: 'Support Chat', icon: Headphones, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-400/10' },
}

const VISIBILITY_META: Record<ExperienceVisibility, { label: string; icon: typeof Eye }> = {
  public: { label: 'Public', icon: Eye },
  members_only: { label: 'Members only', icon: Lock },
  product_gated: { label: 'Product gated', icon: EyeOff },
}

const CREATABLE_TYPES: { type: ExperienceType; description: string }[] = [
  { type: 'forum', description: 'Discussion forum with posts and comments' },
  { type: 'course', description: 'Structured lessons with chapters' },
  { type: 'group_chat', description: 'Real-time group messaging room' },
]

function CreatePanel({ onCreated, onClose, workspaceId }: { onCreated: () => void; onClose: () => void; workspaceId: string }) {
  const [selectedType, setSelectedType] = useState<ExperienceType | null>(null)
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<ExperienceVisibility>('public')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!selectedType || !name.trim()) return
    setSaving(true)
    try {
      const exp = await createExperience(workspaceId, selectedType, name.trim())
      if (visibility !== 'public') {
        await updateExperience(exp.id, { visibility })
      }
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
                  ? 'border-cyan-300/40 bg-cyan-300/10'
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
              className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Visibility</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(VISIBILITY_META) as ExperienceVisibility[]).map((v) => {
                const meta = VISIBILITY_META[v]
                const VIcon = meta.icon
                return (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5',
                      visibility === v
                        ? 'bg-cyan-300 text-[#04111f]'
                        : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]'
                    )}
                  >
                    <VIcon size={12} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
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

function ExperienceCard({
  exp,
  onUpdated,
}: {
  exp: WorkspaceExperience
  onUpdated: () => void
}) {
  const meta = TYPE_META[exp.type]
  const visMeta = VISIBILITY_META[exp.visibility]
  const Icon = meta.icon
  const VIcon = visMeta.icon
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exp.name)
  const [visibility, setVisibility] = useState(exp.visibility)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateExperience(exp.id, { name, visibility })
      setEditing(false)
      onUpdated()
    } catch (err) {
      console.error('Failed to update', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Archive this experience?')) return
    try {
      await deleteExperience(exp.id)
      onUpdated()
    } catch (err) {
      console.error('Failed to delete', err)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      {exp.cover && (
        <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${exp.cover})` }} />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical size={14} className="text-[var(--olu-muted)] flex-shrink-0 cursor-grab" />
            <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
              <Icon size={16} className={meta.color} />
            </div>
            <div className="min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-cyan-500/30"
                />
              ) : (
                <h3 className="font-semibold text-sm truncate">{exp.name}</h3>
              )}
              <p className="text-[var(--olu-muted)] text-xs">{meta.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors">
              <Pencil size={12} className="text-[var(--olu-text-secondary)]" />
            </button>
            {exp.type !== 'support_chat' && (
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} className="text-[var(--olu-muted)]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full flex items-center gap-1', meta.bg, meta.color)}>
            <Icon size={10} /> {meta.label}
          </span>
          <span className="text-xs text-[var(--olu-muted)] flex items-center gap-1">
            <VIcon size={10} /> {visMeta.label}
          </span>
        </div>

        {editing && (
          <div className="space-y-2 pt-2 border-t border-[var(--olu-card-border)]">
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Visibility</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(VISIBILITY_META) as ExperienceVisibility[]).map((v) => {
                  const vm = VISIBILITY_META[v]
                  const VI = vm.icon
                  return (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                        visibility === v
                          ? 'bg-cyan-300 text-[#04111f]'
                          : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)]'
                      )}
                    >
                      <VI size={10} /> {vm.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-1.5 rounded-xl bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setName(exp.name); setVisibility(exp.visibility) }}
                className="px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
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
            <ExperienceCard key={exp.id} exp={exp} onUpdated={reload} />
          ))}
        </div>
      )}
    </div>
  )
}
