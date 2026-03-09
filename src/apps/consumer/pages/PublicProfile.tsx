import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, BookOpen, Users } from 'lucide-react'
import { getPublicConsumerAppsForUser, getUserById } from '../../../services/api'
import type { ConsumerCourse, User } from '../../../lib/supabase'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

export default function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [creator, setCreator] = useState<User | null>(null)
  const [hasCommunity, setHasCommunity] = useState(false)
  const [courses, setCourses] = useState<ConsumerCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!id) return

      try {
        const [creatorData, publicApps] = await Promise.all([
          getUserById(id),
          getPublicConsumerAppsForUser(id),
        ])

        if (cancelled) return

        setCreator(creatorData)
        setHasCommunity(publicApps.hasCommunity)
        setCourses(publicApps.courses)
      } catch (error) {
        console.error('Failed to load public profile', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [id])

  const creatorApps = useMemo(() => {
    if (!creator) return []
    const communityApps = hasCommunity
      ? [{
          id: `community-${creator.id}`,
          type: 'Community',
          title: `${creator.name} Inner Circle`,
          subtitle: creator.bio || 'Membership, discussion, and recurring drops.',
          cta: 'Open community',
          href: `/communities/${creator.id}`,
        }]
      : []

    return [
      ...communityApps,
      ...courses.map((course) => ({
        id: `academy-${course.id}`,
        type: 'Academy',
        title: course.title,
        subtitle: course.subtitle,
        cta: 'Open academy',
        href: `/courses/${course.slug}`,
      })),
    ]
  }, [creator, courses, hasCommunity])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading profile...</div>
  }

  if (!creator) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Profile not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="px-4">
        <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-start gap-4">
            {creator.avatar_img ? (
              <img src={creator.avatar_img} alt={creator.name} className="w-18 h-18 rounded-2xl object-cover" />
            ) : (
              <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-xl text-white`}>
                {creator.initials || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-2xl">{creator.name}</h1>
                {creator.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
              </div>
              <p className="text-olu-muted text-sm mt-1">{creator.handle}</p>
              <p className="text-sm text-olu-muted mt-3 leading-relaxed">{creator.bio || 'No bio yet.'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(creator.followers || 0)}</span>
              <span className="ml-2 text-olu-muted">Followers</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(creatorApps.length)}</span>
              <span className="ml-2 text-olu-muted">Open apps</span>
            </div>
          </div>
        </section>

        {creatorApps.length > 0 ? (
          <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Apps</p>
                <p className="font-semibold text-base mt-1">Open with {creator.name}</p>
              </div>
              <Users size={18} className="text-white/45" />
            </div>

            <div className="space-y-3">
              {creatorApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => navigate(app.href)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{app.type}</p>
                      <p className="font-semibold text-sm mt-1">{app.title}</p>
                      <p className="text-xs text-olu-muted mt-1">{app.subtitle}</p>
                    </div>
                    <span className="text-xs text-white/65">{app.cta}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Profile</p>
            <p className="font-semibold text-base mt-1">No public communities or academies yet</p>
            <p className="text-sm text-olu-muted mt-2">
              {creator.name} does not have any public apps open right now.
            </p>
          </section>
        )}

        {courses.length > 0 ? (
          <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Academy</p>
                <p className="font-semibold text-base mt-1">Courses by {creator.name}</p>
              </div>
              <BookOpen size={18} className="text-white/45" />
            </div>
            <div className="space-y-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.slug}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{course.title}</p>
                      <p className="text-xs text-olu-muted mt-1">{course.subtitle}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-300">${Number(course.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
