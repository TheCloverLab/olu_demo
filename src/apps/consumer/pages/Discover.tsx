import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search, Sparkles, Users } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { getCreators } from '../../../services/api'

export default function Discover() {
  const navigate = useNavigate()
  const { consumerTemplate } = useApp()
  const [query, setQuery] = useState('')
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCreators() {
      try {
        const data = await getCreators()
        if (!cancelled) {
          setCreators(data)
        }
      } catch (error) {
        console.error('Failed to load creators for discover', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCreators()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredCreators = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return creators
    return creators.filter((creator) => (
      creator.name?.toLowerCase().includes(normalized)
      || creator.handle?.toLowerCase().includes(normalized)
      || creator.bio?.toLowerCase().includes(normalized)
    ))
  }, [creators, query])

  const discoverTitle = consumerTemplate === 'fan_community' ? 'Discover community apps' : 'Discover course apps'
  const discoverDescription = consumerTemplate === 'fan_community'
    ? 'Find creators with memberships, circles, and recurring community rituals.'
    : 'Find creators with structured lessons, catalogs, and continuing learning paths.'
  const primaryChip = consumerTemplate === 'fan_community' ? 'Membership-first' : 'Structured learning'
  const secondaryChip = consumerTemplate === 'fan_community' ? 'Creator recommendations' : 'Course launches'

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="rounded-3xl border border-cyan-500/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)] p-6 md:p-7">
        <div className="flex items-center gap-2 text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-3">
          <Compass size={14} />
          Discover
        </div>
        <h1 className="font-black text-2xl md:text-4xl max-w-3xl leading-tight">{discoverTitle}</h1>
        <p className="text-cyan-100/60 text-sm md:text-base max-w-2xl mt-3">{discoverDescription}</p>
        <div className="flex flex-wrap gap-2 mt-5">
          {[primaryChip, secondaryChip, 'Browse by creator'].map((chip) => (
            <span key={chip} className="rounded-full border border-cyan-500/10 bg-white/5 px-3 py-1.5 text-xs text-cyan-100/70">
              {chip}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-cyan-500/10 bg-[#091422] px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-cyan-100/45" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creator, handle, or theme"
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-cyan-100/35"
          />
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-300" />
            <p className="font-bold">Recommended right now</p>
          </div>
          <div className="space-y-3">
            {(loading ? [] : filteredCreators.slice(0, 3)).map((creator) => (
              <button
                key={creator.id}
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="w-full rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 text-left hover:bg-[#112034] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{creator.name}</p>
                    <p className="text-xs text-cyan-100/45 mt-1">{creator.handle}</p>
                    <p className="text-sm text-cyan-50/75 mt-3 line-clamp-2">{creator.bio || 'No description yet.'}</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100/70">
                    {consumerTemplate === 'fan_community' ? 'Community app' : 'Course app'}
                  </span>
                </div>
              </button>
            ))}
            {!loading && filteredCreators.length === 0 && (
              <div className="rounded-2xl border border-dashed border-cyan-500/15 px-4 py-6 text-sm text-cyan-100/50">
                No creators matched your search yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-cyan-300" />
            <p className="font-bold">How discovery works</p>
          </div>
          <div className="space-y-3">
            {[
              'Browse creators in the current app shape first, then enter a creator app.',
              'Use creator bio, handle, and recommendations to narrow who feels worth following.',
              consumerTemplate === 'fan_community'
                ? 'After entering an app, the next actions are membership, circles, and member posts.'
                : 'After entering an app, the next actions are catalog, checkout, and learning.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 text-sm text-cyan-50/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
