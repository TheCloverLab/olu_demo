import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, MessageSquare, BookOpen, Users, Headphones, Lock, ChevronRight, Check, Sparkles, UserPlus, ArrowLeft, BadgeCheck } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../../lib/supabase'
import type { Workspace, WorkspaceHomeConfig, WorkspaceHomeTab, WorkspaceHomeLayout, WorkspaceExperience, WorkspaceProduct, WorkspaceProductPlan } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { joinWorkspace, hasJoinedWorkspace } from '../../../domain/workspace/api'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')
import { listExperiences } from '../../../domain/experience/api'
import { getHomeConfig, listProducts, listPlans, purchaseProduct, getUserPurchases, getProductExperienceIds } from '../../../domain/product/api'

const TYPE_ICON: Record<string, typeof MessageSquare> = {
  forum: MessageSquare,
  course: BookOpen,
  group_chat: Users,
  support_chat: Headphones,
}

const TYPE_GRADIENT: Record<string, string> = {
  forum: 'from-purple-500/20 to-purple-600/5',
  course: 'from-blue-500/20 to-blue-600/5',
  group_chat: 'from-emerald-500/20 to-emerald-600/5',
  support_chat: 'from-amber-500/20 to-amber-600/5',
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
    else if (exp.type === 'support_chat') navigate(`/chat`)
  }

  if (tabExps.length === 0) {
    return <p className="text-sm text-[var(--olu-muted)] text-center py-8">No experiences in this tab.</p>
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
              {plan.trial_days > 0 && ` · ${plan.trial_days}d trial`}
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

function JoinButton({ hasJoined, joining, onJoin, t, size = 'md' }: { hasJoined: boolean; joining: boolean; onJoin: () => void; t: any; size?: 'sm' | 'md' }) {
  if (hasJoined) {
    return (
      <span className={clsx(
        'flex items-center gap-1.5 rounded-xl font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 flex-shrink-0',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      )}>
        <Check size={14} />
        {t('consumer.joined', 'Joined')}
      </span>
    )
  }
  return (
    <button
      onClick={onJoin}
      disabled={joining}
      className={clsx(
        'flex items-center gap-1.5 rounded-xl font-semibold bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex-shrink-0',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
      )}
    >
      {joining ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
      {t('consumer.join', 'Join')}
    </button>
  )
}

function WorkspaceIcon({ workspace, size = 'md' }: { workspace: Workspace; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-20 h-20 text-3xl' : size === 'md' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base'
  const rounded = size === 'lg' ? 'rounded-[20px]' : 'rounded-2xl'
  const border = 'ring-4 ring-[var(--olu-bg)]'
  if (workspace.icon) {
    return <img src={workspace.icon} alt="" className={clsx(sz, rounded, border, 'object-cover')} />
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

function MemberCount({ count, t }: { count: number; t: any }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1.5 text-sm text-[var(--olu-text-secondary)]">
      <Users size={14} />
      {count.toLocaleString()} {t('consumer.joined', 'joined')}
    </span>
  )
}

function ClassicHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, t, navigate, memberCount }: any) {
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
            {userId && <JoinButton hasJoined={hasJoined} joining={joining} onJoin={onJoin} t={t} size="sm" />}
          </div>
        </div>
      </div>
    </>
  )
}

function HeroHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, t, navigate, memberCount }: any) {
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
          {userId && <JoinButton hasJoined={hasJoined} joining={joining} onJoin={onJoin} t={t} size="sm" />}
        </div>
      </div>
    </div>
  )
}

function CompactHeader({ workspace, headline, userId, hasJoined, joining, onJoin, t, navigate, memberCount }: any) {
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
        <JoinButton hasJoined={hasJoined} joining={joining} onJoin={onJoin} t={t} />
      )}
    </div>
  )
}

function CatalogHeader({ workspace, headline, cover, userId, hasJoined, joining, onJoin, t, navigate, memberCount }: any) {
  return (
    <div className="relative overflow-hidden">
      <div className="h-36 bg-gradient-to-r from-cyan-600 to-blue-700">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute top-0 left-0 right-0 px-4 pt-4 z-10">
          <BackButton navigate={navigate} />
        </div>
      </div>
      <div className="px-4 -mt-10 relative z-10 mb-4">
        <div className="rounded-2xl bg-[var(--olu-surface)] border border-[var(--olu-card-border)] p-4 shadow-lg">
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
            {userId && <JoinButton hasJoined={hasJoined} joining={joining} onJoin={onJoin} t={t} size="sm" />}
          </div>
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

  const userId = IS_DEMO ? 'demo-consumer' : authUser?.id

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
        let ws: Workspace | null = null
        if (IS_DEMO) {
          ws = { id: 'ws-demo', owner_user_id: 'demo-user-001', name: 'Pixel Realm', slug: workspaceSlug!, icon: null, cover: null, headline: 'Where art meets community', status: 'active', created_at: '' } as Workspace
        } else {
          const { data } = await supabase
            .from('workspaces')
            .select('*')
            .eq('slug', workspaceSlug)
            .single()
          ws = data
        }
        if (!ws) { setLoading(false); return }
        setWorkspace(ws)

        const [config, exps, prods, { count: joinCount }] = await Promise.all([
          getHomeConfig(ws.id),
          listExperiences(ws.id),
          listProducts(ws.id),
          supabase.from('workspace_joins').select('*', { count: 'exact', head: true }).eq('workspace_id', ws.id),
        ])
        setMemberCount(joinCount || 0)
        setHomeConfig(config)
        setExperiences(exps)

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

  const headerProps = { workspace, headline, cover, userId, hasJoined, joining: joiningWorkspace, onJoin: handleJoinWorkspace, t, navigate, memberCount }

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
