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
import { createConsumerCourse, createConsumerCourseSection, createPost, getPostsByCreator, updateConsumerCourse, updateConsumerCourseSection, updateMembershipTier, updatePost } from '../../../services/api'
import type { Course } from '../../consumer/courseData'
import { CONSUMER_TEMPLATE_META } from '../../consumer/templateConfig'
import type { ConsumerCourse, Post } from '../../../lib/supabase'

export default function ConsumerExperience() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { consumerConfig, consumerExperience, consumerTemplate } = useApp()
  const templateMeta = CONSUMER_TEMPLATE_META[consumerTemplate]
  const [communitySnapshot, setCommunitySnapshot] = useState<CommunityMembershipSnapshot | null>(null)
  const [communityPosts, setCommunityPosts] = useState<Post[]>([])
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null)
  const [courseDraft, setCourseDraft] = useState({
    title: '',
    subtitle: '',
    headline: '',
    description: '',
    status: 'published' as ConsumerCourse['status'],
  })
  const [sectionDrafts, setSectionDrafts] = useState<Array<{
    id: string
    title: string
    summary: string
    preview: boolean
    duration: string
  }>>([])
  const [tierDrafts, setTierDrafts] = useState<Array<{
    id: string
    key: string
    name: string
    price: string
    note: string
    perksText: string
  }>>([])
  const [postDrafts, setPostDrafts] = useState<Array<{
    id: string
    title: string
    preview: string
    locked: boolean
  }>>([])
  const [savingCourse, setSavingCourse] = useState(false)
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null)
  const [savingTierId, setSavingTierId] = useState<string | null>(null)
  const [savingPostId, setSavingPostId] = useState<string | null>(null)
  const [creatingPost, setCreatingPost] = useState(false)
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadConsumerSurface() {
      setLoading(true)
      try {
        if (consumerTemplate === 'fan_community') {
          const snapshot = await getCommunityMembershipSnapshot(user as any, consumerConfig.featured_creator_id)
          const posts = snapshot.creator?.id
            ? await getPostsByCreator(snapshot.creator.id).catch(() => [] as Post[])
            : []
          if (!cancelled) {
            setCommunitySnapshot(snapshot)
            setCommunityPosts(posts)
            setTierDrafts(
              snapshot.tiers.map((tier) => ({
                id: tier.key,
                key: tier.key,
                name: tier.name,
                price: tier.price.replace('$', ''),
                note: tier.note,
                perksText: tier.perks.join('\n'),
              }))
            )
            setPostDrafts(
              posts.slice(0, 4).map((post) => ({
                id: post.id,
                title: post.title,
                preview: post.preview || '',
                locked: post.locked,
              }))
            )
            setCourseLibrary([])
            setFeaturedCourse(null)
          }
          return
        }

        const snapshot = await getCourseLibrarySnapshot(consumerConfig.featured_course_slug)
        if (!cancelled) {
          setCourseLibrary(snapshot.courses)
          setFeaturedCourse(snapshot.featuredCourse)
          setCourseDraft({
            title: snapshot.featuredCourse?.title || '',
            subtitle: snapshot.featuredCourse?.subtitle || '',
            headline: snapshot.featuredCourse?.headline || '',
            description: snapshot.featuredCourse?.description || '',
            status: 'published',
          })
          setSectionDrafts(
            (snapshot.featuredCourse?.sections || []).map((section) => ({
              id: section.id,
              title: section.title,
              summary: section.summary,
              preview: !!section.preview,
              duration: section.duration,
            }))
          )
          setCommunitySnapshot(null)
          setCommunityPosts([])
          setPostDrafts([])
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

  async function handleSaveFeaturedCourse() {
    if (!featuredCourse) return

    setSavingCourse(true)
    try {
      const updated = await updateConsumerCourse(featuredCourse.id, courseDraft)
      const nextFeatured = {
        ...featuredCourse,
        ...updated,
      }
      setFeaturedCourse(nextFeatured)
      setCourseLibrary((current) => current.map((course) => (
        course.id === featuredCourse.id
          ? { ...course, ...updated }
          : course
      )))
    } catch (error) {
      console.error('Failed to update featured course', error)
    } finally {
      setSavingCourse(false)
    }
  }

  async function handleCreatePost() {
    if (!communitySnapshot?.creator?.id) return
    setCreatingPost(true)
    try {
      const created = await createPost(communitySnapshot.creator.id, {
        title: 'New community update',
        preview: 'Share a new members-only update, event recap, or discussion prompt.',
        locked: false,
        type: 'text',
      })
      setCommunityPosts((current) => [created, ...current])
      setPostDrafts((current) => [{
        id: created.id,
        title: created.title,
        preview: created.preview || '',
        locked: created.locked,
      }, ...current].slice(0, 5))
    } catch (error) {
      console.error('Failed to create community post', error)
    } finally {
      setCreatingPost(false)
    }
  }

  async function handleCreateCourse() {
    if (!user?.id) return
    setCreatingCourse(true)
    try {
      const slugBase = `course-${Date.now()}`
      const created = await createConsumerCourse({
        creator_id: user.id,
        slug: slugBase,
        title: 'New Course',
        subtitle: 'Define the transformation and expected learner outcome.',
        instructor: user.name || 'Creator',
        price: 49,
        level: 'Beginner',
        hero: 'from-sky-600 via-cyan-500 to-emerald-400',
        headline: 'A new structured learning offer.',
        description: 'Use this draft course as the starting point for a new paid knowledge product.',
        outcomes: ['Clarify the promise', 'Map the curriculum', 'Launch the first version'],
        status: 'published',
      })
      const nextCourse: Course = {
        id: created.id,
        slug: created.slug,
        title: created.title,
        subtitle: created.subtitle,
        instructor: created.instructor,
        price: Number(created.price),
        level: created.level,
        hero: created.hero,
        headline: created.headline,
        description: created.description,
        outcomes: created.outcomes,
        stats: {
          lessons: created.lessons_count,
          students: created.students_count,
          completionRate: created.completion_rate,
        },
        sections: [],
      }
      setCourseLibrary((current) => [nextCourse, ...current])
      setFeaturedCourse(nextCourse)
      setCourseDraft({
        title: nextCourse.title,
        subtitle: nextCourse.subtitle,
        headline: nextCourse.headline,
        description: nextCourse.description,
        status: 'published',
      })
      setSectionDrafts([])
    } catch (error) {
      console.error('Failed to create course', error)
    } finally {
      setCreatingCourse(false)
    }
  }

  async function handleCreateLesson() {
    if (!featuredCourse) return
    setCreatingLesson(true)
    try {
      const position = sectionDrafts.length + 1
      const sectionKey = `${featuredCourse.slug}-${position}`
      const created = await createConsumerCourseSection({
        course_id: featuredCourse.id,
        section_key: sectionKey,
        title: `New Lesson ${position}`,
        duration: '10 min',
        summary: 'Add lesson summary and key learning outcome.',
        preview: false,
        position,
      })
      const nextSection = {
        id: created.section_key,
        title: created.title,
        duration: created.duration,
        summary: created.summary,
        preview: created.preview,
      }
      setFeaturedCourse((current) => current ? {
        ...current,
        sections: [...current.sections, nextSection],
        stats: {
          ...current.stats,
          lessons: current.stats.lessons + 1,
        },
      } : current)
      setSectionDrafts((current) => [...current, {
        id: created.section_key,
        title: created.title,
        summary: created.summary,
        preview: created.preview,
        duration: created.duration,
      }])
    } catch (error) {
      console.error('Failed to create lesson', error)
    } finally {
      setCreatingLesson(false)
    }
  }

  async function handleSaveSection(sectionId: string) {
    const section = sectionDrafts.find((item) => item.id === sectionId)
    if (!section || !featuredCourse) return

    setSavingSectionId(sectionId)
    try {
      const updated = await updateConsumerCourseSection(sectionId, {
        title: section.title,
        summary: section.summary,
        preview: section.preview,
      })
      setFeaturedCourse((current) => current ? {
        ...current,
        sections: current.sections.map((item) => (
          item.id === sectionId
            ? {
                ...item,
                title: updated.title,
                summary: updated.summary,
                preview: updated.preview,
              }
            : item
        )),
      } : current)
    } catch (error) {
      console.error('Failed to update course section', error)
    } finally {
      setSavingSectionId(null)
    }
  }

  async function handleSaveTier(tierId: string) {
    const tier = tierDrafts.find((item) => item.id === tierId)
    if (!tier || !communitySnapshot?.creator?.id) return

    const parsedPrice = Number.parseFloat(tier.price)
    setSavingTierId(tierId)
    try {
      const updated = await updateMembershipTier(tierId, {
        name: tier.name,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        description: tier.note,
        perks: tier.perksText.split('\n').map((item) => item.trim()).filter(Boolean),
      })
      setCommunitySnapshot((current) => current ? {
        ...current,
        tiers: current.tiers.map((item) => (
          item.key === tier.key
            ? {
                ...item,
                name: updated.name,
                price: updated.price === 0 ? '$0' : `$${updated.price}`,
                note: updated.description || '',
                perks: updated.perks || [],
              }
            : item
        )),
      } : current)
    } catch (error) {
      console.error('Failed to update membership tier', error)
    } finally {
      setSavingTierId(null)
    }
  }

  async function handleSavePost(postId: string) {
    const post = postDrafts.find((item) => item.id === postId)
    if (!post) return

    setSavingPostId(postId)
    try {
      const updated = await updatePost(postId, {
        title: post.title,
        preview: post.preview,
        locked: post.locked,
      })
      setCommunityPosts((current) => current.map((item) => (
        item.id === postId
          ? { ...item, ...updated }
          : item
      )))
    } catch (error) {
      console.error('Failed to update community post', error)
    } finally {
      setSavingPostId(null)
    }
  }

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
      ) : null}

      {!loading && consumerTemplate === 'fan_community' && (
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
      )}

      {!loading && consumerTemplate === 'fan_community' && communitySnapshot && (
        <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-amber-300" />
            <p className="font-bold">Membership tier editor</p>
          </div>
          <div className="space-y-4">
            {tierDrafts.map((tier) => (
              <div key={tier.id} className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Tier name</p>
                    <input
                      value={tier.name}
                      onChange={(event) => setTierDrafts((current) => current.map((item) => (
                        item.id === tier.id ? { ...item, name: event.target.value } : item
                      )))}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Monthly price</p>
                    <input
                      value={tier.price}
                      onChange={(event) => setTierDrafts((current) => current.map((item) => (
                        item.id === tier.id ? { ...item, price: event.target.value } : item
                      )))}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Tier description</p>
                    <textarea
                      value={tier.note}
                      onChange={(event) => setTierDrafts((current) => current.map((item) => (
                        item.id === tier.id ? { ...item, note: event.target.value } : item
                      )))}
                      rows={3}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                    />
                  </label>
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Perks</p>
                    <textarea
                      value={tier.perksText}
                      onChange={(event) => setTierDrafts((current) => current.map((item) => (
                        item.id === tier.id ? { ...item, perksText: event.target.value } : item
                      )))}
                      rows={3}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                    />
                  </label>
                </div>
                <button
                  onClick={() => handleSaveTier(tier.id)}
                  disabled={savingTierId === tier.id}
                  className="mt-3 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {savingTierId === tier.id ? 'Saving tier...' : 'Save tier'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && consumerTemplate === 'fan_community' && (
        <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-sky-300" />
            <p className="font-bold">Community feed editor</p>
          </div>
          <button
            onClick={handleCreatePost}
            disabled={creatingPost}
            className="mb-4 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {creatingPost ? 'Creating post...' : 'New post'}
          </button>
          <div className="space-y-4">
            {postDrafts.length === 0 && (
              <div className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 text-sm text-olu-muted">
                No creator posts available yet for this community surface.
              </div>
            )}
            {postDrafts.map((post, index) => (
              <div key={post.id} className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm">Feed item {index + 1}</p>
                    <p className="text-xs text-cyan-100/50 mt-1">
                      {communityPosts.find((item) => item.id === post.id)?.type || 'post'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-cyan-100/70">
                    <input
                      type="checkbox"
                      checked={post.locked}
                      onChange={(event) => setPostDrafts((current) => current.map((item) => (
                        item.id === post.id
                          ? { ...item, locked: event.target.checked }
                          : item
                      )))}
                    />
                    Members only
                  </label>
                </div>
                <div className="grid sm:grid-cols-[0.8fr,1.2fr] gap-3">
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Post title</p>
                    <input
                      value={post.title}
                      onChange={(event) => setPostDrafts((current) => current.map((item) => (
                        item.id === post.id
                          ? { ...item, title: event.target.value }
                          : item
                      )))}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Post preview</p>
                    <textarea
                      value={post.preview}
                      onChange={(event) => setPostDrafts((current) => current.map((item) => (
                        item.id === post.id
                          ? { ...item, preview: event.target.value }
                          : item
                      )))}
                      rows={3}
                      className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                    />
                  </label>
                </div>
                <button
                  onClick={() => handleSavePost(post.id)}
                  disabled={savingPostId === post.id}
                  className="mt-3 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {savingPostId === post.id ? 'Saving post...' : 'Save post'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && consumerTemplate !== 'fan_community' && (
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
                `Current status: ${courseDraft.status}.`,
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#0d1726] border border-cyan-500/10 p-4 text-sm text-olu-muted">
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={handleCreateCourse}
              disabled={creatingCourse}
              className="mt-4 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {creatingCourse ? 'Creating course...' : 'New course'}
            </button>
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

      {!loading && consumerTemplate === 'sell_courses' && featuredCourse && (
        <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422] space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-emerald-300" />
            <p className="font-bold">Featured course editor</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course title</p>
              <input
                value={courseDraft.title}
                onChange={(event) => setCourseDraft((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course subtitle</p>
              <input
                value={courseDraft.subtitle}
                onChange={(event) => setCourseDraft((current) => ({ ...current, subtitle: event.target.value }))}
                className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Hero headline</p>
              <textarea
                value={courseDraft.headline}
                onChange={(event) => setCourseDraft((current) => ({ ...current, headline: event.target.value }))}
                rows={3}
                className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
              />
            </label>
            <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course description</p>
              <textarea
                value={courseDraft.description}
                onChange={(event) => setCourseDraft((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
              />
            </label>
            <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course status</p>
              <select
                value={courseDraft.status}
                onChange={(event) => setCourseDraft((current) => ({ ...current, status: event.target.value as ConsumerCourse['status'] }))}
                className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <button
            onClick={handleSaveFeaturedCourse}
            disabled={savingCourse}
            className="mt-4 rounded-2xl bg-white text-black px-4 py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {savingCourse ? 'Saving...' : 'Save featured course copy'}
          </button>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-cyan-300" />
              <p className="font-bold">Lesson editor</p>
            </div>
            <button
              onClick={handleCreateLesson}
              disabled={creatingLesson}
              className="mb-4 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {creatingLesson ? 'Creating lesson...' : 'New lesson'}
            </button>
            <div className="space-y-3">
              {sectionDrafts.map((section, index) => (
                <div key={section.id} className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm">Lesson {index + 1}</p>
                      <p className="text-xs text-cyan-100/50 mt-1">{section.duration}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-cyan-100/70">
                      <input
                        type="checkbox"
                        checked={section.preview}
                        onChange={(event) => setSectionDrafts((current) => current.map((item) => (
                          item.id === section.id
                            ? { ...item, preview: event.target.checked }
                            : item
                        )))}
                      />
                      Preview
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-[0.9fr,1.1fr] gap-3">
                    <label className="block">
                      <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Lesson title</p>
                      <input
                        value={section.title}
                        onChange={(event) => setSectionDrafts((current) => current.map((item) => (
                          item.id === section.id
                            ? { ...item, title: event.target.value }
                            : item
                        )))}
                        className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Lesson summary</p>
                      <textarea
                        value={section.summary}
                        onChange={(event) => setSectionDrafts((current) => current.map((item) => (
                          item.id === section.id
                            ? { ...item, summary: event.target.value }
                            : item
                        )))}
                        rows={3}
                        className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => handleSaveSection(section.id)}
                    disabled={savingSectionId === section.id}
                    className="mt-3 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {savingSectionId === section.id ? 'Saving lesson...' : 'Save lesson copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
