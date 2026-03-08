import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, BookOpen, Clock3, ExternalLink, Settings, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { computeCourseProgress, getMembershipStatus, getProgressForCourse, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getCreators } from '../../../services/api'
import type { ConsumerLessonProgress, User } from '../../../lib/supabase'
import type { Course } from '../courseData'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

type JoinedCommunity = {
  creator: User
  tierName: string
}

type LearningItem = {
  course: Course
  progress: ConsumerLessonProgress[]
}

export default function UserCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creators, setCreators] = useState<User[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunity[]>([])
  const [learningItems, setLearningItems] = useState<LearningItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadMe() {
      if (!user?.id) return

      try {
        const [allCreators, courseSnapshot] = await Promise.all([
          getCreators(),
          getCourseLibrarySnapshot(),
        ])

        const [membershipEntries, purchasedSlugs] = await Promise.all([
          Promise.all(
            allCreators.map(async (creator) => {
              const membership = await getMembershipStatus(user as any, creator.id).catch(() => null)
              return [creator, membership] as const
            }),
          ),
          getPurchasedCourseSlugs(user as any, courseSnapshot.courses).catch(() => []),
        ])

        const purchasedCourses = courseSnapshot.courses.filter((course) => purchasedSlugs.includes(course.slug))
        const progressEntries = await Promise.all(
          purchasedCourses.map(async (course) => ({
            course,
            progress: await getProgressForCourse(user as any, course).catch(() => []),
          })),
        )

        if (cancelled) return

        setCreators(allCreators)
        setJoinedCommunities(
          membershipEntries
            .filter(([, membership]) => !!membership?.tier_name)
            .map(([creator, membership]) => ({
              creator,
              tierName: membership!.tier_name,
            })),
        )
        setLearningItems(progressEntries)
      } catch (error) {
        console.error('Failed to load me', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMe()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const recentActions = useMemo(() => {
    const communityActions = joinedCommunities.slice(0, 2).map((item) => ({
      id: `community-${item.creator.id}`,
      title: item.creator.name,
      detail: `${item.tierName} member`,
      cta: 'Open community',
      href: `/communities/${item.creator.id}`,
      icon: Users,
    }))

    const academyActions = learningItems.slice(0, 2).map((item) => {
      const summary = computeCourseProgress(item.course, item.progress)
      return {
        id: `course-${item.course.id}`,
        title: item.course.title,
        detail: `${summary.completedCount}/${item.course.sections.length} lessons completed`,
        cta: 'Continue',
        href: `/learn/${item.course.slug}/${summary.nextSection?.id || item.course.sections[0]?.id}`,
        icon: BookOpen,
      }
    })

    return [...communityActions, ...academyActions].slice(0, 4)
  }, [joinedCommunities, learningItems])

  if (!user) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading profile...</div>
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4">
        <div className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {user.avatar_img ? (
                <img src={user.avatar_img} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${user.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-xl text-white`}>
                  {user.initials || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-xl">{user.name}</h1>
                  {user.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
                </div>
                <p className="text-olu-muted text-sm mt-1">{user.handle}</p>
                <p className="text-sm text-olu-muted mt-2">Your memberships, learning, and account settings.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-xl glass glass-hover" onClick={() => navigate('/settings')}><Settings size={16} className="text-olu-muted" /></button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(joinedCommunities.length)}</span>
              <span className="ml-2 text-olu-muted">Memberships</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(learningItems.length)}</span>
              <span className="ml-2 text-olu-muted">Learning</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(recentActions.length)}</span>
              <span className="ml-2 text-olu-muted">Recent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-5">
        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Account</p>
              <p className="font-semibold text-base mt-1">Memberships, learning, and settings</p>
            </div>
            <Sparkles size={18} className="text-white/45" />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate(joinedCommunities.length > 0 ? `/communities/${joinedCommunities[0].creator.id}` : '/discover')}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
            >
              <p className="font-semibold text-sm">Memberships</p>
              <p className="text-xs text-olu-muted mt-1">
                {joinedCommunities.length > 0
                  ? `${joinedCommunities.length} active, latest in ${joinedCommunities[0].creator.name}.`
                  : 'No active memberships yet.'}
              </p>
            </button>
            <button
              onClick={() => navigate(learningItems.length > 0 ? '/learning' : '/discover')}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
            >
              <p className="font-semibold text-sm">Learning</p>
              <p className="text-xs text-olu-muted mt-1">
                {learningItems.length > 0
                  ? `${learningItems.length} academy${learningItems.length > 1 ? 'ies' : ''} in progress.`
                  : 'No academy progress yet.'}
              </p>
            </button>
            <button
              onClick={() => navigate(`/people/${user.id}`)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-sm">Public profile</p>
                <ExternalLink size={14} className="text-white/45" />
              </div>
              <p className="text-xs text-olu-muted mt-1">
                See the public page other people can open.
              </p>
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Billing</p>
              <p className="font-semibold text-base mt-1">Subscriptions & account settings</p>
            </div>
            <Settings size={18} className="text-white/45" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={() => navigate(joinedCommunities.length > 0 ? `/membership` : '/discover')}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
            >
              <p className="font-semibold text-sm">Subscriptions</p>
              <p className="text-xs text-olu-muted mt-1">
                Review active memberships and renew what you want to keep.
              </p>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
            >
              <p className="font-semibold text-sm">Settings</p>
              <p className="text-xs text-olu-muted mt-1">
                Manage your profile, sign-in, and workspace access.
              </p>
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Joined</p>
              <p className="font-semibold text-base mt-1">Your communities</p>
            </div>
            <Users size={18} className="text-white/45" />
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="space-y-3">
              {joinedCommunities.map(({ creator, tierName }) => (
                <button
                  key={creator.id}
                  onClick={() => navigate(`/communities/${creator.id}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{creator.name} Inner Circle</p>
                      <p className="text-xs text-olu-muted mt-1">{creator.bio || 'Community updates and private discussions.'}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300">{tierName}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
              You have not joined any communities yet.
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Learning</p>
              <p className="font-semibold text-base mt-1">Academies in progress</p>
            </div>
            <BookOpen size={18} className="text-white/45" />
          </div>

          {learningItems.length > 0 ? (
            <div className="space-y-3">
              {learningItems.map(({ course, progress }) => {
                const summary = computeCourseProgress(course, progress)
                return (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/learn/${course.slug}/${summary.nextSection?.id || course.sections[0]?.id}`)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{course.title}</p>
                        <p className="text-xs text-olu-muted mt-1">{summary.completedCount}/{course.sections.length} lessons completed</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-300">{summary.percent}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
              No academy activity yet.
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Recent</p>
              <p className="font-semibold text-base mt-1">Jump back in</p>
            </div>
            <Clock3 size={18} className="text-white/45" />
          </div>

          {recentActions.length > 0 ? (
            <div className="space-y-3">
              {recentActions.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-2xl bg-white/8 p-2 text-white/80">
                          <Icon size={16} />
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-olu-muted mt-1">{item.detail}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/65">{item.cta}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
              Nothing recent yet. Start in Discover.
            </div>
          )}
        </section>
      </div>

      {loading ? (
        <div className="px-4 mt-4 text-sm text-olu-muted">Updating your memberships and learning…</div>
      ) : null}
    </div>
  )
}
