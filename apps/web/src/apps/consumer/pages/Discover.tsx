import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import { getDiscoverWorkspaces } from '../../../domain/workspace/api'
import type { Workspace } from '../../../lib/supabase'

const CARD_GRADIENTS = [
  'from-cyan-700 via-teal-600 to-emerald-500',
  'from-blue-700 via-sky-600 to-cyan-500',
  'from-amber-600 via-orange-500 to-rose-500',
  'from-emerald-700 via-green-600 to-lime-500',
  'from-sky-700 via-blue-600 to-indigo-500',
  'from-teal-600 via-cyan-500 to-sky-500',
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
      className="relative w-full overflow-hidden rounded-[24px] text-left hover:-translate-y-0.5 transition-all min-h-[200px] flex flex-col justify-end"
    >
      {workspace.icon && !imgBroken ? (
        <img
          src={workspace.icon}
          alt={workspace.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgBroken(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${pickGradient(workspace.id)}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

      <div className="relative p-4 space-y-2">
        <h3 className="text-lg font-black text-white">{workspace.name}</h3>
        {workspace.headline && (
          <p className="text-xs text-white/70 line-clamp-2">{workspace.headline}</p>
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
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-olu-muted text-xs uppercase tracking-[0.18em] mb-2">
            <Compass size={14} />
            {t('discover.title')}
          </div>
          <h1 className="font-black text-xl md:text-2xl leading-tight">{t('discover.heading')}</h1>
          <p className="text-olu-muted text-sm mt-2">{t('discover.subtitle')}</p>
        </div>
        <div className="rounded-2xl border border-olu-border bg-olu-surface px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-olu-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('discover.searchPlaceholder')}
            className="w-full bg-transparent outline-none text-sm text-[var(--olu-input-text)] placeholder:text-[var(--olu-input-placeholder)]"
          />
        </div>
      </section>

      <section className="space-y-4">
        <p className="font-bold text-lg">{debouncedQuery ? t('discover.results') : t('discover.recommended')}</p>

        {workspaces.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        ) : null}

        {!loading && workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-olu-border px-4 py-8 text-sm text-olu-muted">
            {debouncedQuery ? t('discover.noResults') : t('discover.nothingNew')}
          </div>
        ) : null}

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-[24px] bg-olu-surface overflow-hidden animate-pulse min-h-[200px] flex flex-col justify-end">
                <div className="h-full bg-olu-border/40" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-olu-border rounded-full" />
                  <div className="h-3 w-1/2 bg-olu-border rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
