import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronRight, Crown, Flame, GraduationCap, Lock, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { computeCourseProgress, getMembershipStatus, getProgressForCourse, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { getCreators, getPosts } from '../../../services/api'
import type { ConsumerLessonProgress, User } from '../../../lib/supabase'
import type { Course } from '../courseData'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

type JoinedCommunity = {
  creator: User
  tierName: string
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
  const [purchasedSlugs, setPurchasedSlugs] = useState<string[]>([])
  const [progressBySlug, setProgressBySlug] = useState<Record<string, ConsumerLessonProgress[]>>({})
  const [memberships, setMemberships] = useState<Record<string, { tier_name: string }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadHome() {
      try {
        const [creatorsData, postsData, courseSnapshot] = await Promise.all([
          getCreators(),
          getPosts(16),
          getCourseLibrarySnapshot(),
        ])

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

  const recommendedCommunities = useMemo(() => {
    const joinedIds = new Set(joinedCommunities.map((item) => item.creator.id))
    return creators.filter((creator) => !joinedIds.has(creator.id)).slice(0, 3)
  }, [creators, joinedCommunities])

  const recommendedAcademies = useMemo(() => {
    const purchased = new Set(purchasedSlugs)
    return courseLibrary.filter((course) => !purchased.has(course.slug)).slice(0, 3)
  }, [courseLibrary, purchasedSlugs])

  const activeAppCount = joinedCommunities.length + purchasedCourses.length

  return (
    <div className="pb-24 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
        <section className="rounded-[28px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),linear-gradient(135deg,#131825,#090c12)] p-6 md:p-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 mb-4">
            <Sparkles size={13} />
            Home
          </div>
          <h1 className="font-black text-3xl leading-tight max-w-2xl">
            {activeAppCount > 0 ? 'Welcome back.' : 'Find something worth joining.'}
          </h1>
          <p className="text-olu-muted text-sm mt-3 max-w-2xl leading-relaxed">
            {activeAppCount > 0
              ? 'Your recent apps, access, and updates are all here.'
              : 'Explore creators, communities, and academies to build your app library.'}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Active apps', value: formatNumber(activeAppCount) },
              { label: 'Communities', value: formatNumber(joinedCommunities.length) },
              { label: 'Academies', value: formatNumber(purchasedCourses.length) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="font-black text-2xl">{item.value}</p>
                <p className="text-xs text-white/60 mt-1">{item.label}</p>
              </div>
            ))}
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
                  onClick={() => navigate(`/creator/${creator.id}`)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{creator.name} Inner Circle</p>
                      <p className="text-xs text-olu-muted mt-1">Community</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300">{tierName}</span>
                  </div>
                  <p className="text-sm text-white/72 line-clamp-2">{creator.bio || 'Open member spaces, new drops, and recurring discussions.'}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/72">
                    Open app
                    <ChevronRight size={15} />
                  </span>
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
                <h2 className="font-bold text-xl">New from your apps</h2>
              </div>
              <Flame size={18} className="text-orange-300" />
            </div>
            <div className="space-y-3">
              {relatedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/content/${post.id}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{post.title}</p>
                      <p className="text-xs text-olu-muted mt-1">{post.creator?.name || 'Community host'} · Community</p>
                    </div>
                    {post.locked ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-amber-500/15 text-amber-300 text-xs"><Lock size={12} /> Members</span> : null}
                  </div>
                  <p className="text-sm text-white/72 mt-3 line-clamp-2">{post.preview}</p>
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
                <h2 className="font-bold text-xl">Join another creator circle</h2>
              </div>
              <Crown size={18} className="text-amber-300" />
            </div>
            <div className="space-y-3">
              {recommendedCommunities.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => navigate(`/creator/${creator.id}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <p className="font-semibold text-sm">{creator.name} Inner Circle</p>
                  <p className="text-xs text-olu-muted mt-1">Community</p>
                  <p className="text-sm text-white/72 mt-2 line-clamp-2">{creator.bio || 'Membership, community access, and recurring updates.'}</p>
                </button>
              ))}
              {!loading && recommendedCommunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
                  No new community apps to suggest right now.
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
              {recommendedAcademies.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.slug}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{course.instructor} Academy</p>
                      <p className="text-xs text-olu-muted mt-1">{course.title}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-300">${course.price}</span>
                  </div>
                  <p className="text-sm text-white/72 mt-2 line-clamp-2">{course.subtitle}</p>
                </button>
              ))}
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
