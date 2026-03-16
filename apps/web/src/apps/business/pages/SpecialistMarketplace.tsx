import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Download, Zap, Crown, Loader2 } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listSpecialists, getUserInstalls, installSpecialist, hireSpecialistAsAgent } from '../../../domain/specialist/api'
import { createProject } from '../../../domain/project/api'
import type { SpecialistTemplate, SpecialistInstall } from '../../../domain/specialist/types'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  marketing: 'Marketing',
  content: 'Content',
  support: 'Support',
  research: 'Research',
  operations: 'Operations',
  general: 'General',
}

export default function SpecialistMarketplace() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspace, currentUser } = useApp()

  const [specialists, setSpecialists] = useState<SpecialistTemplate[]>([])
  const [installs, setInstalls] = useState<SpecialistInstall[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace?.id || !currentUser?.id) return
    setLoading(true)
    Promise.all([
      listSpecialists(workspace.id),
      getUserInstalls(currentUser.id, workspace.id),
    ])
      .then(([specs, ins]) => {
        setSpecialists(specs)
        setInstalls(ins)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [workspace?.id, currentUser?.id])

  const installedIds = new Set(installs.map((i) => i.template_id))

  const filtered = specialists.filter((s) => {
    if (category !== 'all' && s.category !== category) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = ['all', ...new Set(specialists.map((s) => s.category))]

  async function handleInstall(template: SpecialistTemplate) {
    if (!workspace?.id || !currentUser?.id) return
    setInstalling(template.id)
    try {
      // Create a project from this specialist template
      const project = await createProject(workspace.id, currentUser.id, template.name, {
        description: template.description || undefined,
        config: {
          skills: template.skills,
          instructions: template.instructions || undefined,
        },
      })

      // Record the install + create workspace_agent for Team page
      await installSpecialist(template.id, currentUser.id, workspace.id, project.id)
      await hireSpecialistAsAgent(workspace.id, currentUser.id, template).catch(() => {})

      // Update local state
      setInstalls((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        template_id: template.id,
        user_id: currentUser.id,
        workspace_id: workspace.id,
        project_id: project.id,
        created_at: new Date().toISOString(),
      }])

      // Navigate to the new project
      navigate(`/business/projects/${project.id}`)
    } catch (err) {
      console.error('Failed to install specialist:', err)
    } finally {
      setInstalling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--olu-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-muted)] text-xs tracking-wider mb-2">{t('nav.workspace')}</p>
          <h1 className="font-black text-2xl">{t('specialists.title', 'Specialists')}</h1>
          <p className="text-[var(--olu-muted)] text-sm mt-1">
            {t('specialists.subtitle', 'Pre-configured AI agent templates — install to create a project instantly')}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--olu-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('specialists.searchPlaceholder', 'Search specialists...')}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-xl text-sm text-[var(--olu-text)] placeholder:text-[var(--olu-muted)]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[var(--olu-primary)] text-white'
                  : 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-muted)] hover:text-[var(--olu-text)]'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center space-y-3">
          <Zap size={32} className="text-[var(--olu-muted)] mx-auto" />
          <p className="text-[var(--olu-muted)] text-sm">{t('specialists.empty', 'No specialists found')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((spec) => {
            const isInstalled = installedIds.has(spec.id)
            const isLoading = installing === spec.id

            return (
              <div
                key={spec.id}
                className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Icon + Name */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{spec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[var(--olu-text)] truncate">{spec.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--olu-accent-bg)] text-[var(--olu-muted)] capitalize">
                      {spec.category}
                    </span>
                  </div>
                  {spec.access_type === 'paid' && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                      <Crown className="w-3 h-3" />
                      ${spec.price}
                    </span>
                  )}
                </div>

                {/* Description */}
                {spec.description && (
                  <p className="text-xs text-[var(--olu-muted)] line-clamp-2">{spec.description}</p>
                )}

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {spec.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--olu-primary)]/10 text-[var(--olu-primary)]"
                    >
                      {skill}
                    </span>
                  ))}
                  {spec.skills.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--olu-accent-bg)] text-[var(--olu-muted)]">
                      +{spec.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Install count + Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--olu-muted)]">
                    <Download className="w-3 h-3 inline mr-0.5" />
                    {spec.install_count} {t('specialists.installs', 'installs')}
                  </span>

                  {isInstalled ? (
                    <span className="text-xs text-green-500 font-medium">
                      {t('specialists.installed', 'Installed')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInstall(spec)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--olu-primary)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {t('specialists.install', 'Install')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
