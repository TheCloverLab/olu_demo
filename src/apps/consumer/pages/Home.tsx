import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronRight, Crown, Flame, GraduationCap, Lock, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { computeCourseProgress, getMembershipStatus, getProgressForCourse, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { buildAcademyCardFromCourse, buildCommunityCardFromCreator } from '../../../domain/consumer/apps'
import { getPublicCreators } from '../../../domain/profile/api'
import { getPosts } from '../../../domain/consumer/data'
import { getPublicCommunityConfigsByOwner } from '../../../domain/profile/data'
import type { ConsumerLessonProgress, User } from '../../../lib/supabase'
import type { Course } from '../courseData'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

type JoinedCommunity = {
  creator: User
  tierName: string
}

function AppCover({
  src,
  alt,
  gradient,
  eyebrow,
  title,
  subtitle,
}: {
  src?: string
  alt: string
  gradient: string
  eyebrow: string
  title: string
  subtitle: string
}) {
  const [coverBroken, setCoverBroken] = useState(false)

  return (
    <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${gradient}`}>
      {src && !coverBroken ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setCoverBroken(true)} />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
        <p className="mt-1 text-xs text-white/72 line-clamp-1">{subtitle}</p>
      </div>
    </div>
  )
}

function ContinueCourseCard({
  course,
  progress,
  onOpen,
}: {
  course: Course
  progress: ConsumerLessonProgress[]
  onOpen: () => void
}) {
  const summary = computeCourseProgress(course, progress)

  return (
    <button
      onClick={onOpen}
      className="rounded-[24px] overflow-hidden border border-white/10 bg-[#111111] text-left hover:-translate-y-0.5 transition-all"
    >
      <div className={`h-36 bg-gradient-to-br ${course.hero} p-5 flex flex-col justify-between`}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs font-medium text-black/75">
          <GraduationCap size={13} />
          Academy
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-black/60">{course.instructor}</p>
          <h3 className="font-black text-2xl text-black mt-2 leading-tight">{course.title}</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-olu-muted line-clamp-2">{course.subtitle}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
            <p className="font-bold text-sm">{summary.completedCount}/{course.sections.length}</p>
            <p className="text-[11px] text-olu-muted">Lessons</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
            <p className="font-bold text-sm">{summary.percent}%</p>
            <p className="text-[11px] text-olu-muted">Progress</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
            <p className="font-bold text-sm">{course.stats.completionRate}</p>
            <p className="text-[11px] text-olu-muted">Avg. complete</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="font-semibold text-sm text-emerald-300">Continue learning</p>
          <span className="inline-flex items-center gap-2 text-sm text-white/72">
            Open
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [creators, setCreators] = useState<User[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [communityConfigs, setCommunityConfigs] = useState<Map<string, any>>(new Map())
  const [purchasedSlugs, setPurchasedSlugs] = useState<string[]>([])
  const [progressBySlug, setProgressBySlug] = useState<Record<string, ConsumerLessonProgress[]>>({})
  const [memberships, setMemberships] = useState<Record<string, { tier_name: string }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadHome() {
      try {
        const [creatorsData, postsData, courseSnapshot] = await Promise.all([
          getPublicCreators(),
          getPosts(16),
          getCourseLibrarySnapshot(),
        ])
        const publicCommunityConfigMap = await getPublicCommunityConfigsByOwner(creatorsData.map((creator) => creator.id))

        const [membershipEntries, purchased, progressEntries] = await Promise.all([
          Promise.all(
            creatorsData.map(async (creator) => {
              const status = await getMembershipStatus(user as any, creator.id).catch(() => null)
              return [creator.id, status] as const
            })
          ),
          getPurchasedCourseSlugs(user as any, courseSnapshot.courses).catch(() => []),
          Promise.all(
            courseSnapshot.courses.map(async (course) => [course.slug, await getProgressForCourse(user as any, course).catch(() => [])] as const)
          ),
        ])

        if (cancelled) return

        setCreators(creatorsData)
        setPosts(postsData)
        setCourseLibrary(courseSnapshot.courses)
        setCommunityConfigs(publicCommunityConfigMap)
        setPurchasedSlugs(purchased)
        setProgressBySlug(Object.fromEntries(progressEntries))
        setMemberships(
          Object.fromEntries(
            membershipEntries
              .filter(([, status]) => !!status?.tier_name)
              .map(([creatorId, status]) => [creatorId, { tier_name: status!.tier_name }])
          )
        )
      } catch (error) {
        console.error('Failed to load home', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHome()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const joinedCommunities = useMemo<JoinedCommunity[]>(() => {
    return creators
      .filter((creator) => memberships[creator.id]?.tier_name)
      .map((creator) => ({
        creator,
        tierName: memberships[creator.id].tier_name,
      }))
  }, [creators, memberships])

  const purchasedCourses = useMemo(() => {
    return courseLibrary.filter((course) => purchasedSlugs.includes(course.slug))
  }, [courseLibrary, purchasedSlugs])

  const relatedPosts = useMemo(() => {
    const joinedCreatorIds = new Set(joinedCommunities.map((item) => item.creator.id))
    const filtered = joinedCreatorIds.size > 0
      ? posts.filter((post) => post.creator?.id && joinedCreatorIds.has(post.creator.id))
      : []
    return filtered.slice(0, 5)
  }, [joinedCommunities, posts])

  const publicCommunityCreators = useMemo(() => {
    return creators.filter((creator) => communityConfigs.has(creator.id))
  }, [creators, communityConfigs])

  const communityCardsById = useMemo(() => {
    return new Map(publicCommunityCreators.map((creator) => [creator.id, buildCommunityCardFromCreator(creator as any, communityConfigs.get(creator.id))]))
  }, [publicCommunityCreators, communityConfigs])

  const recommendedCommunities = useMemo(() => {
    const joinedIds = new Set(joinedCommunities.map((item) => item.creator.id))
    return publicCommunityCreators.filter((creator) => !joinedIds.has(creator.id)).slice(0, 3)
  }, [publicCommunityCreators, joinedCommunities])

  const recommendedAcademies = useMemo(() => {
    const purchased = new Set(purchasedSlugs)
    return courseLibrary.filter((course) => !purchased.has(course.slug)).slice(0, 3)
  }, [courseLibrary, purchasedSlugs])

  const activeAppCount = joinedCommunities.length + purchasedCourses.length

  const creatorByName = useMemo(() => {
    return new Map(creators.map((creator) => [creator.name, creator]))
  }, [creators])

  const recommendedAcademyCards = useMemo(() => {
    return recommendedAcademies.map((course) => buildAcademyCardFromCourse(course as any, creatorByName.get(course.instructor)))
  }, [recommendedAcademies, creatorByName])

  const [brokenPostCovers, setBrokenPostCovers] = useState<Record<string, boolean>>({})

  if (loading) {
    return (
      <div className="pb-24 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[#111318] p-5 animate-pulse">
            <div className="h-4 w-24 bg-white/10 rounded-full mb-4" />
            <div className="h-7 w-64 bg-white/10 rounded-full mb-3" />
            <div className="h-4 w-48 bg-white/10 rounded-full" />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-[24px] border border-white/10 bg-[#111111] overflow-hidden animate-pulse">
                <div className="h-36 bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                  <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
        <section className="rounded-[28px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(135deg,#131825,#090c12)] p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 mb-3">
            <Sparkles size={13} />
            Home
              </div>
              <h1 className="font-black text-2xl leading-tight max-w-2xl">
                {activeAppCount > 0 ? 'Welcome back.' : 'Find something worth joining.'}
              </h1>
              <p className="text-olu-muted text-sm mt-2 max-w-2xl leading-relaxed">
                {activeAppCount > 0
                  ? 'Jump back into what you joined.'
                  : 'Explore creators, communities, and academies.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Joined', value: formatNumber(activeAppCount) },
                { label: 'Communities', value: formatNumber(joinedCommunities.length) },
                { label: 'Academies', value: formatNumber(purchasedCourses.length) },
              ].map((item) => (
                <div key={item.label} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <span className="font-semibold text-sm">{item.value}</span>
                  <span className="ml-2 text-xs text-white/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {purchasedCourses.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Academy</p>
                <h2 className="font-bold text-2xl">Continue learning</h2>
              </div>
              <button onClick={() => navigate('/learning')} className="text-sm text-white/72 hover:text-white transition-colors">
                Open learning hub
              </button>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              {purchasedCourses.slice(0, 2).map((course) => {
                const progress = progressBySlug[course.slug] || []
                const summary = computeCourseProgress(course, progress)
                return (
                  <ContinueCourseCard
                    key={course.id}
                    course={course}
                    progress={progress}
                    onOpen={() => navigate(`/learn/${course.slug}/${summary.nextSection?.id || course.sections[0]?.id}`)}
                  />
                )
              })}
            </div>
          </section>
        ) : null}

        {joinedCommunities.length > 0 ? (
          <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Community</p>
                <h2 className="font-bold text-xl">Your communities</h2>
              </div>
              <Users size={18} className="text-sky-300" />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {joinedCommunities.slice(0, 3).map(({ creator, tierName }) => (
                <button
                  key={creator.id}
                  onClick={() => navigate(communityCardsById.get(creator.id)?.href || `/communities/${creator.id}`)}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/8 transition-colors"
                >
                  {(() => {
                    const communityApp = communityCardsById.get(creator.id)
                    return (
                  <AppCover
                    src={communityApp?.cover_img || creator.cover_img}
                    alt={`${creator.name} community`}
                    gradient={creator.avatar_color || 'from-fuchsia-700 via-rose-600 to-orange-500'}
                    eyebrow="Community"
                    title={communityApp?.title || `${creator.name} Community`}
                    subtitle={communityApp?.summary || creator.bio || 'Member updates, private topics, and recurring drops.'}
                  />
                    )
                  })()}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300">{tierName}</span>
                      <span className="text-xs text-olu-muted">{formatNumber(creator.followers || 0)} followers</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Member updates', 'Private topics', 'Live sessions'].map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                          {item}
                        </span>
                      ))}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/72">
                      Open community
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Updates</p>
                <h2 className="font-bold text-xl">New for you</h2>
              </div>
              <Flame size={18} className="text-orange-300" />
            </div>
            <div className="space-y-3">
              {relatedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/content/${post.id}`)}
                  className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/8 transition-colors"
                >
                  <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${post.gradient_bg || 'from-slate-700 to-slate-900'}`}>
                    {post.cover_img && !brokenPostCovers[post.id] ? (
                      <img
                        src={post.cover_img}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        onError={() => setBrokenPostCovers((current) => ({ ...current, [post.id]: true }))}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">{post.creator?.name || 'Community host'}</p>
                        <p className="mt-1 font-semibold text-white">{post.title}</p>
                      </div>
                      {post.locked ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-amber-500/15 text-amber-300 text-xs"><Lock size={12} /> Members</span> : null}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/72 line-clamp-2">{post.preview}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Recommended communities</p>
                <h2 className="font-bold text-xl">Find a new community</h2>
              </div>
              <Crown size={18} className="text-amber-300" />
            </div>
            <div className="space-y-3">
              {recommendedCommunities.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => navigate(communityCardsById.get(creator.id)?.href || `/communities/${creator.id}`)}
                  className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/8 transition-colors"
                >
                  {(() => {
                    const communityApp = communityCardsById.get(creator.id)
                    return (
                  <AppCover
                    src={communityApp?.cover_img || creator.cover_img}
                    alt={`${creator.name} community`}
                    gradient={creator.avatar_color || 'from-fuchsia-700 via-rose-600 to-orange-500'}
                    eyebrow="Community"
                    title={communityApp?.title || `${creator.name} Community`}
                    subtitle={communityApp?.summary || creator.bio || 'Membership, access, and recurring updates.'}
                  />
                    )
                  })()}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {['Weekly drops', 'Private Q&A', 'Community chat'].map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
              {!loading && recommendedCommunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
                  No new communities to suggest right now.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Recommended academies</p>
                <h2 className="font-bold text-xl">Pick your next academy</h2>
              </div>
              <BookOpen size={18} className="text-emerald-300" />
            </div>
            <div className="space-y-3">
              {recommendedAcademyCards.map((academyApp) => {
                const host = creatorByName.get(academyApp.owner_name)
                return (
                  <button
                    key={academyApp.id}
                    onClick={() => navigate(academyApp.href)}
                    className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:bg-white/8 transition-colors"
                  >
                    <AppCover
                      src={academyApp.cover_img || host?.cover_img}
                      alt={`${academyApp.title} academy`}
                      gradient="from-sky-500 via-cyan-500 to-emerald-400"
                      eyebrow="Academy"
                      title={academyApp.title}
                      subtitle={academyApp.summary || academyApp.owner_name}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-white/72 line-clamp-2">{academyApp.summary}</p>
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-300">{academyApp.price_label}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {academyApp.highlights.slice(0, 2).map((item) => (
                          <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
              {!loading && recommendedAcademies.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
                  No new academy apps to suggest right now.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
