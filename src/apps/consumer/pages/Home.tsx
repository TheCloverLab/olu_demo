import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, BookOpen, ChevronRight, Crown, Flame, GraduationCap, Lock, MessageCircle, PlayCircle, Search, Sparkles, Users } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { getCommunityMembershipSnapshot, getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { getCreators, getPosts } from '../../../services/api'
import { CONSUMER_TEMPLATE_META } from '../templateConfig'
import type { User } from '../../../lib/supabase'
import type { Course } from '../courseData'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function CommunityHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { consumerExperience } = useApp()
  const community = consumerExperience.community
  const [creators, setCreators] = useState<User[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [membershipTiers, setMembershipTiers] = useState(community.membership.tiers)
  const [memberStats, setMemberStats] = useState<{ totalMembers: number; activeFans: number; hostName?: string }>({
    totalMembers: 0,
    activeFans: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [creatorsData, postsData] = await Promise.all([getCreators(), getPosts(12)])
        setCreators(creatorsData)
        setPosts(postsData)
      } catch (error) {
        console.error('Error loading community home:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMembershipSnapshot() {
      try {
        const snapshot = await getCommunityMembershipSnapshot(user as any)
        if (!cancelled) {
          setMembershipTiers(snapshot.tiers)
          setMemberStats({
            totalMembers: snapshot.totalMembers,
            activeFans: snapshot.activeFans,
            hostName: snapshot.creator?.name,
          })
        }
      } catch (error) {
        console.error('Failed to load membership snapshot', error)
      }
    }

    loadMembershipSnapshot()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const featuredCreators = creators.slice(0, 4)
  const featuredPosts = posts.slice(0, 5)

  return (
    <div className="pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        <section className="rounded-[28px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.18),transparent_34%),linear-gradient(135deg,#18111b,#0c0a10)] p-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 mb-4">
            <Users size={13} />
            {community.hero.eyebrow}
          </div>
          <h1 className="font-black text-3xl leading-tight max-w-xl">{community.hero.title}</h1>
          <p className="text-olu-muted text-sm mt-3 max-w-xl leading-relaxed">
            {community.hero.description}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {community.hero.stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="font-black text-2xl">{item.value}</p>
                <p className="text-xs text-white/60 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-[1.15fr,0.85fr] gap-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Membership</p>
                <h2 className="font-bold text-xl">{community.membership.title}</h2>
              </div>
              <Crown size={18} className="text-amber-300" />
            </div>
            <div className="space-y-3">
              {membershipTiers.map((item, index) => (
                <div key={item.name} className={clsx('rounded-2xl p-4 border', index === 1 ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10')}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="font-black">{item.price}</p>
                  </div>
                  <p className={clsx('text-sm', index === 1 ? 'text-black/70' : 'text-olu-muted')}>{item.note}</p>
                </div>
              ))}
            </div>
            {memberStats.totalMembers > 0 && (
              <p className="text-xs text-olu-muted mt-3">
                {formatNumber(memberStats.totalMembers)} paid/free members
                {memberStats.activeFans > 0 ? ` · ${formatNumber(memberStats.activeFans)} active fans` : ''}
              </p>
            )}
            <button
              onClick={() => navigate('/membership')}
              className="mt-4 w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {community.membership.ctaLabel}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Topics</p>
                <h2 className="font-bold text-xl">{community.topics.title}</h2>
              </div>
              <MessageCircle size={18} className="text-sky-300" />
            </div>
            <div className="space-y-3">
              {community.topics.entries.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate('/topics')}
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm">{topic.name}</p>
                    <ChevronRight size={14} className="text-olu-muted" />
                  </div>
                  <p className="text-xs text-olu-muted mt-1">{topic.members} members</p>
                  <p className="text-sm text-white/72 mt-2">{topic.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Creator spaces</p>
                <h2 className="font-bold text-xl">{community.spaces.title}</h2>
                {memberStats.hostName && <p className="text-xs text-olu-muted mt-1">Hosted by {memberStats.hostName}</p>}
              </div>
            <button onClick={() => navigate('/topics')} className="text-sm text-white/72 hover:text-white transition-colors">
              View all
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredCreators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden text-left hover:bg-white/8 transition-colors"
              >
                <div className={`h-28 bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'}`}>
                  {creator.cover_img && <img src={creator.cover_img} alt={creator.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="font-semibold text-sm">{creator.name}</p>
                    {creator.verified && <BadgeCheck size={13} className="text-sky-400" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-olu-muted line-clamp-2">{creator.bio}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Feed</p>
              <h2 className="font-bold text-xl">{community.feed.title}</h2>
            </div>
            <Flame size={18} className="text-orange-300" />
          </div>
          <p className="text-sm text-olu-muted mb-4">{community.feed.subtitle}</p>
          {loading ? (
            <div className="text-olu-muted py-6 text-sm">Loading community feed...</div>
          ) : (
            <div className="space-y-3">
              {featuredPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/content/${post.id}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{post.title}</p>
                      <p className="text-xs text-olu-muted mt-1">{post.creator?.name || 'Community host'} · {post.type}</p>
                    </div>
                    {post.locked && <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-amber-500/15 text-amber-300 text-xs"><Lock size={12} /> Members</span>}
                  </div>
                  <p className="text-sm text-white/72 mt-3 line-clamp-2">{post.preview}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="rounded-[24px] overflow-hidden border border-white/10 bg-[#111111] text-left hover:-translate-y-0.5 transition-all"
    >
      <div className={`h-40 bg-gradient-to-br ${course.hero} p-5 flex flex-col justify-between`}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs font-medium text-black/75">
          <GraduationCap size={13} />
          {course.level}
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
            <p className="font-bold text-sm">{course.stats.lessons}</p>
            <p className="text-[11px] text-olu-muted">Lessons</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
            <p className="font-bold text-sm">{formatNumber(course.stats.students)}</p>
            <p className="text-[11px] text-olu-muted">Students</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
            <p className="font-bold text-sm">{course.stats.completionRate}</p>
            <p className="text-[11px] text-olu-muted">Completion</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="font-black text-xl">${course.price}</p>
          <span className="inline-flex items-center gap-2 text-sm text-white/72">
            View course
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </button>
  )
}

function CoursesHome() {
  const navigate = useNavigate()
  const { consumerExperience } = useApp()
  const courses = consumerExperience.courses
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      const snapshot = await getCourseLibrarySnapshot()
      if (!cancelled) {
        setCourseLibrary(snapshot.courses)
        setFeaturedCourse(snapshot.featuredCourse)
      }
    }

    loadCourses()
    return () => {
      cancelled = true
    }
  }, [])

  const heroCourse = featuredCourse || courseLibrary[0]

  return (
    <div className="pb-24 md:pb-6">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
        <section className={`rounded-[28px] overflow-hidden border border-white/10 bg-gradient-to-br ${heroCourse?.hero || 'from-sky-600 via-cyan-500 to-emerald-400'} p-6 md:p-8`}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-xs text-black/70 mb-4">
              <BookOpen size={13} />
              {courses.catalog.title}
            </div>
            <h1 className="font-black text-4xl leading-tight text-black max-w-xl">{heroCourse?.headline || 'Build and sell a structured course offer.'}</h1>
            <p className="text-black/70 text-base mt-4 max-w-xl leading-relaxed">{heroCourse?.description || 'Use a course catalog, checkout flow, and learning hub to deliver structured knowledge.'}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => heroCourse && navigate(`/checkout/${heroCourse.slug}`)}
                className="px-5 py-3 rounded-2xl bg-black text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {courses.detail.buyLabel}
              </button>
              <button
                onClick={() => heroCourse && navigate(`/courses/${heroCourse.slug}/catalog`)}
                className="px-5 py-3 rounded-2xl bg-white/70 text-black font-semibold hover:bg-white transition-colors"
              >
                {courses.detail.catalogLabel}
              </button>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-[1.1fr,0.9fr] gap-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Learning path</p>
                <h2 className="font-bold text-xl">Start, continue, complete</h2>
              </div>
              <PlayCircle size={18} className="text-emerald-300" />
            </div>
            <div className="space-y-3">
              {courses.learning.steps.map((step, index) => (
                <div key={step.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-black">{index + 1}</div>
                    <div>
                      <p className="font-semibold text-sm">{step.label}</p>
                      <p className="text-xs text-olu-muted mt-1">{step.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/learning')} className="mt-4 w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity">
              Open learning dashboard
            </button>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Search</p>
                <h2 className="font-bold text-xl">Find a course quickly</h2>
              </div>
              <Search size={18} className="text-sky-300" />
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
              <Search size={16} className="text-olu-muted" />
              <input
                placeholder="Search curriculum, outcomes, or instructor"
                className="bg-transparent flex-1 text-sm placeholder:text-olu-muted focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[...courses.learning.shortcuts, { label: 'Featured course', href: heroCourse ? `/courses/${heroCourse.slug}` : '/courses' }, { label: 'Checkout', href: heroCourse ? `/checkout/${heroCourse.slug}` : '/courses' }].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
                >
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-olu-muted mt-1">Open page</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-1">Catalog</p>
              <h2 className="font-bold text-2xl">Featured courses</h2>
            </div>
            <button onClick={() => navigate('/courses')} className="text-sm text-white/72 hover:text-white transition-colors">
              Open full catalog
            </button>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            {courseLibrary.map((course) => (
              <CourseCard key={course.id} course={course} onOpen={() => navigate(`/courses/${course.slug}`)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default function Home() {
  const { consumerTemplate } = useApp()
  const templateMeta = CONSUMER_TEMPLATE_META[consumerTemplate]

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
          <Sparkles size={13} />
          {templateMeta.label}
        </div>
      </div>
      {consumerTemplate === 'sell_courses' ? <CoursesHome /> : <CommunityHome />}
    </div>
  )
}
