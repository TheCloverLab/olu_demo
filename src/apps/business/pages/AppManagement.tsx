import { useEffect, useState } from 'react'
import { AppWindow, ChevronDown, Eye, EyeOff, Globe, Loader2, Pencil, Plus, Save, X } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import type { ConsumerApp } from '../../../lib/supabase'
import { getOwnedConsumerApps } from '../../../domain/consumer/apps'

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  community: { label: 'Community', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  academy: { label: 'Academy', color: 'text-blue-400', bg: 'bg-blue-400/10' },
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  draft: { label: 'Draft', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  archived: { label: 'Archived', color: 'text-cyan-100/45', bg: 'bg-cyan-500/10' },
}

const NEW_APP_TYPES = [
  { type: 'community', label: 'Community', description: 'Membership, topics, and creator-led engagement', icon: '👥' },
  { type: 'academy', label: 'Academy', description: 'Courses, lessons, and learning progress', icon: '🎓' },
  { type: 'consulting', label: 'Consulting', description: '1-on-1 sessions and expert bookings', icon: '💼', coming: true },
  { type: 'knowledge', label: 'Knowledge', description: 'Digital products, ebooks, and downloads', icon: '📚', coming: true },
]

function AppConfigPanel({ app, onClose }: { app: ConsumerApp; onClose: () => void }) {
  const [title, setTitle] = useState(app.title)
  const [summary, setSummary] = useState(app.summary || '')
  const [visibility, setVisibility] = useState(app.visibility)

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0a1525] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Pencil size={14} className="text-cyan-300" />
          Configure: {app.title}
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#12213a] transition-colors">
          <X size={16} className="text-cyan-100/45" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-cyan-100/45 block mb-1">App title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#0d1726] border border-cyan-500/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-cyan-100/45 block mb-1">Description</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full bg-[#0d1726] border border-cyan-500/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-cyan-100/45 block mb-1">Visibility</label>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5',
                  visibility === v
                    ? 'bg-cyan-300 text-[#04111f]'
                    : 'bg-[#0d1726] border border-cyan-500/10 text-cyan-100/60 hover:bg-[#12213a]'
                )}
              >
                {v === 'public' ? <Eye size={12} /> : <EyeOff size={12} />}
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 transition-colors">
            <Save size={12} />
            Save changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/60 text-xs font-medium hover:bg-[#12213a] transition-colors"
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
    <div className="rounded-2xl border border-cyan-500/20 bg-[#0a1525] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Plus size={14} className="text-cyan-300" />
          Create a new app
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#12213a] transition-colors">
          <X size={16} className="text-cyan-100/45" />
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
                ? 'border-cyan-500/5 bg-[#0d1726] opacity-50 cursor-not-allowed'
                : selected === item.type
                  ? 'border-cyan-300/40 bg-cyan-300/10'
                  : 'border-cyan-500/10 bg-[#0d1726] hover:bg-[#12213a]'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
              {item.coming && <span className="text-[10px] text-cyan-100/35 ml-auto">Coming soon</span>}
            </div>
            <p className="text-xs text-cyan-100/45">{item.description}</p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-3 pt-2 border-t border-cyan-500/10">
          <div>
            <label className="text-xs text-cyan-100/45 block mb-1">App name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${selected} app`}
              className="w-full bg-[#0d1726] border border-cyan-500/10 rounded-xl px-3 py-2 text-sm placeholder:text-cyan-100/30 focus:outline-none focus:border-cyan-500/30"
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
  const { consumerTemplate } = useApp()
  const [apps, setApps] = useState<ConsumerApp[]>([])
  const [loading, setLoading] = useState(true)
  const [configAppId, setConfigAppId] = useState<string | null>(null)
  const [showNewApp, setShowNewApp] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getOwnedConsumerApps(user)
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cyan-100/45" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-cyan-100/45 text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">App Management</h1>
          <p className="text-cyan-100/55 text-sm mt-1">
            {apps.length} consumer app{apps.length !== 1 ? 's' : ''} · {apps.filter((a) => a.status === 'published').length} published
          </p>
        </div>
        <button
          onClick={() => { setShowNewApp(!showNewApp); setConfigAppId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New app</span>
        </button>
      </div>

      {showNewApp && (
        <NewAppPanel onClose={() => setShowNewApp(false)} />
      )}

      {apps.length === 0 ? (
        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-12 text-center space-y-3">
          <AppWindow size={32} className="text-cyan-100/30 mx-auto" />
          <p className="text-cyan-100/55 text-sm">No consumer apps yet.</p>
          <p className="text-cyan-100/35 text-xs">Tap "New app" above to create your first community or academy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const typeBadge = TYPE_BADGE[app.app_type] || { label: app.app_type, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10' }
            const statusBadge = STATUS_BADGE[app.status] || STATUS_BADGE.draft
            const isConfiguring = configAppId === app.id

            return (
              <div key={app.id} className="space-y-3">
                <div className="rounded-2xl border border-cyan-500/10 bg-[#091422] overflow-hidden group">
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
                        {app.summary && <p className="text-cyan-100/45 text-xs mt-0.5 line-clamp-2">{app.summary}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', typeBadge.bg, typeBadge.color)}>{typeBadge.label}</span>
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', statusBadge.bg, statusBadge.color)}>{statusBadge.label}</span>
                      <span className="text-xs text-cyan-100/35 flex items-center gap-1">
                        {app.visibility === 'public' ? <Eye size={12} /> : <EyeOff size={12} />}
                        {app.visibility}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-cyan-500/10">
                      <button
                        onClick={() => { setConfigAppId(isConfiguring ? null : app.id); setShowNewApp(false) }}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                          isConfiguring
                            ? 'bg-cyan-300/20 text-cyan-300'
                            : 'bg-[#0d1726] hover:bg-[#12213a] text-cyan-100/60'
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
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0d1726] hover:bg-[#12213a] text-xs font-medium text-cyan-100/60 transition-colors"
                      >
                        <Globe size={12} />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {isConfiguring && (
                  <AppConfigPanel app={app} onClose={() => setConfigAppId(null)} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
