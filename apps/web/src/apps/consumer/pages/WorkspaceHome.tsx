import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, MessageSquare, BookOpen, Users, Headphones, Lock, Eye, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../../lib/supabase'
import type { Workspace, WorkspaceHomeConfig, WorkspaceHomeTab, WorkspaceExperience, WorkspaceProduct } from '../../../lib/supabase'
import { listExperiences } from '../../../domain/experience/api'
import { getHomeConfig, listProducts } from '../../../domain/product/api'

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
          {exp.visibility !== 'public' && (
            <span className="flex items-center gap-0.5">
              <Lock size={10} /> {exp.visibility === 'members_only' ? 'Members' : 'Gated'}
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
}: {
  tab: WorkspaceHomeTab
  experiences: WorkspaceExperience[]
}) {
  const navigate = useNavigate()
  const tabExps = experiences.filter((e) => tab.experience_ids.includes(e.id))

  function handleOpen(exp: WorkspaceExperience) {
    if (exp.type === 'forum') {
      navigate(`/forum/${exp.id}`)
    } else if (exp.type === 'course') {
      navigate(`/courses`)
    } else if (exp.type === 'group_chat') {
      navigate(`/chat`)
    }
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

  // tile / grid
  const cols = tab.display_mode === 'grid' ? 'grid-cols-3' : 'grid-cols-2'
  return (
    <div className={clsx('grid gap-3', cols)}>
      {tabExps.map((exp) => (
        <ExperienceCard key={exp.id} exp={exp} onClick={() => handleOpen(exp)} />
      ))}
    </div>
  )
}

function AboutTab({ workspace, products }: { workspace: Workspace; products: WorkspaceProduct[] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
        <h3 className="font-semibold text-sm">{t('consumer.about', 'About')}</h3>
        <p className="text-sm text-[var(--olu-text-secondary)]">
          {(workspace as any).headline || 'Welcome to this workspace.'}
        </p>
      </div>

      {products.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm px-1">{t('nav.products', 'Products')}</h3>
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{product.name}</h4>
                  {product.description && <p className="text-xs text-[var(--olu-muted)] mt-0.5">{product.description}</p>}
                </div>
                <span className={clsx(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  product.access_type === 'free'
                    ? 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-400/10 text-amber-600 dark:text-amber-400'
                )}>
                  {product.access_type === 'free' ? 'Free' : 'Paid'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkspaceHome() {
  const { workspaceSlug } = useParams()
  const { t } = useTranslation()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [homeConfig, setHomeConfig] = useState<WorkspaceHomeConfig | null>(null)
  const [experiences, setExperiences] = useState<WorkspaceExperience[]>([])
  const [products, setProducts] = useState<WorkspaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('about')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Resolve workspace by slug
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('slug', workspaceSlug)
          .single()
        if (!ws) { setLoading(false); return }
        setWorkspace(ws)

        const [config, exps, prods] = await Promise.all([
          getHomeConfig(ws.id),
          listExperiences(ws.id),
          listProducts(ws.id),
        ])
        setHomeConfig(config)
        setExperiences(exps)
        setProducts(prods)
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

  const cover = homeConfig?.cover || (workspace as any).cover
  const headline = homeConfig?.headline || (workspace as any).headline
  const tabs = homeConfig?.tabs || []

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      {/* Cover */}
      <div className="h-44 relative bg-gradient-to-br from-cyan-900/40 to-[var(--olu-card-bg)]">
        {cover && (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--olu-bg)]/80 to-transparent" />
      </div>

      {/* Header */}
      <div className="px-4 -mt-6 relative z-10 mb-4">
        <div className="flex items-end gap-3">
          {(workspace as any).icon ? (
            <img src={(workspace as any).icon} alt="" className="w-14 h-14 rounded-2xl border-3 border-[var(--olu-bg)] object-cover shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 border-3 border-[var(--olu-bg)] flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {workspace.name[0]}
            </div>
          )}
          <div className="pb-1">
            <h1 className="font-black text-xl">{workspace.name}</h1>
            {headline && <p className="text-sm text-[var(--olu-text-secondary)]">{headline}</p>}
          </div>
        </div>
      </div>

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
          <AboutTab workspace={workspace} products={products} />
        ) : (
          (() => {
            const tab = tabs.find((t) => t.key === activeTab)
            return tab ? (
              <TabContent tab={tab} experiences={experiences} />
            ) : null
          })()
        )}
      </div>
    </div>
  )
}
