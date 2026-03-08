import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search, Sparkles } from 'lucide-react'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { getCreators } from '../../../services/api'

type DiscoverApp = {
  id: string
  type: 'community' | 'academy'
  title: string
  creatorName: string
  summary: string
  priceLabel: string
  href: string
  coverImg?: string
  gradient: string
  highlights: string[]
}

function DiscoverCard({
  app,
  onOpen,
}: {
  app: DiscoverApp
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full overflow-hidden rounded-[28px] border border-white/8 bg-[#111318] text-left hover:-translate-y-0.5 transition-all"
    >
      <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${app.gradient}`}>
        {app.coverImg ? <img src={app.coverImg} alt={app.title} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{app.type === 'community' ? 'Community' : 'Academy'}</p>
              <p className="mt-1 text-lg font-black text-white">{app.title}</p>
              <p className="mt-1 text-xs text-white/60">{app.creatorName}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/75">
              {app.priceLabel}
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
  const [apps, setApps] = useState<DiscoverApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDiscover() {
      try {
        const [creators, courseSnapshot] = await Promise.all([
          getCreators(),
          getCourseLibrarySnapshot(),
        ])

        if (cancelled) return

        const creatorByName = new Map(creators.map((creator) => [creator.name, creator]))

        const communityApps: DiscoverApp[] = creators.map((creator) => ({
          id: `community-${creator.id}`,
          type: 'community',
          title: `${creator.name} Inner Circle`,
          creatorName: creator.name,
          summary: creator.bio || 'Membership, recurring community discussions, and creator-only drops.',
          priceLabel: 'Membership',
          href: `/communities/${creator.id}`,
          coverImg: creator.cover_img,
          gradient: creator.avatar_color || 'from-fuchsia-700 via-rose-600 to-orange-500',
          highlights: ['Weekly drops', 'Private topics', 'Live sessions'],
        }))

        const academyApps: DiscoverApp[] = courseSnapshot.courses.map((course) => ({
          id: `academy-${course.id}`,
          type: 'academy',
          title: `${course.instructor} Academy`,
          creatorName: course.instructor,
          summary: course.subtitle,
          priceLabel: `$${course.price}`,
          href: `/courses/${course.slug}`,
          coverImg: creatorByName.get(course.instructor)?.cover_img,
          gradient: course.hero,
          highlights: course.sections?.slice(0, 3).map((section) => section.title) || ['Structured lessons', 'Hands-on frameworks', 'Learning progress'],
        }))

        setApps([...communityApps, ...academyApps])
      } catch (error) {
        console.error('Failed to load discover', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDiscover()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return apps
    return apps.filter((app) => (
      app.title.toLowerCase().includes(normalized)
      || app.creatorName.toLowerCase().includes(normalized)
      || app.summary.toLowerCase().includes(normalized)
      || app.type.toLowerCase().includes(normalized)
    ))
  }, [apps, query])

  const recommendedCommunities = filteredApps.filter((app) => app.type === 'community').slice(0, 4)
  const recommendedAcademies = filteredApps.filter((app) => app.type === 'academy').slice(0, 4)
  const spotlight = filteredApps.slice(0, 2)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-[0.18em] mb-2">
              <Compass size={14} />
              Discover
            </div>
            <h1 className="font-black text-xl md:text-2xl leading-tight">Find your next favorite app.</h1>
            <p className="text-white/58 text-sm mt-2">
              Communities to join, academies to learn from.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Community', 'Academy', 'Creator-led'].map((chip) => (
            <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/68">
              {chip}
            </span>
          ))}
        </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101217] px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search app, creator, or theme"
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/35"
          />
        </div>
      </section>

      {spotlight.length > 0 ? (
        <section className="grid md:grid-cols-2 gap-4">
          {spotlight.map((app) => (
            <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
          ))}
        </section>
      ) : null}

      <section className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-lg">Communities</p>
            <span className="text-xs text-white/45">{recommendedCommunities.length} results</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendedCommunities.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
          </div>
          {!loading && recommendedCommunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
              No communities matched your search.
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-lg">Academies</p>
            <span className="text-xs text-white/45">{recommendedAcademies.length} results</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendedAcademies.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
          </div>
          {!loading && recommendedAcademies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
              No academies matched your search.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
