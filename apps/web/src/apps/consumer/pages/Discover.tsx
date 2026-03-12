import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import clsx from 'clsx'
import { getDiscoverConsumerAppCards, type ConsumerAppCard } from '../../../domain/consumer/apps'

const PAGE_SIZE = 4

const CARD_GRADIENTS = [
  'from-fuchsia-700 via-rose-600 to-orange-500',
  'from-violet-700 via-purple-600 to-indigo-500',
  'from-cyan-700 via-teal-600 to-emerald-500',
  'from-amber-600 via-orange-500 to-rose-500',
  'from-blue-700 via-sky-600 to-cyan-500',
  'from-pink-600 via-fuchsia-500 to-purple-500',
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length]
}

function DiscoverCard({
  app,
  onOpen,
}: {
  app: ConsumerAppCard
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const [coverBroken, setCoverBroken] = useState(false)

  return (
    <button
      onClick={onOpen}
      className="relative w-full overflow-hidden rounded-[24px] text-left hover:-translate-y-0.5 transition-all min-h-[260px] flex flex-col justify-end"
    >
      {/* Full-card background */}
      {app.cover_img && !coverBroken ? (
        <img
          src={app.cover_img}
          alt={app.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setCoverBroken(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${pickGradient(app.id)}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/15" />

      {/* Content overlay */}
      <div className="relative p-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">
            {app.app_type === 'community' ? t('discover.community') : t('discover.academy')}
          </p>
          <h3 className="mt-1 text-lg font-black text-white">{app.title}</h3>
          <p className="mt-1 text-xs text-white/72 line-clamp-1">
            {app.summary || app.owner_name}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-600 dark:text-amber-300 backdrop-blur-sm">
            {app.price_label}
          </span>
          <span className="text-xs text-olu-muted">{app.owner_name}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {app.highlights.map((item) => (
            <span key={item} className="rounded-full border border-white/15 bg-black/30 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white/80">
              {item}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

type CategoryFilter = 'all' | 'community' | 'academy'

export default function Discover() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [apps, setApps] = useState<ConsumerAppCard[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (query.trim() === debouncedQuery) return

    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(0)
      setApps([])
      setHasMore(true)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    async function loadDiscoverPage() {
      if (!hasMore && page > 0) return

      if (page === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const nextItems = await getDiscoverConsumerAppCards({ query: debouncedQuery, page, pageSize: PAGE_SIZE })

        if (cancelled) return

        setApps((current) => {
          if (page === 0) return nextItems
          const seen = new Set(current.map((item) => item.id))
          return [...current, ...nextItems.filter((item) => !seen.has(item.id))]
        })
        setHasMore(nextItems.length >= PAGE_SIZE)
      } catch (error) {
        console.error('Failed to load discover', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }

    loadDiscoverPage()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, hasMore, page])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0]
      if (target?.isIntersecting && !loading && !loadingMore && hasMore) {
        setPage((current) => current + 1)
      }
    }, { rootMargin: '160px' })

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, apps.length])

  const filteredApps = useMemo(() => {
    if (category === 'all') return apps
    return apps.filter((app) => app.app_type === category)
  }, [apps, category])

  const emptyLabel = useMemo(() => {
    if (!debouncedQuery) return t('discover.nothingNew')
    return t('discover.noResults')
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
          <p className="text-olu-muted text-sm mt-2">
            {t('discover.subtitle')}
          </p>
        </div>
        <div className="rounded-2xl border border-olu-border bg-olu-surface px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-olu-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('discover.searchPlaceholder')}
            className="w-full bg-transparent outline-none text-sm text-[var(--olu-input-text)] placeholder:text-[var(--olu-input-placeholder)]"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="font-bold text-lg">{debouncedQuery ? t('discover.results') : t('discover.recommended')}</p>
          <div className="flex items-center gap-2">
            {([['all', t('common.all')], ['community', t('common.communities')], ['academy', t('common.academies')]] as [CategoryFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  category === key
                    ? 'bg-[var(--olu-chip-active-bg)] text-[var(--olu-chip-active-text)]'
                    : 'bg-transparent text-olu-muted border border-olu-border hover:bg-olu-card'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredApps.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredApps.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
          </div>
        ) : null}

        {!loading && filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-olu-border px-4 py-8 text-sm text-olu-muted">
            {emptyLabel}
          </div>
        ) : null}

        {(loading || loadingMore) ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-[24px] bg-olu-surface overflow-hidden animate-pulse min-h-[260px] flex flex-col justify-end">
                <div className="h-full bg-[var(--olu-card-bg)]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-20 bg-olu-border rounded-full" />
                  <div className="h-5 w-3/4 bg-olu-border rounded-full" />
                  <div className="h-3 w-1/2 bg-olu-border rounded-full" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-16 bg-olu-border rounded-full" />
                    <div className="h-6 w-16 bg-olu-border rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div ref={sentinelRef} className="h-4" />
      </section>
    </div>
  )
}
