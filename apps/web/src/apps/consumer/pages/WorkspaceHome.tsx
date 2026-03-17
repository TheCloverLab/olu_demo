import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, MessageSquare, BookOpen, Users, Lock, ChevronRight, ChevronDown, Check, Sparkles, UserPlus, ArrowLeft, BadgeCheck, Headphones, LogOut, Heart, Send, Play } from 'lucide-react'
import clsx from 'clsx'
import type { Workspace, WorkspaceHomeConfig, WorkspaceHomeTab, WorkspaceHomeLayout, WorkspaceExperience, WorkspaceProduct, WorkspaceProductPlan } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { joinWorkspace, hasJoinedWorkspace, leaveWorkspace, getWorkspaceBySlug, getWorkspaceMemberCount } from '../../../domain/workspace/api'

import { listExperiences, getForumPosts, getVideoItems, extractYouTubeId, type ForumPostWithAuthor } from '../../../domain/experience/api'
import type { ExperienceVideoItem } from '../../../lib/supabase'
import { getCourseTree, type CourseTree } from '../../../domain/experience/course-api'
import { getHomeConfig, listProducts, listPlans, purchaseProduct, getUserPurchases, getProductExperienceIds } from '../../../domain/product/api'

const TYPE_ICON: Record<string, typeof MessageSquare> = {
  forum: MessageSquare,
  course: BookOpen,
  group_chat: Users,
  video: Play,
}

const TYPE_GRADIENT: Record<string, string> = {
  forum: 'from-purple-500/20 to-purple-600/5',
  course: 'from-blue-500/20 to-blue-600/5',
  group_chat: 'from-emerald-500/20 to-emerald-600/5',
  video: 'from-red-500/20 to-red-600/5',
}

function ExperienceCard({ exp, onClick }: { exp: WorkspaceExperience; onClick: () => void }) {
  const Icon = TYPE_ICON[exp.type] || MessageSquare

  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden text-left hover:-translate-y-0.5 transition-all group"
    >
      {exp.cover ? (
        <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${exp.cover})` }} />
      ) : (
        <div className={clsx('h-28 bg-gradient-to-br flex items-center justify-center', TYPE_GRADIENT[exp.type])}>
          <Icon size={32} className="text-[var(--olu-muted)]" />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-[var(--olu-text-secondary)]" />
          <h3 className="font-semibold text-sm truncate">{exp.name}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--olu-muted)]">
          <span className="capitalize">{exp.type.replace('_', ' ')}</span>
          {exp.visibility === 'product_gated' && (
            <span className="flex items-center gap-0.5">
              <Lock size={10} /> Gated
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ExperienceListItem({ exp, onClick }: { exp: WorkspaceExperience; onClick: () => void }) {
  const Icon = TYPE_ICON[exp.type] || MessageSquare

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] text-left hover:bg-[var(--olu-card-hover)] transition-colors"
    >
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', TYPE_GRADIENT[exp.type])}>
        <Icon size={18} className="text-[var(--olu-text-secondary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm truncate">{exp.name}</h3>
        <p className="text-xs text-[var(--olu-muted)] capitalize">{exp.type.replace('_', ' ')}</p>
      </div>
      {exp.visibility !== 'public' && <Lock size={12} className="text-[var(--olu-muted)]" />}
      <ChevronRight size={14} className="text-[var(--olu-muted)]" />
    </button>
  )
}

// ── Inline Experience (renders experience content directly in tab) ──

function LockedExperienceCard({ exp, workspaceSlug, experienceProductMap }: { exp: WorkspaceExperience; workspaceSlug: string; experienceProductMap: Record<string, string> }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const Icon = TYPE_ICON[exp.type] || MessageSquare
  const productId = experienceProductMap[exp.id]

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      {exp.cover ? (
        <div className="h-36 bg-cover bg-center relative" style={{ backgroundImage: `url(${exp.cover})` }}>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Lock size={32} className="text-white/70" />
          </div>
        </div>
      ) : (
        <div className={clsx('h-36 bg-gradient-to-br flex items-center justify-center', TYPE_GRADIENT[exp.type])}>
          <Lock size={32} className="text-[var(--olu-muted)]" />
        </div>
      )}
      <div className="p-5 space-y-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Icon size={16} className="text-[var(--olu-text-secondary)]" />
          <h3 className="font-bold text-lg">{exp.name}</h3>
        </div>
        <p className="text-sm text-[var(--olu-muted)]">
          {t('consumer.lockedContent', 'This content requires a subscription to access.')}
        </p>
        {productId && (
          <button
            onClick={() => navigate(`/w/${workspaceSlug}/product/${productId}`)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-colors"
          >
            <Sparkles size={14} />
            {t('consumer.getAccess', 'Get Access')}
          </button>
        )}
      </div>
    </div>
  )
}

function InlineForumContent({ experienceId }: { experienceId: string }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getForumPosts(experienceId)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [experienceId])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--olu-muted)]" /></div>
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
        <MessageSquare size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
        <p className="text-sm text-[var(--olu-muted)]">No posts yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            {post.author?.avatar_img ? (
              <img src={post.author.avatar_img} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 bg-gradient-to-br', post.author?.avatar_color || 'from-gray-600 to-gray-500')}>
                {post.author?.initials || '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{post.author?.name || 'Unknown'}</p>
              <p className="text-[var(--olu-muted)] text-xs">{post.author?.handle}</p>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs text-[var(--olu-text-secondary)]">
              <Heart size={14} /> {post.like_count}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--olu-text-secondary)]">
              <MessageSquare size={14} /> {post.comment_count}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function InlineCourseContent({ experienceId }: { experienceId: string }) {
  const navigate = useNavigate()
  const [tree, setTree] = useState<CourseTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)

  useEffect(() => {
    getCourseTree(experienceId)
      .then((t) => {
        setTree(t)
        if (t && t.chapters.length > 0) setExpandedChapter(t.chapters[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [experienceId])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--olu-muted)]" /></div>
  }

  if (!tree || tree.chapters.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
        <BookOpen size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
        <p className="text-sm text-[var(--olu-muted)]">No course content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tree.chapters.map((chapter) => (
        <div key={chapter.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
          <button
            onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-300/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={14} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{chapter.title}</h4>
              <p className="text-xs text-[var(--olu-muted)]">{chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}</p>
            </div>
            {expandedChapter === chapter.id ? <ChevronDown size={14} className="text-[var(--olu-muted)]" /> : <ChevronRight size={14} className="text-[var(--olu-muted)]" />}
          </button>
          {expandedChapter === chapter.id && chapter.lessons.length > 0 && (
            <div className="border-t border-[var(--olu-card-border)] px-4 py-2 space-y-1">
              {chapter.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/course/${experienceId}`)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-left rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--olu-card-bg)] flex items-center justify-center flex-shrink-0">
                    <Play size={10} className="text-[var(--olu-text-secondary)]" />
                  </div>
                  <span className="text-sm truncate flex-1">{lesson.title}</span>
                  {lesson.video_url && <Play size={12} className="text-[var(--olu-muted)] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function InlineChatPreview({ exp, workspaceSlug }: { exp: WorkspaceExperience; workspaceSlug: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mx-auto">
        <Users size={24} className="text-emerald-500" />
      </div>
      <h3 className="font-bold text-lg">{exp.name}</h3>
      <p className="text-sm text-[var(--olu-muted)]">
        {t('consumer.joinChat', 'Join the conversation with the community.')}
      </p>
      <button
        onClick={() => navigate(`/group-chat/${exp.id}`)}
        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
      >
        <Send size={14} />
        {t('consumer.openChat', 'Open Chat')}
      </button>
    </div>
  )
}

function InlineVideoContent({ experienceId }: { experienceId: string }) {
  const [items, setItems] = useState<ExperienceVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    getVideoItems(experienceId)
      .then((v) => {
        setItems(v)
        if (v.length > 0) {
          const id = extractYouTubeId(v[0].video_url)
          if (id) setActiveVideo(id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [experienceId])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--olu-muted)]" /></div>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
        <Play size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
        <p className="text-sm text-[var(--olu-muted)]">No videos yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Active video player */}
      {activeVideo && (
        <div className="rounded-2xl overflow-hidden border border-[var(--olu-card-border)] aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${activeVideo}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Video list */}
      <div className="space-y-2">
        {items.map((item) => {
          const ytId = extractYouTubeId(item.video_url)
          const isActive = ytId === activeVideo
          return (
            <button
              key={item.id}
              onClick={() => ytId && setActiveVideo(ytId)}
              className={clsx(
                'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors',
                isActive
                  ? 'bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)]'
                  : 'hover:bg-[var(--olu-card-hover)]'
              )}
            >
              <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-black">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/5">
                    <Play size={16} className="text-[var(--olu-muted)]" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                    <Play size={16} className="text-cyan-300" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium truncate', isActive && 'text-cyan-700 dark:text-cyan-300')}>{item.title}</p>
                {item.description && <p className="text-xs text-[var(--olu-muted)] truncate">{item.description}</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InlineExperience({
  exp,
  isLocked,
  workspaceSlug,
  experienceProductMap,
}: {
  exp: WorkspaceExperience
  isLocked: boolean
  workspaceSlug: string
  experienceProductMap: Record<string, string>
}) {
  if (isLocked) {
    return <LockedExperienceCard exp={exp} workspaceSlug={workspaceSlug} experienceProductMap={experienceProductMap} />
  }

  if (exp.type === 'forum') return <InlineForumContent experienceId={exp.id} />
  if (exp.type === 'course') return <InlineCourseContent experienceId={exp.id} />
  if (exp.type === 'group_chat') return <InlineChatPreview exp={exp} workspaceSlug={workspaceSlug} />
  if (exp.type === 'video') return <InlineVideoContent experienceId={exp.id} />

  return null
}

// ── Tab Content ──

function TabContent({
  tab,
  experiences,
  purchasedProductIds,
  workspaceSlug,
  experienceProductMap,
}: {
  tab: WorkspaceHomeTab
  experiences: WorkspaceExperience[]
  purchasedProductIds: Set<string>
  workspaceSlug: string
  experienceProductMap: Record<string, string>
}) {
  const navigate = useNavigate()
  const tabExps = experiences.filter((e) => tab.experience_ids.includes(e.id))

  function handleOpen(exp: WorkspaceExperience) {
    if (exp.visibility === 'product_gated' && !purchasedProductIds.has(experienceProductMap[exp.id])) {
      const productId = experienceProductMap[exp.id]
      if (productId) {
        navigate(`/w/${workspaceSlug}/product/${productId}`)
        return
      }
    }
    if (exp.type === 'forum') navigate(`/forum/${exp.id}`)
    else if (exp.type === 'course') navigate(`/course/${exp.id}`)
    else if (exp.type === 'group_chat') navigate(`/group-chat/${exp.id}`)
    else if (exp.type === 'video') navigate(`/video/${exp.id}`)
  }

  if (tabExps.length === 0) {
    return <p className="text-sm text-[var(--olu-muted)] text-center py-8">No experiences in this tab.</p>
  }

  // Inline mode: render the single experience content directly
  if (tab.display_mode === 'inline' && tabExps.length === 1) {
    const exp = tabExps[0]
    const isLocked = exp.visibility === 'product_gated' && !purchasedProductIds.has(experienceProductMap[exp.id])
    return <InlineExperience exp={exp} isLocked={isLocked} workspaceSlug={workspaceSlug} experienceProductMap={experienceProductMap} />
  }

  // Inline mode with multiple exps: fall back to list
  if (tab.display_mode === 'inline') {
    return (
      <div className="space-y-2">
        {tabExps.map((exp) => (
          <ExperienceListItem key={exp.id} exp={exp} onClick={() => handleOpen(exp)} />
        ))}
      </div>
    )
  }

  if (tab.display_mode === 'list') {
    return (
      <div className="space-y-2">
        {tabExps.map((exp) => (
          <ExperienceListItem key={exp.id} exp={exp} onClick={() => handleOpen(exp)} />
        ))}
      </div>
    )
  }

  if (tab.display_mode === 'featured' && tabExps.length > 0) {
    const [featured, ...rest] = tabExps
    return (
      <div className="space-y-3">
        <ExperienceCard exp={featured} onClick={() => handleOpen(featured)} />
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {rest.map((exp) => (
              <ExperienceCard key={exp.id} exp={exp} onClick={() => handleOpen(exp)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const cols = tab.display_mode === 'grid' ? 'grid-cols-3' : 'grid-cols-2'
  return (
    <div className={clsx('grid gap-3', cols)}>
      {tabExps.map((exp) => (
        <ExperienceCard key={exp.id} exp={exp} onClick={() => handleOpen(exp)} />
      ))}
    </div>
  )
}

type ProductCardData = WorkspaceProduct & { plans: WorkspaceProductPlan[] }

function ProductCard({
  product,
  joined,
  joining,
  onJoin,
}: {
  product: ProductCardData
  joined: boolean
  joining: boolean
  onJoin: (productId: string, planId?: string) => void
}) {
  const cheapest = product.plans.length > 0
    ? product.plans.reduce((a, b) => (a.price < b.price ? a : b))
    : null

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm">{product.name}</h4>
          {product.description && (
            <p className="text-xs text-[var(--olu-muted)] mt-0.5">{product.description}</p>
          )}
        </div>
        {product.access_type === 'free' ? (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            Free
          </span>
        ) : cheapest ? (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-400/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
            ${cheapest.price}/{cheapest.interval || 'once'}
          </span>
        ) : null}
      </div>

      {product.plans.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {product.plans.map((plan) => (
            <span key={plan.id} className="text-xs px-2 py-0.5 rounded-lg bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)]">
              ${plan.price}/{plan.interval || 'once'}
              {(plan.trial_days ?? 0) > 0 && ` · ${plan.trial_days}d trial`}
            </span>
          ))}
        </div>
      )}

      {joined ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Check size={14} />
          Joined
        </div>
      ) : (
        <button
          onClick={() => onJoin(product.id, cheapest?.id)}
          disabled={joining}
          className={clsx(
            'rounded-xl px-5 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1.5',
            product.access_type === 'free'
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50'
          )}
        >
          {joining ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={14} />
              {product.access_type === 'free' ? 'Join Free' : 'Get Access'}
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Layout-specific headers
// ────────────────────────────────────────────────────────────────

function JoinAndSupportButtons({ hasJoined, joining, onJoin, onUnjoin, workspace, t, navigate, size = 'md' }: { hasJoined: boolean; joining: boolean; onJoin: () => void; onUnjoin: () => void; workspace: Workspace; t: ReturnType<typeof useTranslation>['t']; navigate: ReturnType<typeof useNavigate>; size?: 'sm' | 'md' }) {
  const [confirmLeave, setConfirmLeave] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {hasJoined ? (
        <>
          {confirmLeave ? (
            <button
              onClick={() => { onUnjoin(); setConfirmLeave(false) }}
              disabled={joining}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex-shrink-0',
                size === 'sm' ? 'px-4 py-2 text-sm' : 'px-4 py-2 text-sm'
              )}
            >
              <LogOut size={14} />
              {t('consumer.confirmLeave', 'Leave?')}
            </button>
          ) : (
            <button
              onClick={() => setConfirmLeave(true)}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 hover:bg-red-500/10 hover:text-red-500 transition-colors flex-shrink-0',
                size === 'sm' ? 'px-4 py-2 text-sm' : 'px-4 py-2 text-sm'
              )}
            >
              <Check size={14} />
              {t('consumer.joined', 'Joined')}
            </button>
          )}
          <button
            onClick={() => navigate(`/w/${workspace.slug}/support`)}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex-shrink-0',
              size === 'sm' ? 'px-4 py-2 text-sm' : 'px-4 py-2 text-sm'
            )}
          >
            <Headphones size={14} />
            {t('consumer.support', 'Support')}
          </button>
        </>
      ) : (
        <button
          onClick={onJoin}
          disabled={joining}
          className={clsx(
            'flex items-center gap-1.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 flex-shrink-0 shadow-md shadow-emerald-500/25',
            size === 'sm' ? 'px-5 py-2 text-sm' : 'px-6 py-2 text-sm'
          )}
        >
          {joining ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {t('consumer.join', 'Join')}
        </button>
      )}
    </div>
  )
}

function WorkspaceIcon({ workspace, size = 'md' }: { workspace: Workspace; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false)
  const sz = size === 'lg' ? 'w-20 h-20 text-3xl' : size === 'md' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base'
  const rounded = size === 'lg' ? 'rounded-[20px]' : 'rounded-2xl'
  const border = 'ring-4 ring-[var(--olu-bg)]'
  if (workspace.icon && !imgError) {
    return <img src={workspace.icon} alt="" className={clsx(sz, rounded, border, 'object-cover')} onError={() => setImgError(true)} />
  }
  return (
    <div className={clsx(sz, rounded, border, 'bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold')}>
      {workspace.name[0]}
    </div>
  )
}

function BackButton({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  )
}

function MemberCount({ count, t }: { count: number; t: ReturnType<typeof useTranslation>['t'] }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1.5 text-sm text-[var(--olu-text-secondary)]">
      <Users size={14} />
      {count.toLocaleString()} {t('consumer.joined', 'joined')}
    </span>
  )
}

interface HeaderProps {
  workspace: Workspace & { verified?: boolean }
  headline: string | null
  cover?: string | null
  userId: string | undefined
  hasJoined: boolean
  joining: boolean
  onJoin: () => void
  onUnjoin: () => void
  t: ReturnType<typeof useTranslation>['t']
  navigate: ReturnType<typeof useNavigate>
  memberCount: number
}

function ClassicHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, onUnjoin, t, navigate, memberCount }: HeaderProps) {
  return (
    <>
      <div className="h-52 relative bg-gradient-to-br from-slate-900 to-slate-800">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <div className="absolute top-0 left-0 right-0 px-4 pt-4 z-10">
          <BackButton navigate={navigate} />
        </div>
      </div>
      <div className="px-4 -mt-8 relative z-10 mb-4">
        <WorkspaceIcon workspace={workspace} size="lg" />
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-2xl">{workspace.name}</h1>
            {workspace.verified && <BadgeCheck size={20} className="text-sky-500" fill="currentColor" />}
          </div>
          {headline && <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">{headline}</p>}
          <div className="flex items-center gap-3 pt-1">
            <MemberCount count={memberCount} t={t} />
            {userId && <JoinAndSupportButtons hasJoined={hasJoined} joining={joining} onJoin={onJoin} onUnjoin={onUnjoin} workspace={workspace} t={t} navigate={navigate} size="sm" />}
          </div>
        </div>
      </div>
    </>
  )
}

function HeroHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, onUnjoin, t, navigate, memberCount }: HeaderProps) {
  return (
    <div className="relative min-h-[300px] flex flex-col justify-end">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover opacity-50" />}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 z-10">
        <BackButton navigate={navigate} />
      </div>
      <div className="relative z-10 px-4 pb-6 space-y-3">
        <WorkspaceIcon workspace={workspace} size="lg" />
        <div className="flex items-center gap-2">
          <h1 className="font-black text-2xl text-white">{workspace.name}</h1>
          {workspace.verified && <BadgeCheck size={20} className="text-sky-400" fill="currentColor" />}
        </div>
        {headline && <p className="text-sm text-white/60 max-w-md leading-relaxed">{headline}</p>}
        <div className="flex items-center gap-3">
          {memberCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-white/50">
              <Users size={14} />
              {memberCount.toLocaleString()} joined
            </span>
          )}
          {userId && <JoinAndSupportButtons hasJoined={hasJoined} joining={joining} onJoin={onJoin} onUnjoin={onUnjoin} workspace={workspace} t={t} navigate={navigate} size="sm" />}
        </div>
      </div>
    </div>
  )
}

function CompactHeader({ workspace, headline, userId, hasJoined, joining, onJoin, onUnjoin, t, navigate, memberCount }: HeaderProps) {
  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[var(--olu-muted)] hover:text-[var(--olu-text)] transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>
      <div className="flex items-center gap-4">
        <WorkspaceIcon workspace={workspace} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-2xl">{workspace.name}</h1>
            {workspace.verified && <BadgeCheck size={18} className="text-sky-500" fill="currentColor" />}
          </div>
          {headline && <p className="text-sm text-[var(--olu-text-secondary)] mt-1">{headline}</p>}
          <div className="flex items-center gap-3 mt-2">
            <MemberCount count={memberCount} t={t} />
          </div>
        </div>
      </div>
      {userId && (
        <JoinAndSupportButtons hasJoined={hasJoined} joining={joining} onJoin={onJoin} onUnjoin={onUnjoin} workspace={workspace} t={t} navigate={navigate} />
      )}
    </div>
  )
}

function CatalogHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, onUnjoin, t, navigate, memberCount }: HeaderProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="h-36 bg-gradient-to-r from-cyan-600 to-blue-700">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute top-0 left-0 right-0 px-4 pt-4 z-10">
          <BackButton navigate={navigate} />
        </div>
      </div>
      <div className="px-4 -mt-10 relative z-10 mb-4">
        <div className="rounded-2xl bg-[var(--olu-surface)] border border-[var(--olu-card-border)] p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-4">
            <WorkspaceIcon workspace={workspace} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-lg">{workspace.name}</h1>
                {workspace.verified && <BadgeCheck size={16} className="text-sky-500" fill="currentColor" />}
              </div>
              {headline && <p className="text-xs text-[var(--olu-text-secondary)] mt-0.5">{headline}</p>}
              <MemberCount count={memberCount} t={t} />
            </div>
          </div>
          {userId && <JoinAndSupportButtons hasJoined={hasJoined} joining={joining} onJoin={onJoin} onUnjoin={onUnjoin} workspace={workspace} t={t} navigate={navigate} size="sm" />}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function AboutTab({
  workspace,
  productCards,
  joinedIds,
  joiningId,
  onJoin,
}: {
  workspace: Workspace
  productCards: ProductCardData[]
  joinedIds: Set<string>
  joiningId: string | null
  onJoin: (productId: string, planId?: string) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
        <h3 className="font-semibold text-sm">{t('consumer.about', 'About')}</h3>
        <p className="text-sm text-[var(--olu-text-secondary)]">
          {workspace.headline || 'Welcome to this workspace.'}
        </p>
      </div>

      {productCards.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm px-1">{t('nav.products', 'Products')}</h3>
          {productCards.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              joined={joinedIds.has(product.id)}
              joining={joiningId === product.id}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkspaceHome() {
  const { workspaceSlug } = useParams()
  const { t } = useTranslation()
  const { user: authUser } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [homeConfig, setHomeConfig] = useState<WorkspaceHomeConfig | null>(null)
  const [experiences, setExperiences] = useState<WorkspaceExperience[]>([])
  const [productCards, setProductCards] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('about')
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [joiningWorkspace, setJoiningWorkspace] = useState(false)
  const [experienceProductMap, setExperienceProductMap] = useState<Record<string, string>>({})
  const [memberCount, setMemberCount] = useState(0)
  const navigate = useNavigate()

  const userId = authUser?.id

  async function handleJoinWorkspace() {
    if (!userId || !workspace) return
    setJoiningWorkspace(true)
    try {
      await joinWorkspace(userId, workspace.id)
      setHasJoined(true)
      setMemberCount((c) => c + 1)
      window.dispatchEvent(new Event('workspace-joined'))
    } catch (err) {
      console.error('Failed to join workspace', err)
    } finally {
      setJoiningWorkspace(false)
    }
  }

  async function handleLeaveWorkspace() {
    if (!userId || !workspace) return
    setJoiningWorkspace(true)
    try {
      await leaveWorkspace(userId, workspace.id)
      setHasJoined(false)
      setMemberCount((c) => Math.max(0, c - 1))
      window.dispatchEvent(new Event('workspace-left'))
    } catch (err) {
      console.error('Failed to leave workspace', err)
    } finally {
      setJoiningWorkspace(false)
    }
  }

  async function handleJoin(productId: string, planId?: string) {
    if (!userId) return
    setJoiningId(productId)
    try {
      await purchaseProduct(userId, productId, planId)
      setJoinedIds((prev) => new Set(prev).add(productId))
    } catch (err) {
      console.error('Purchase failed', err)
    } finally {
      setJoiningId(null)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const ws = await getWorkspaceBySlug(workspaceSlug!)
        if (!ws) { setLoading(false); return }
        setWorkspace(ws)

        const [config, exps, prods, joinCount] = await Promise.all([
          getHomeConfig(ws.id),
          listExperiences(ws.id),
          listProducts(ws.id),
          getWorkspaceMemberCount(ws.id),
        ])
        setMemberCount(joinCount)
        setHomeConfig(config)
        setExperiences(exps)

        // Default to first tab if tabs exist
        if (config?.tabs && config.tabs.length > 0) {
          setActiveTab(config.tabs[0].key)
        }

        const cards: ProductCardData[] = await Promise.all(
          prods.map(async (p) => ({ ...p, plans: await listPlans(p.id) }))
        )
        setProductCards(cards)

        const expProdMap: Record<string, string> = {}
        await Promise.all(
          prods.map(async (p) => {
            const expIds = await getProductExperienceIds(p.id)
            expIds.forEach((eid) => { expProdMap[eid] = p.id })
          })
        )
        setExperienceProductMap(expProdMap)

        if (userId) {
          const [purchases, joined] = await Promise.all([
            getUserPurchases(userId, ws.id),
            hasJoinedWorkspace(userId, ws.id),
          ])
          setJoinedIds(new Set(purchases.map((p) => p.product_id)))
          setHasJoined(joined)
        }
      } catch (err) {
        console.error('Failed to load workspace', err)
      } finally {
        setLoading(false)
      }
    }
    if (workspaceSlug) load()
  }, [workspaceSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--olu-muted)]">Workspace not found.</p>
      </div>
    )
  }

  const cover = homeConfig?.cover || workspace.cover
  const headline = homeConfig?.headline || workspace.headline
  const tabs = homeConfig?.tabs || []
  const layout: WorkspaceHomeLayout = (homeConfig?.layout as WorkspaceHomeLayout) || 'classic'

  const headerProps = { workspace, headline, cover, userId, hasJoined, joining: joiningWorkspace, onJoin: handleJoinWorkspace, onUnjoin: handleLeaveWorkspace, t, navigate, memberCount }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      {/* Layout-specific header */}
      {layout === 'hero' && <HeroHeader {...headerProps} />}
      {layout === 'compact' && <CompactHeader {...headerProps} />}
      {layout === 'catalog' && <CatalogHeader {...headerProps} />}
      {layout === 'classic' && <ClassicHeader {...headerProps} />}

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('about')}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0',
            activeTab === 'about'
              ? 'bg-cyan-300 text-[#04111f]'
              : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]'
          )}
        >
          {t('consumer.about', 'About')}
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0',
              activeTab === tab.key
                ? 'bg-cyan-300 text-[#04111f]'
                : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4">
        {activeTab === 'about' ? (
          <AboutTab workspace={workspace} productCards={productCards} joinedIds={joinedIds} joiningId={joiningId} onJoin={handleJoin} />
        ) : (
          (() => {
            const tab = tabs.find((t) => t.key === activeTab)
            return tab ? (
              <TabContent tab={tab} experiences={experiences} purchasedProductIds={joinedIds} workspaceSlug={workspaceSlug!} experienceProductMap={experienceProductMap} />
            ) : null
          })()
        )}
      </div>
    </div>
  )
}
