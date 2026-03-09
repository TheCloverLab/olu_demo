import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import { getDiscoverConsumerAppCards, type ConsumerAppCard } from '../../../domain/consumer/apps'

const PAGE_SIZE = 4

function DiscoverCard({
  app,
  onOpen,
}: {
  app: ConsumerAppCard
  onOpen: () => void
}) {
  const [coverBroken, setCoverBroken] = useState(false)

  return (
    <button
      onClick={onOpen}
      className="w-full overflow-hidden rounded-[28px] border border-white/8 bg-[#111318] text-left hover:-translate-y-0.5 transition-all"
    >
      <div className="relative h-44 overflow-hidden bg-[#171b22]">
        {app.cover_img && !coverBroken ? (
          <img
            src={app.cover_img}
            alt={app.title}
            className="h-full w-full object-cover"
            onError={() => setCoverBroken(true)}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{app.app_type === 'community' ? 'Community' : 'Academy'}</p>
              <p className="mt-1 text-lg font-black text-white">{app.title}</p>
              <p className="mt-1 text-xs text-white/60">{app.owner_name}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/75">
              {app.price_label}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-white/72 line-clamp-2">{app.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {app.highlights.map((item) => (
            <span key={item} className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-white/68">
              {item}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

export default function Discover() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [apps, setApps] = useState<ConsumerAppCard[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
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

  const emptyLabel = useMemo(() => {
    if (!debouncedQuery) return 'Nothing new right now.'
    return 'No results matched that search.'
  }, [debouncedQuery])

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-[0.18em] mb-2">
            <Compass size={14} />
            Discover
          </div>
          <h1 className="font-black text-xl md:text-2xl leading-tight">Find something new.</h1>
          <p className="text-white/58 text-sm mt-2">
            Communities to join, academies to learn from.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101217] px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creator, community, academy, or topic"
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/35"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">{debouncedQuery ? 'Results' : 'Recommended for you'}</p>
          <span className="text-xs text-white/45">{apps.length} shown</span>
        </div>

        {apps.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {apps.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
          </div>
        ) : null}

        {!loading && apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-white/45">
            {emptyLabel}
          </div>
        ) : null}

        {(loading || loadingMore) ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/55">
            Loading more recommendations...
          </div>
        ) : null}

        <div ref={sentinelRef} className="h-4" />
      </section>
    </div>
  )
}
