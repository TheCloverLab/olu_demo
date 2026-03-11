import { useEffect, useState } from 'react'
import { AppWindow, ChevronDown, Eye, EyeOff, Globe, ImagePlus, Loader2, Pencil, Plus, Save, X } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import type { ConsumerApp } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase'
import { getOwnedConsumerApps } from '../../../domain/consumer/apps'
import { updateWorkspaceConsumerConfigForUser } from '../../../domain/workspace/api'

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  community: { label: 'Community', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  academy: { label: 'Academy', color: 'text-blue-400', bg: 'bg-blue-400/10' },
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  draft: { label: 'Draft', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  archived: { label: 'Archived', color: 'text-[var(--olu-text-secondary)]', bg: 'bg-cyan-500/10' },
}

const NEW_APP_TYPES = [
  { type: 'community', label: 'Community', description: 'Membership, topics, and creator-led engagement', icon: '👥' },
  { type: 'academy', label: 'Academy', description: 'Courses, lessons, and learning progress', icon: '🎓' },
  { type: 'consulting', label: 'Consulting', description: '1-on-1 sessions and expert bookings', icon: '💼', coming: true },
  { type: 'knowledge', label: 'Knowledge', description: 'Digital products, ebooks, and downloads', icon: '📚', coming: true },
]

function AppConfigPanel({ app, onClose, onSaved }: { app: ConsumerApp; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [title, setTitle] = useState(app.title)
  const [summary, setSummary] = useState(app.summary || '')
  const [visibility, setVisibility] = useState(app.visibility)
  const [coverPreview, setCoverPreview] = useState(app.cover_img || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setMessage('')
    try {
      let coverUrl = app.cover_img || ''

      if (coverFile) {
        const ext = coverFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${app.app_type}-cover-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('covers').upload(path, coverFile, { upsert: true, contentType: coverFile.type })
        if (uploadErr) throw uploadErr
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      }

      if (app.app_type === 'community') {
        await updateWorkspaceConsumerConfigForUser(user, {
          config_json: {
            ...(app.config_json || {}),
            community_hero_title: title,
            community_hero_description: summary,
            cover_img: coverUrl,
          },
        })
      } else if (app.linked_course_id) {
        const updates: Record<string, any> = { title, subtitle: summary, hero: coverUrl || '' }
        const { error } = await supabase.from('consumer_courses').update(updates).eq('id', app.linked_course_id)
        if (error) throw error
      }

      setMessage('Saved!')
      setTimeout(() => { onSaved() }, 400)
    } catch (err: any) {
      setMessage(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[var(--olu-section-bg)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Pencil size={14} className="text-cyan-300" />
          Configure: {app.title}
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors">
          <X size={16} className="text-[var(--olu-text-secondary)]" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Cover image</label>
          <div className="relative rounded-xl overflow-hidden border border-[var(--olu-card-border)] bg-[var(--olu-card-bg)]">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 flex items-center justify-center text-cyan-100/25">
                <ImagePlus size={24} />
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-xs font-medium text-white bg-black/60 px-3 py-1.5 rounded-lg">Change cover</span>
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">App title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Description</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Visibility</label>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
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
                {v === 'public' ? <Eye size={12} /> : <EyeOff size={12} />}
                {v}
              </button>
            ))}
          </div>
        </div>
        {message && <p className={`text-xs ${message === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
          >
            <Save size={12} />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function NewAppPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[var(--olu-section-bg)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Plus size={14} className="text-cyan-300" />
          Create a new app
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors">
          <X size={16} className="text-[var(--olu-text-secondary)]" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {NEW_APP_TYPES.map((item) => (
          <button
            key={item.type}
            onClick={() => !item.coming && setSelected(item.type)}
            disabled={item.coming}
            className={clsx(
              'p-3 rounded-xl text-left transition-colors border',
              item.coming
                ? 'border-cyan-500/5 bg-[var(--olu-card-bg)] opacity-50 cursor-not-allowed'
                : selected === item.type
                  ? 'border-cyan-300/40 bg-cyan-300/10'
                  : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)]'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
              {item.coming && <span className="text-[10px] text-[var(--olu-muted)] ml-auto">Coming soon</span>}
            </div>
            <p className="text-xs text-[var(--olu-text-secondary)]">{item.description}</p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-3 pt-2 border-t border-[var(--olu-card-border)]">
          <div>
            <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">App name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${selected} app`}
              className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors">
            <Plus size={14} />
            Create {selected} app
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppManagement() {
  const { user } = useAuth()
  const [apps, setApps] = useState<ConsumerApp[]>([])
  const [loading, setLoading] = useState(true)
  const [configAppId, setConfigAppId] = useState<string | null>(null)
  const [showNewApp, setShowNewApp] = useState(false)

  function reloadApps() {
    if (!user) return
    getOwnedConsumerApps(user)
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    reloadApps()
  }, [user?.id])

  const primaryApp = apps[0] || null

  const canCreateApp = apps.length === 0

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
          <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">App Management</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {primaryApp ? '1 app managed in UI' : 'No consumer app yet'} · backend still supports multiple apps
          </p>
        </div>
        {canCreateApp && (
          <button
            onClick={() => { setShowNewApp(!showNewApp); setConfigAppId(null) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New app</span>
          </button>
        )}
      </div>



      {showNewApp && (
        <NewAppPanel onClose={() => setShowNewApp(false)} />
      )}

      {!primaryApp ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center space-y-3">
          <AppWindow size={32} className="text-cyan-100/30 mx-auto" />
          <p className="text-[var(--olu-text-secondary)] text-sm">No consumer app yet.</p>
          <p className="text-[var(--olu-muted)] text-xs">Tap "New app" above to create the one app this UI currently supports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const app = primaryApp
            const typeBadge = TYPE_BADGE[app.app_type] || { label: app.app_type, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-cyan-500/10' }
            const statusBadge = STATUS_BADGE[app.status] || STATUS_BADGE.draft
            const isConfiguring = configAppId === app.id

            return (
              <div key={app.id} className="space-y-3">
                <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden group">
                  {app.cover_img ? (
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${app.cover_img})` }} />
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-cyan-900/40 to-[#091422] flex items-center justify-center">
                      <AppWindow size={28} className="text-cyan-100/20" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{app.title}</h3>
                        {app.summary && <p className="text-[var(--olu-text-secondary)] text-xs mt-0.5 line-clamp-2">{app.summary}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', typeBadge.bg, typeBadge.color)}>{typeBadge.label}</span>
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', statusBadge.bg, statusBadge.color)}>{statusBadge.label}</span>
                      <span className="text-xs text-[var(--olu-muted)] flex items-center gap-1">
                        {app.visibility === 'public' ? <Eye size={12} /> : <EyeOff size={12} />}
                        {app.visibility}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--olu-card-border)]">
                      <button
                        onClick={() => { setConfigAppId(isConfiguring ? null : app.id); setShowNewApp(false) }}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                          isConfiguring
                            ? 'bg-cyan-300/20 text-cyan-300'
                            : 'bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)] text-[var(--olu-text-secondary)]'
                        )}
                      >
                        {isConfiguring ? <ChevronDown size={12} /> : <Pencil size={12} />}
                        Configure
                      </button>
                      <button
                        onClick={() => {
                          const href = app.app_type === 'community' ? `/communities/${app.owner_user_id}` : `/courses/${app.slug}`
                          window.open(href, '_blank', 'noopener,noreferrer')
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)] text-xs font-medium text-[var(--olu-text-secondary)] transition-colors"
                      >
                        <Globe size={12} />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {isConfiguring && (
                  <AppConfigPanel app={app} onClose={() => setConfigAppId(null)} onSaved={() => { setConfigAppId(null); reloadApps() }} />
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
