import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, BookOpen, CreditCard, Settings, Share2, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useApp } from '../../../context/AppContext'
import { getCommunityMembershipSnapshot, getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { computeCourseProgress, getMembershipStatus, getProgressForCourse, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

export default function Profile() {
  const { user } = useAuth()
  const { consumerConfig, consumerTemplate } = useApp()
  const navigate = useNavigate()
  const [membershipName, setMembershipName] = useState<string | null>(null)
  const [communitySummary, setCommunitySummary] = useState({
    creatorName: '',
    activeFans: 0,
    totalMembers: 0,
  })
  const [learningSummary, setLearningSummary] = useState({
    purchasedCount: 0,
    featuredCourseTitle: '',
    featuredProgressLabel: 'No learning activity yet.',
  })

  useEffect(() => {
    let cancelled = false

    async function loadConsumerSummary() {
      if (!user?.id) return

      if (consumerTemplate === 'fan_community') {
        try {
          const snapshot = await getCommunityMembershipSnapshot(user as any, consumerConfig.featured_creator_id)
          const status = snapshot.creator?.id
            ? await getMembershipStatus(user as any, snapshot.creator.id)
            : null

          if (!cancelled) {
            setMembershipName(status?.tier_name || null)
            setCommunitySummary({
              creatorName: snapshot.creator?.name || 'Community',
              activeFans: snapshot.activeFans,
              totalMembers: snapshot.totalMembers,
            })
            setLearningSummary({
              purchasedCount: 0,
              featuredCourseTitle: '',
              featuredProgressLabel: 'No learning activity yet.',
            })
          }
        } catch (error) {
          console.error('Failed to load community summary', error)
        }
        return
      }

      try {
        const snapshot = await getCourseLibrarySnapshot(consumerConfig.featured_course_slug)
        const purchasedSlugs = await getPurchasedCourseSlugs(user as any, snapshot.courses)
        const featuredCourse = snapshot.featuredCourse
        let featuredProgressLabel = purchasedSlugs.length > 0
          ? `${purchasedSlugs.length} course${purchasedSlugs.length > 1 ? 's' : ''} in your library`
          : 'No courses purchased yet.'

        if (featuredCourse && purchasedSlugs.includes(featuredCourse.slug)) {
          const progress = await getProgressForCourse(user as any, featuredCourse)
          const summary = computeCourseProgress(featuredCourse, progress)
          featuredProgressLabel = `${summary.completedCount}/${featuredCourse.sections.length} lessons completed`
        }

        if (!cancelled) {
          setLearningSummary({
            purchasedCount: purchasedSlugs.length,
            featuredCourseTitle: featuredCourse?.title || 'Course app',
            featuredProgressLabel,
          })
          setMembershipName(null)
          setCommunitySummary({
            creatorName: '',
            activeFans: 0,
            totalMembers: 0,
          })
        }
      } catch (error) {
        console.error('Failed to load learning summary', error)
      }
    }

    loadConsumerSummary()
    return () => {
      cancelled = true
    }
  }, [consumerConfig.featured_course_slug, consumerConfig.featured_creator_id, consumerTemplate, user?.id])

  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Loading profile...</div>
  }

  const accessCards = consumerTemplate === 'fan_community'
    ? [
        {
          icon: Sparkles,
          title: membershipName ? `${membershipName} member` : 'Membership access',
          description: membershipName
            ? `You currently have access to ${communitySummary.creatorName}'s member spaces.`
            : 'You are browsing the app as a visitor. Upgrade to unlock member-only circles and posts.',
          ctaLabel: membershipName ? 'Open topics' : 'Open membership',
          ctaHref: membershipName ? '/topics' : '/membership',
        },
        {
          icon: Users,
          title: 'Community pulse',
          description: `${formatNumber(communitySummary.activeFans)} active fans across ${formatNumber(communitySummary.totalMembers)} total members.`,
          ctaLabel: 'Browse community',
          ctaHref: '/',
        },
      ]
    : [
        {
          icon: BookOpen,
          title: learningSummary.purchasedCount > 0 ? 'My learning' : 'Course access',
          description: learningSummary.featuredProgressLabel,
          ctaLabel: learningSummary.purchasedCount > 0 ? 'Continue learning' : 'Browse catalog',
          ctaHref: learningSummary.purchasedCount > 0 ? '/learning' : '/courses',
        },
        {
          icon: CreditCard,
          title: 'Library status',
          description: learningSummary.purchasedCount > 0
            ? `${learningSummary.purchasedCount} purchased course${learningSummary.purchasedCount > 1 ? 's' : ''} in this app.`
            : `${learningSummary.featuredCourseTitle} is ready to purchase when you want structured lessons.`,
          ctaLabel: learningSummary.purchasedCount > 0 ? 'View library' : 'Open checkout',
          ctaHref: learningSummary.purchasedCount > 0 ? '/learning' : '/courses',
        },
      ]

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="h-36 bg-[#1a1a1a] relative mx-4 mt-4 rounded-2xl overflow-hidden">
        {user.cover_img && <img src={user.cover_img} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-olu-bg/80 to-transparent" />
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          {user.avatar_img ? (
            <img src={user.avatar_img} alt={user.name} className="w-[72px] h-[72px] rounded-2xl object-cover border-4 border-olu-bg" />
          ) : (
            <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${user.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg`}>
              {user.initials || 'U'}
            </div>
          )}
          <div className="flex gap-2 mb-1">
            <button className="p-2 rounded-xl glass glass-hover"><Share2 size={16} className="text-olu-muted" /></button>
            <button className="p-2 rounded-xl glass glass-hover" onClick={() => navigate('/settings')}><Settings size={16} className="text-olu-muted" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-black text-xl">{user.name}</h1>
          {user.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-sm mb-2">{user.handle}</p>
        <p className="text-sm text-olu-muted mb-4 leading-relaxed">{user.bio || 'No bio yet.'}</p>

        <div className="flex gap-6 mb-5">
          {[
            { val: formatNumber(user.followers), label: 'Followers' },
            { val: formatNumber(user.following), label: 'Following' },
            { val: formatNumber(user.posts), label: 'Posts' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-bold text-base">{s.val}</p>
              <p className="text-olu-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-4 mb-5">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">My Access</p>
            <p className="font-semibold text-sm mt-1">
              {consumerTemplate === 'fan_community' ? 'Community app' : 'Course app'}
            </p>
            <p className="text-xs text-olu-muted mt-1">
              {consumerTemplate === 'fan_community'
                ? 'Your membership, circles, and current access live here.'
                : 'Your purchases, progress, and next learning step live here.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {accessCards.map(({ icon: Icon, title, description, ctaLabel, ctaHref }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-2xl bg-white/8 p-2 text-white/80">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-olu-muted leading-relaxed mt-1">{description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(ctaHref)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
                  >
                    {ctaLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
