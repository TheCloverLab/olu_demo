import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Save, Trash2, GripVertical, ImagePlus, LayoutGrid, List, Rows3, Star } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import type { WorkspaceExperience, WorkspaceHomeTab, WorkspaceHomeConfig } from '../../../lib/supabase'
import { listExperiences } from '../../../domain/experience/api'
import { getHomeConfig, upsertHomeConfig } from '../../../domain/product/api'

const DISPLAY_MODES: { value: WorkspaceHomeTab['display_mode']; icon: typeof List; label: string }[] = [
  { value: 'list', icon: List, label: 'List' },
  { value: 'tile', icon: LayoutGrid, label: 'Tile' },
  { value: 'grid', icon: Rows3, label: 'Grid' },
  { value: 'featured', icon: Star, label: 'Featured' },
]

type TemplateKey = 'magazine' | 'storefront' | 'minimal' | 'community'

const TEMPLATES: { key: TemplateKey; label: string; description: string; icon: string; defaultTabs: (exps: WorkspaceExperience[]) => Omit<WorkspaceHomeTab, 'position'>[] }[] = [
  {
    key: 'magazine',
    label: 'Magazine',
    description: 'Featured hero + content grid. Great for courses & content-heavy workspaces.',
    icon: '📰',
    defaultTabs: (exps) => {
      const courses = exps.filter((e) => e.type === 'course').map((e) => e.id)
      const forums = exps.filter((e) => e.type === 'forum').map((e) => e.id)
      return [
        { key: 'featured', label: 'Featured', display_mode: 'featured' as const, experience_ids: courses.slice(0, 2) },
        { key: 'community', label: 'Community', display_mode: 'list' as const, experience_ids: forums },
      ]
    },
  },
  {
    key: 'storefront',
    label: 'Storefront',
    description: 'Product tiles front and center. Best for selling courses & memberships.',
    icon: '🏪',
    defaultTabs: (exps) => {
      const paid = exps.filter((e) => e.visibility === 'product_gated').map((e) => e.id)
      const free = exps.filter((e) => e.visibility === 'public' && e.type !== 'support_chat').map((e) => e.id)
      return [
        { key: 'premium', label: 'Premium', display_mode: 'tile' as const, experience_ids: paid },
        { key: 'free', label: 'Free', display_mode: 'grid' as const, experience_ids: free },
      ]
    },
  },
  {
    key: 'minimal',
    label: 'Minimal',
    description: 'Clean single-column list. Lets content speak for itself.',
    icon: '✨',
    defaultTabs: (exps) => {
      const all = exps.filter((e) => e.type !== 'support_chat').map((e) => e.id)
      return [
        { key: 'all', label: 'All', display_mode: 'list' as const, experience_ids: all },
      ]
    },
  },
  {
    key: 'community',
    label: 'Community Hub',
    description: 'Forums & chats highlighted. Perfect for community-driven workspaces.',
    icon: '💬',
    defaultTabs: (exps) => {
      const forums = exps.filter((e) => e.type === 'forum').map((e) => e.id)
      const chats = exps.filter((e) => e.type === 'group_chat').map((e) => e.id)
      const courses = exps.filter((e) => e.type === 'course').map((e) => e.id)
      return [
        { key: 'discussions', label: 'Discussions', display_mode: 'list' as const, experience_ids: forums },
        { key: 'rooms', label: 'Chat Rooms', display_mode: 'tile' as const, experience_ids: chats },
        ...(courses.length > 0 ? [{ key: 'learn', label: 'Learn', display_mode: 'grid' as const, experience_ids: courses }] : []),
      ]
    },
  },
]

function TabEditor({
  tab,
  allExperiences,
  onChange,
  onDelete,
}: {
  tab: WorkspaceHomeTab
  allExperiences: WorkspaceExperience[]
  onChange: (updated: WorkspaceHomeTab) => void
  onDelete: () => void
}) {
  const linkedExps = allExperiences.filter((e) => tab.experience_ids.includes(e.id))
  const unlinkedExps = allExperiences.filter((e) => !tab.experience_ids.includes(e.id) && e.type !== 'support_chat')

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="text-[var(--olu-muted)] cursor-grab flex-shrink-0" />
        <input
          type="text"
          value={tab.label}
          onChange={(e) => onChange({ ...tab, label: e.target.value })}
          className="flex-1 bg-transparent border-b border-[var(--olu-card-border)] px-1 py-0.5 text-sm font-semibold focus:outline-none focus:border-cyan-500/30"
        />
        <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-500/10">
          <Trash2 size={12} className="text-[var(--olu-muted)]" />
        </button>
      </div>

      {/* Display mode */}
      <div>
        <p className="text-[10px] text-[var(--olu-muted)] mb-1">Display mode</p>
        <div className="flex gap-1.5">
          {DISPLAY_MODES.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...tab, display_mode: value })}
              className={clsx(
                'px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors',
                tab.display_mode === value
                  ? 'bg-cyan-300 text-[#04111f]'
                  : 'bg-[var(--olu-section-bg)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]'
              )}
            >
              <Icon size={10} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Experiences in tab */}
      <div>
        <p className="text-[10px] text-[var(--olu-muted)] mb-1">Experiences</p>
        <div className="flex flex-wrap gap-1">
          {linkedExps.map((exp) => (
            <span key={exp.id} className="text-xs px-2 py-0.5 rounded-full bg-cyan-300/10 text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
              {exp.name}
              <button
                onClick={() => onChange({ ...tab, experience_ids: tab.experience_ids.filter((id) => id !== exp.id) })}
                className="hover:text-red-400"
              >
                &times;
              </button>
            </span>
          ))}
          {unlinkedExps.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onChange({ ...tab, experience_ids: [...tab.experience_ids, e.target.value] })
                }
              }}
              className="text-xs bg-[var(--olu-section-bg)] border border-dashed border-[var(--olu-card-border)] rounded-full px-2 py-0.5"
            >
              <option value="">+ Add...</option>
              {unlinkedExps.map((exp) => (
                <option key={exp.id} value={exp.id}>{exp.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

function HomePreview({ config, experiences }: { config: { cover?: string | null; headline?: string | null; tabs: WorkspaceHomeTab[] }; experiences: WorkspaceExperience[] }) {
  const { workspace } = useApp()

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      <p className="text-[10px] text-[var(--olu-muted)] px-4 pt-3 mb-2">Preview</p>
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-cyan-900/40 to-[var(--olu-card-bg)] relative">
        {config.cover && (
          <img src={config.cover} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>
      {/* Header */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="flex items-end gap-3">
          {workspace?.icon ? (
            <img src={workspace.icon} alt="" className="w-12 h-12 rounded-xl border-2 border-[var(--olu-section-bg)] object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[var(--olu-section-bg)] flex items-center justify-center text-white font-bold text-lg">
              {workspace?.name?.[0] || 'W'}
            </div>
          )}
          <div className="pb-1">
            <p className="font-bold text-sm">{workspace?.name || 'Workspace'}</p>
            <p className="text-xs text-[var(--olu-muted)]">{config.headline || 'No headline'}</p>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-1 overflow-x-auto">
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-300/10 text-cyan-700 dark:text-cyan-300 font-medium flex-shrink-0">About</span>
        {config.tabs.map((tab) => (
          <span key={tab.key} className="text-xs px-2.5 py-1 rounded-full bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] font-medium flex-shrink-0">
            {tab.label}
          </span>
        ))}
      </div>
      {/* Content hint */}
      <div className="px-4 pb-4 space-y-1.5">
        {config.tabs[0] && (
          <div className="text-xs text-[var(--olu-muted)]">
            {config.tabs[0].experience_ids.length} experience{config.tabs[0].experience_ids.length !== 1 ? 's' : ''} in "{config.tabs[0].label}" · {config.tabs[0].display_mode} view
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomeEditor() {
  const { t } = useTranslation()
  const { workspace } = useApp()
  const [experiences, setExperiences] = useState<WorkspaceExperience[]>([])
  const [cover, setCover] = useState('')
  const [headline, setHeadline] = useState('')
  const [tabs, setTabs] = useState<WorkspaceHomeTab[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const workspaceId = workspace?.id

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    Promise.all([
      getHomeConfig(workspaceId),
      listExperiences(workspaceId),
    ])
      .then(([config, exps]) => {
        setExperiences(exps)
        if (config) {
          setCover(config.cover || '')
          setHeadline(config.headline || '')
          setTabs(config.tabs || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  function addTab() {
    const position = tabs.length + 1
    setTabs([...tabs, {
      key: `tab-${Date.now()}`,
      label: `Tab ${position}`,
      experience_ids: [],
      display_mode: 'list',
      position,
    }])
  }

  function updateTab(index: number, updated: WorkspaceHomeTab) {
    const next = [...tabs]
    next[index] = updated
    setTabs(next)
  }

  function deleteTab(index: number) {
    setTabs(tabs.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!workspaceId) return
    setSaving(true)
    setMessage('')
    try {
      await upsertHomeConfig(workspaceId, {
        cover: cover || null,
        headline: headline || null,
        tabs: tabs.map((tab, i) => ({ ...tab, position: i + 1 })),
      })
      setMessage('Saved!')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="font-black text-2xl">Home Page</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            Customize your workspace homepage for consumers
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {message && (
        <p className={clsx('text-xs', message === 'Saved!' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-400')}>{message}</p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {/* Cover & Headline */}
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
            <h3 className="font-semibold text-sm">Branding</h3>
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Cover image URL</label>
              <input
                type="text"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="/images/covers/..."
                className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Short tagline for your workspace"
                className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>

          {/* Layout Templates */}
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
            <h3 className="font-semibold text-sm">Layout Template</h3>
            <p className="text-xs text-[var(--olu-text-secondary)]">Choose a starting template. You can customize tabs after selecting.</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.key}
                  onClick={() => {
                    const newTabs = tmpl.defaultTabs(experiences).map((t, i) => ({ ...t, position: i + 1 }))
                    setTabs(newTabs)
                  }}
                  className="p-3 rounded-xl border border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] hover:border-cyan-300/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tmpl.icon}</span>
                    <span className="font-semibold text-sm">{tmpl.label}</span>
                  </div>
                  <p className="text-[10px] text-[var(--olu-text-secondary)] leading-tight">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Tabs</h3>
              <button
                onClick={addTab}
                className="text-xs text-cyan-700 dark:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add tab
              </button>
            </div>

            <div className="text-xs text-[var(--olu-muted)] bg-[var(--olu-card-bg)] px-3 py-2 rounded-xl">
              About tab is always first (auto-generated).
            </div>

            {tabs.map((tab, i) => (
              <TabEditor
                key={tab.key}
                tab={tab}
                allExperiences={experiences}
                onChange={(updated) => updateTab(i, updated)}
                onDelete={() => deleteTab(i)}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <HomePreview
            config={{ cover, headline, tabs }}
            experiences={experiences}
          />
        </div>
      </div>
    </div>
  )
}
