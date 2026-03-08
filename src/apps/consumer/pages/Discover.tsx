import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Compass, Crown, Search, Sparkles } from 'lucide-react'
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
      className="w-full overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#0d1726] text-left hover:bg-[#112034] transition-colors"
    >
      <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${app.gradient}`}>
        {app.coverImg ? <img src={app.coverImg} alt={app.title} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06101d] via-[#06101d]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/55">{app.type === 'community' ? 'Community' : 'Academy'}</p>
              <p className="mt-1 text-lg font-black text-white">{app.title}</p>
              <p className="mt-1 text-xs text-cyan-100/55">{app.creatorName}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/75">
              {app.priceLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-cyan-50/75 line-clamp-2">{app.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {app.highlights.map((item) => (
            <span key={item} className="rounded-full border border-cyan-500/10 bg-white/5 px-2.5 py-1 text-[11px] text-cyan-100/70">
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

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="rounded-3xl border border-cyan-500/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)] p-6 md:p-7">
        <div className="flex items-center gap-2 text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-3">
          <Compass size={14} />
          Discover
        </div>
        <h1 className="font-black text-2xl md:text-4xl max-w-3xl leading-tight">Discover new apps.</h1>
        <p className="text-cyan-100/60 text-sm md:text-base max-w-2xl mt-3">
          Browse creators, communities, and academies.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          {['Community', 'Academy', 'Creator-led'].map((chip) => (
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
            placeholder="Search app, creator, or theme"
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-cyan-100/35"
          />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-amber-300" />
            <p className="font-bold">Community apps</p>
          </div>
          <div className="space-y-3">
            {recommendedCommunities.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
            {!loading && recommendedCommunities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-500/15 px-4 py-6 text-sm text-cyan-100/50">
                No community apps matched your search.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-emerald-300" />
            <p className="font-bold">Academy apps</p>
          </div>
          <div className="space-y-3">
            {recommendedAcademies.map((app) => (
              <DiscoverCard key={app.id} app={app} onOpen={() => navigate(app.href)} />
            ))}
            {!loading && recommendedAcademies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-500/15 px-4 py-6 text-sm text-cyan-100/50">
                No academy apps matched your search.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-500/10 bg-[#091422] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-cyan-300" />
          <p className="font-bold">Recommended right now</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {filteredApps.slice(0, 3).map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(app.href)}
              className="overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#0d1726] text-left hover:bg-[#112034] transition-colors"
            >
              <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${app.gradient}`}>
                {app.coverImg ? <img src={app.coverImg} alt={app.title} className="h-full w-full object-cover" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#06101d] via-[#06101d]/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm text-white">{app.title}</p>
                    <span className="rounded-full border border-cyan-500/10 bg-white/5 px-2.5 py-1 text-[11px] text-cyan-100/65">
                      {app.type === 'community' ? 'Community' : 'Academy'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-cyan-100/45">{app.creatorName}</p>
                <p className="text-sm text-cyan-50/75 mt-3 line-clamp-2">{app.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
