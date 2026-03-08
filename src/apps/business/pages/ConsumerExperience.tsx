import { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, Crown, ExternalLink, MessageCircle, PanelsTopLeft, Sparkles, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import {
  getCommunityMembershipSnapshot,
  getCourseLibrarySnapshot,
  type CommunityMembershipSnapshot,
} from '../../../domain/consumer/api'
import type { Course } from '../../consumer/courseData'
import { CONSUMER_TEMPLATE_META } from '../../consumer/templateConfig'

export default function ConsumerExperience() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { consumerConfig, consumerExperience, consumerTemplate } = useApp()
  const templateMeta = CONSUMER_TEMPLATE_META[consumerTemplate]
  const [communitySnapshot, setCommunitySnapshot] = useState<CommunityMembershipSnapshot | null>(null)
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadConsumerSurface() {
      setLoading(true)
      try {
        if (consumerTemplate === 'fan_community') {
          const snapshot = await getCommunityMembershipSnapshot(user as any, consumerConfig.featured_creator_id)
          if (!cancelled) {
            setCommunitySnapshot(snapshot)
            setCourseLibrary([])
            setFeaturedCourse(null)
          }
          return
        }

        const snapshot = await getCourseLibrarySnapshot(consumerConfig.featured_course_slug)
        if (!cancelled) {
          setCourseLibrary(snapshot.courses)
          setFeaturedCourse(snapshot.featuredCourse)
          setCommunitySnapshot(null)
        }
      } catch (error) {
        console.error('Failed to load consumer experience', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadConsumerSurface()
    return () => {
      cancelled = true
    }
  }, [consumerConfig.featured_creator_id, consumerConfig.featured_course_slug, consumerTemplate, user?.id])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="grid lg:grid-cols-[1.2fr,0.8fr] gap-4">
        <div className="rounded-3xl p-6 md:p-7 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 text-xs text-cyan-100/70 mb-4">
            <PanelsTopLeft size={14} />
            Consumer channel
          </div>
          <h1 className="font-black text-3xl leading-tight max-w-2xl">
            Operate the public-facing {templateMeta.label.toLowerCase()} without leaving the business workspace.
          </h1>
          <p className="text-olu-muted text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
            This page is the operator view for your consumer product. It shows what the storefront is configured to highlight right now and where to go next to tune it.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Template</p>
              <p className="font-semibold text-sm">{templateMeta.label}</p>
              <p className="text-cyan-100/50 text-xs mt-1">{templateMeta.shortLabel}</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Featured creator</p>
              <p className="font-semibold text-sm">{communitySnapshot?.creator?.name || 'Not set'}</p>
              <p className="text-cyan-100/50 text-xs mt-1">From workspace config</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Featured course</p>
              <p className="font-semibold text-sm">{featuredCourse?.title || 'Not set'}</p>
              <p className="text-cyan-100/50 text-xs mt-1">Used by storefront hero</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Active headline</p>
              <p className="font-semibold text-sm">
                {consumerTemplate === 'fan_community'
                  ? consumerExperience.community.hero.title
                  : consumerExperience.courses.storefront.title}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Active supporting copy</p>
              <p className="text-sm text-cyan-100/70 line-clamp-3">
                {consumerTemplate === 'fan_community'
                  ? consumerExperience.community.hero.description
                  : consumerExperience.courses.storefront.description}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#0a1525] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-300">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-bold">Operator shortcuts</p>
              <p className="text-olu-muted text-xs">Move between config, preview, and consumer surface</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/business/settings')}
            className="w-full rounded-2xl bg-white text-black px-4 py-3 text-left font-semibold hover:opacity-90 transition-opacity"
          >
            Open consumer settings
          </button>
          <button
            onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
            className="w-full rounded-2xl bg-[#0d1726] border border-cyan-500/10 px-4 py-3 text-left hover:bg-[#12213a] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Open consumer app</p>
                <p className="text-cyan-100/55 text-xs mt-1">Preview the active template in a new tab</p>
              </div>
              <ExternalLink size={16} className="text-cyan-200" />
            </div>
          </button>
          <div className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4 text-sm text-cyan-100/70">
            Consumer routing is already template-aware. The remaining product work is moving more content controls from static seeds into editable merchant data.
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422] text-cyan-100/60">
          Loading consumer channel...
        </div>
      ) : consumerTemplate === 'fan_community' ? (
        <section className="grid lg:grid-cols-[1fr,1fr] gap-4">
          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} className="text-amber-300" />
              <p className="font-bold">Membership surface</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{communitySnapshot?.tiers.length || 0}</p>
                <p className="text-xs text-olu-muted mt-1">Configured tiers</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{communitySnapshot?.totalMembers || 0}</p>
                <p className="text-xs text-olu-muted mt-1">Total members</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{communitySnapshot?.activeFans || 0}</p>
                <p className="text-xs text-olu-muted mt-1">Active fans</p>
              </div>
            </div>
            <div className="space-y-3">
              {(communitySnapshot?.tiers || []).map((tier) => (
                <div key={tier.key} className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{tier.name}</p>
                    <p className="text-sm text-cyan-100/75">{tier.price}</p>
                  </div>
                  <p className="text-sm text-cyan-100/55 mt-2">{tier.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={16} className="text-sky-300" />
              <p className="font-bold">Community publishing checklist</p>
            </div>
            <div className="space-y-3">
              {[
                communitySnapshot?.creator?.name
                  ? `Featured creator is set to ${communitySnapshot.creator.name}.`
                  : 'Featured creator still needs to be selected.',
                (communitySnapshot?.tiers.length || 0) > 0
                  ? 'Membership tiers are available on the consumer app.'
                  : 'Membership tiers still need to be configured.',
                'Topics and feed are still partly seed-driven and should become merchant-editable next.',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4 text-sm text-olu-muted">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-emerald-300" />
              <p className="font-bold">Course storefront</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{courseLibrary.length}</p>
                <p className="text-xs text-olu-muted mt-1">Published courses</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{featuredCourse?.stats.lessons || 0}</p>
                <p className="text-xs text-olu-muted mt-1">Featured lessons</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-2xl font-black">{featuredCourse?.stats.students || 0}</p>
                <p className="text-xs text-olu-muted mt-1">Featured students</p>
              </div>
            </div>
            <div className="space-y-3">
              {courseLibrary.map((course) => (
                <div key={course.id} className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="text-xs text-cyan-100/55 mt-1">{course.instructor} · {course.level}</p>
                    </div>
                    <span className="text-sm text-cyan-100/75">${course.price}</span>
                  </div>
                  <p className="text-sm text-cyan-100/55 mt-2">{course.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-cyan-300" />
              <p className="font-bold">Launch checklist</p>
            </div>
            <div className="space-y-3">
              {[
                featuredCourse
                  ? `Hero course is set to ${featuredCourse.title}.`
                  : 'Featured course still needs to be selected.',
                courseLibrary.length > 0
                  ? `${courseLibrary.length} course entries are visible in the catalog.`
                  : 'No course entries are published yet.',
                'Checkout and learning progress are live; payment gateway integration can stay behind MVP.',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4 text-sm text-olu-muted">
                  {item}
                </div>
              ))}
            </div>
            <Link
              to="/business/settings"
              className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white transition-colors"
            >
              Tune storefront settings
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
