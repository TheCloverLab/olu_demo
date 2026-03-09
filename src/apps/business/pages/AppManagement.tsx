import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppWindow, ExternalLink, Eye, EyeOff, Globe, Loader2, MoreHorizontal, Pencil, Plus } from 'lucide-react'
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

export default function AppManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { consumerTemplate } = useApp()
  const [apps, setApps] = useState<ConsumerApp[]>([])
  const [loading, setLoading] = useState(true)

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
          onClick={() => navigate('/business/settings#consumer-app')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Configure apps</span>
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-12 text-center space-y-3">
          <AppWindow size={32} className="text-cyan-100/30 mx-auto" />
          <p className="text-cyan-100/55 text-sm">No consumer apps yet.</p>
          <p className="text-cyan-100/35 text-xs">Create your first community or academy from Settings.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => {
            const typeBadge = TYPE_BADGE[app.app_type] || { label: app.app_type, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10' }
            const statusBadge = STATUS_BADGE[app.status] || STATUS_BADGE.draft

            return (
              <div key={app.id} className="rounded-2xl border border-cyan-500/10 bg-[#091422] overflow-hidden group">
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
                    <button className="p-1.5 rounded-lg hover:bg-[#12213a] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} className="text-cyan-100/45" />
                    </button>
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
                      onClick={() => navigate('/business/settings#consumer-app')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0d1726] hover:bg-[#12213a] text-xs font-medium text-cyan-100/60 transition-colors"
                    >
                      <Pencil size={12} />
                      Settings
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
            )
          })}
        </div>
      )}
    </div>
  )
}
