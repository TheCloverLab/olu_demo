import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Compass, Search, Users } from 'lucide-react'
import { getDiscoverWorkspaces } from '../../../domain/workspace/api'
import type { Workspace } from '../../../lib/supabase'

const CARD_GRADIENTS = [
  'from-cyan-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-sky-600 to-indigo-700',
  'from-teal-600 to-cyan-700',
  'from-blue-600 to-sky-700',
  'from-green-600 to-emerald-700',
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length]
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const navigate = useNavigate()
  const [imgBroken, setImgBroken] = useState(false)

  return (
    <button
      onClick={() => navigate(`/w/${workspace.slug}`)}
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-all hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-0.5"
    >
      <div className="aspect-[16/9] relative">
        {(workspace.cover || workspace.icon) && !imgBroken ? (
          <img
            src={workspace.cover || workspace.icon!}
            alt={workspace.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${pickGradient(workspace.id)}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black text-white/30">{workspace.name[0]}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-base font-bold text-white group-hover:text-cyan-100 transition-colors">{workspace.name}</h3>
        {workspace.headline && (
          <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{workspace.headline}</p>
        )}
      </div>
    </button>
  )
}

export default function Discover() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query.trim() === debouncedQuery) return
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getDiscoverWorkspaces({ query: debouncedQuery || undefined })
      .then((data) => { if (!cancelled) setWorkspaces(data) })
      .catch(() => { if (!cancelled) setWorkspaces([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [debouncedQuery])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.2em]">
          <Compass size={14} />
          {t('discover.title')}
        </div>
        <h1 className="font-black text-2xl md:text-3xl leading-tight">
          {t('discover.heading')}
        </h1>
        <p className="text-[var(--olu-text-secondary)] text-sm max-w-lg">
          {t('discover.subtitle')}
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--olu-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('discover.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--olu-border)] bg-[var(--olu-surface)] text-sm text-[var(--olu-input-text)] placeholder:text-[var(--olu-input-placeholder)] focus:outline-none focus:border-[var(--olu-input-focus)] transition-colors"
          />
        </div>
      </section>

      {/* Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">
            {debouncedQuery ? t('discover.results') : t('discover.recommended')}
          </p>
          {!loading && (
            <span className="text-xs text-[var(--olu-muted)]">
              {workspaces.length} app{workspaces.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {workspaces.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}

        {!loading && workspaces.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-400 dark:border-[var(--olu-border)] px-6 py-12 text-center space-y-3">
            <Users size={28} className="text-[var(--olu-muted)] mx-auto" />
            <p className="text-sm text-[var(--olu-muted)]">
              {debouncedQuery ? t('discover.noResults') : t('discover.nothingNew')}
            </p>
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-[var(--olu-surface)] overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-[var(--olu-border)]/40" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 bg-[var(--olu-border)] rounded-full" />
                  <div className="h-3 w-1/3 bg-[var(--olu-border)] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
