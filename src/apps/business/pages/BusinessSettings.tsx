import { useEffect, useMemo, useState } from 'react'
import { Bell, Cable, ChevronLeft, CreditCard, KeyRound, ShieldCheck, Users, Wrench, Sparkles, Megaphone, PackageCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceSettingsForUser, updateWorkspaceModuleForUser } from '../../../domain/workspace/api'
import type { BusinessModuleKey, ConsumerCourse, User, WorkspaceSettingsData } from '../../../lib/supabase'
import { CONSUMER_TEMPLATE_META } from '../../consumer/templateConfig'
import { getCreators, getConsumerCourses } from '../../../services/api'

const MODULE_METADATA: Array<{
  key: BusinessModuleKey
  label: string
  description: string
  icon: typeof Sparkles
  accentClass: string
}> = [
  {
    key: 'creator_ops',
    label: 'Creator Ops',
    description: 'Approvals, IP control, customers, and shop operations for creator-side work.',
    icon: Sparkles,
    accentClass: 'bg-cyan-400/12 text-cyan-200 border-cyan-400/20',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Campaign sourcing, offer routing, and performance loops for advertiser workflows.',
    icon: Megaphone,
    accentClass: 'bg-blue-500/12 text-blue-200 border-blue-400/20',
  },
  {
    key: 'supply_chain',
    label: 'Supply Chain',
    description: 'Supplier partnerships, catalog readiness, and merch operations across creators.',
    icon: PackageCheck,
    accentClass: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/20',
  },
]

export default function BusinessSettings() {
  const navigate = useNavigate()
  const { consumerConfig, consumerTemplate, currentUser, reloadBusinessModules, setConsumerConfig } = useApp()
  const { user } = useAuth()
  const [settings, setSettings] = useState<WorkspaceSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingModule, setSavingModule] = useState<BusinessModuleKey | null>(null)
  const [creatorOptions, setCreatorOptions] = useState<User[]>([])
  const [courseOptions, setCourseOptions] = useState<ConsumerCourse[]>([])
  const currentConsumerConfig = settings?.consumerConfig?.config_json || consumerConfig
  const activeConsumerApp = CONSUMER_TEMPLATE_META[(settings?.consumerConfig?.template_key || consumerTemplate)]

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const data = await getWorkspaceSettingsForUser(user)
        if (!cancelled) {
          setSettings(data)
        }
      } catch (error) {
        console.error('Failed to load workspace settings', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSettings()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    async function loadConsumerOptions() {
      try {
        const [creators, courses] = await Promise.all([
          getCreators(),
          getConsumerCourses(),
        ])
        if (!cancelled) {
          setCreatorOptions(creators)
          setCourseOptions(courses)
        }
      } catch (error) {
        console.error('Failed to load consumer options', error)
      }
    }

    loadConsumerOptions()
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshSettings() {
    if (!user) return
    const data = await getWorkspaceSettingsForUser(user)
    setSettings(data)
  }

  const connectors = useMemo(() => {
    return (settings?.integrations || []).map((integration) => ({
      name: integration.provider,
      status: integration.status === 'connected' ? 'Connected' : integration.status === 'planned' ? 'Planned' : integration.status === 'error' ? 'Error' : 'Disconnected',
      tone:
        integration.status === 'connected'
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
          : integration.status === 'error'
            ? 'bg-red-500/15 text-red-300 border-red-500/20'
            : 'bg-white/8 text-cyan-100/60 border-cyan-500/10',
    }))
  }, [settings?.integrations])

  const approvalRules = useMemo(() => {
    const approval = settings?.policies?.approval_policy || {}
    const sandbox = settings?.policies?.sandbox_policy || {}

    return [
      approval.publish_requires_marketer_approval
        ? 'Publishing requires marketer approval after creator acceptance.'
        : 'Publishing can proceed without marketer approval.',
      `Budget changes above $${approval.budget_change_review_threshold ?? 500} need workspace owner review.`,
      `Sandbox takeover is ${sandbox.takeover_mode || 'manual'} for high-risk automations.`,
    ]
  }, [settings?.policies])

  const moduleStates = useMemo(() => {
    const enabledMap = new Map((settings?.modules || []).map((module) => [module.module_key, module.enabled]))
    return MODULE_METADATA.map((module) => ({
      ...module,
      enabled: enabledMap.get(module.key) ?? false,
    }))
  }, [settings?.modules])

  async function handleToggleModule(moduleKey: BusinessModuleKey, enabled: boolean) {
    if (!user) return

    setSavingModule(moduleKey)
    try {
      await updateWorkspaceModuleForUser(user, moduleKey, enabled)
      await refreshSettings()
      await reloadBusinessModules()
    } catch (error) {
      console.error('Failed to update workspace module', error)
    } finally {
      setSavingModule(null)
    }
  }

  function handleConsumerConfigChange(config: Partial<typeof consumerConfig>) {
    setConsumerConfig(config)
    setSettings((current) => current ? {
      ...current,
      consumerConfig: current.consumerConfig
        ? {
            ...current.consumerConfig,
            config_json: {
              ...(current.consumerConfig.config_json || {}),
              ...config,
            },
          }
        : {
            id: 'local-consumer-config',
            workspace_id: current.workspace.id,
            template_key: consumerTemplate,
            config_json: {
              featured_template: consumerTemplate,
              ...config,
            },
          },
    } : current)
  }

  function getTopicEntries() {
    if (!Array.isArray(currentConsumerConfig.community_topic_entries)) return []
    return currentConsumerConfig.community_topic_entries.map((entry: any, index: number) => ({
      id: typeof entry?.id === 'string' && entry.id.trim().length > 0 ? entry.id : `custom-topic-${index + 1}`,
      name: typeof entry?.name === 'string' ? entry.name : '',
      members: typeof entry?.members === 'string' ? entry.members : '',
      description: typeof entry?.description === 'string' ? entry.description : '',
    }))
  }

  function updateTopicEntries(entries: Array<{ id: string; name: string; members: string; description: string }>) {
    handleConsumerConfigChange({ community_topic_entries: entries })
  }

  function handleTopicEntryChange(index: number, field: 'name' | 'members' | 'description', value: string) {
    const entries = getTopicEntries()
    updateTopicEntries(entries.map((entry, entryIndex) => (
      entryIndex === index
        ? { ...entry, [field]: value }
        : entry
    )))
  }

  function handleCreateTopicEntry() {
    const entries = getTopicEntries()
    updateTopicEntries([
      ...entries,
      {
        id: `custom-topic-${Date.now()}`,
        name: 'New topic',
        members: '0',
        description: 'Describe what members gather here to do together.',
      },
    ])
  }

  function handleMoveTopicEntry(index: number, direction: -1 | 1) {
    const entries = getTopicEntries()
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= entries.length) return
    const next = [...entries]
    const [entry] = next.splice(index, 1)
    next.splice(targetIndex, 0, entry)
    updateTopicEntries(next)
  }

  function handleRemoveTopicEntry(index: number) {
    updateTopicEntries(getTopicEntries().filter((_, entryIndex) => entryIndex !== index))
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 text-cyan-100/60">Loading workspace settings...</div>
  }

  const topicEntries = getTopicEntries()

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/business')}
          className="p-2 rounded-full hover:bg-[#0d1a2d] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Workspace Settings</p>
          <h1 className="font-black text-2xl md:text-3xl">Business operating rules and system controls</h1>
          <p className="text-cyan-100/60 text-sm md:text-base mt-2 max-w-3xl">
            This page controls how the workspace runs. It is intentionally separate from account identity, which lives in business account.
          </p>
        </div>
      </div>

      <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-4">
        <div className="rounded-3xl p-6 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-11 h-11 rounded-2xl bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
              <Wrench size={18} />
            </span>
            <div>
              <p className="font-bold">Workspace control plane</p>
              <p className="text-cyan-100/60 text-xs">Rules, integrations, and operator policy</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Workspace</p>
              <p className="font-semibold text-sm">{settings?.workspace.name || `${currentUser.name} Workspace`}</p>
              <p className="text-cyan-100/50 text-xs mt-1">{user?.email}</p>
            </div>
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Capabilities</p>
              <p className="font-black text-2xl">{settings?.modules.filter((module) => module.enabled).length ?? 0}</p>
              <p className="text-cyan-100/50 text-xs mt-1">Modules enabled</p>
            </div>
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Membership role</p>
              <p className="font-semibold text-sm capitalize">{settings?.membership.membership_role || 'owner'}</p>
              <p className="text-cyan-100/50 text-xs mt-1">Workspace control scope</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-cyan-200" />
              <p className="font-semibold text-sm">Members and permissions</p>
            </div>
            <div className="space-y-3 text-sm">
              {(settings?.permissions || []).slice(0, 3).map((permission) => (
                <div key={`${permission.membership_role}-${permission.resource}-${permission.action}`} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">{permission.membership_role}</p>
                    <p className="text-cyan-100/55 text-xs">{permission.resource} · {permission.action}</p>
                  </div>
                  <span className={permission.allowed ? 'px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-200 text-xs' : 'px-3 py-1 rounded-full bg-white/8 text-cyan-100/70 text-xs'}>
                    {permission.allowed ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="font-bold">Capabilities</p>
                <p className="text-cyan-100/55 text-xs">Enable the operator surfaces available in this workspace</p>
              </div>
            </div>
            <div className="space-y-3">
              {moduleStates.map((module) => {
                const Icon = module.icon
                const isSaving = savingModule === module.key
                return (
                  <div key={module.key} className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
                    <div className="flex items-start gap-3">
                      <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${module.accentClass}`}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{module.label}</p>
                        <p className="text-cyan-100/55 text-xs max-w-md mt-1">{module.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleModule(module.key, !module.enabled)}
                      className={`min-w-[112px] rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        module.enabled
                          ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'
                          : 'bg-white/8 text-cyan-50 border border-cyan-500/10 hover:bg-white/12'
                      }`}
                    >
                      {isSaving ? 'Saving...' : module.enabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                <Cable size={18} />
              </span>
              <div>
                <p className="font-bold">Connected platforms</p>
                <p className="text-cyan-100/55 text-xs">Commerce, support, analytics</p>
              </div>
            </div>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <div key={connector.name} className="flex items-center justify-between gap-3 rounded-2xl p-3 bg-[#0d1726] border border-cyan-500/10">
                  <div>
                    <p className="font-medium text-sm">{connector.name}</p>
                    <p className="text-cyan-100/50 text-xs">Available to workspace operators</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-xs ${connector.tone}`}>
                    {connector.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="font-bold">Consumer app</p>
                <p className="text-cyan-100/55 text-xs">This workspace already has a public-facing app type. Configure its content and featured surfaces below.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${activeConsumerApp.accent} mb-3`} />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{activeConsumerApp.label}</p>
                  <p className="text-xs text-cyan-100/60 mt-2">{activeConsumerApp.description}</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Current app</span>
              </div>
              <p className="text-[11px] text-cyan-100/45 mt-3">
                App type is treated as the merchant&apos;s public product shape. Switch it only during onboarding or an explicit migration flow, not from day-to-day settings.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Featured creator</p>
                <select
                  aria-label="Featured creator"
                  value={currentConsumerConfig.featured_creator_id || ''}
                  onChange={(event) => handleConsumerConfigChange({ featured_creator_id: event.target.value || null })}
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Auto</option>
                  {creatorOptions.map((creator) => (
                    <option key={creator.id} value={creator.id}>{creator.name}</option>
                  ))}
                </select>
              </label>
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Featured course</p>
                <select
                  aria-label="Featured course"
                  value={currentConsumerConfig.featured_course_slug || ''}
                  onChange={(event) => handleConsumerConfigChange({ featured_course_slug: event.target.value || null })}
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Auto</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.slug}>{course.title}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Community hero title</p>
                <input
                  aria-label="Community hero title"
                  value={currentConsumerConfig.community_hero_title || ''}
                  onChange={(event) => handleConsumerConfigChange({ community_hero_title: event.target.value })}
                  placeholder="A place for members, rituals, and conversations..."
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Community hero description</p>
                <textarea
                  aria-label="Community hero description"
                  value={currentConsumerConfig.community_hero_description || ''}
                  onChange={(event) => handleConsumerConfigChange({ community_hero_description: event.target.value })}
                  placeholder="Join creator spaces built around access, identity..."
                  rows={3}
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Membership title</p>
                <input
                  aria-label="Membership title"
                  value={currentConsumerConfig.community_membership_title || ''}
                  onChange={(event) => handleConsumerConfigChange({ community_membership_title: event.target.value })}
                  placeholder="Join the community"
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Membership subtitle</p>
                <input
                  aria-label="Membership subtitle"
                  value={currentConsumerConfig.community_membership_subtitle || ''}
                  onChange={(event) => handleConsumerConfigChange({ community_membership_subtitle: event.target.value })}
                  placeholder="A clear ladder from casual follower to committed member."
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Topics title</p>
                <input
                  aria-label="Topics title"
                  value={currentConsumerConfig.community_topics_title || ''}
                  onChange={(event) => handleConsumerConfigChange({ community_topics_title: event.target.value })}
                  placeholder="Browse active topics"
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
              <div className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55">Community topics</p>
                    <p className="text-[11px] text-cyan-100/45 mt-1">Create, reorder, and remove the topics shown on the public community page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateTopicEntry}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/15"
                  >
                    New topic
                  </button>
                </div>
                <div className="space-y-3">
                  {topicEntries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-cyan-500/15 px-4 py-5 text-sm text-cyan-100/50">
                      No topics configured yet.
                    </div>
                  ) : (
                    topicEntries.map((entry, index) => (
                      <div key={entry.id} className="rounded-2xl border border-cyan-500/10 bg-[#091422] p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">Topic {index + 1}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveTopicEntry(index, -1)}
                              disabled={index === 0}
                              className="rounded-full border border-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100/70 disabled:opacity-40"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveTopicEntry(index, 1)}
                              disabled={index === topicEntries.length - 1}
                              className="rounded-full border border-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100/70 disabled:opacity-40"
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopicEntry(index)}
                              className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/45 mb-1.5">Name</p>
                            <input
                              aria-label={`Topic name ${index + 1}`}
                              value={entry.name}
                              onChange={(event) => handleTopicEntryChange(index, 'name', event.target.value)}
                              placeholder="Weekly Critique Room"
                              className="w-full rounded-xl bg-[#07111d] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                            />
                          </label>
                          <label className="block">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/45 mb-1.5">Members</p>
                            <input
                              aria-label={`Topic members ${index + 1}`}
                              value={entry.members}
                              onChange={(event) => handleTopicEntryChange(index, 'members', event.target.value)}
                              placeholder="1.8K"
                              className="w-full rounded-xl bg-[#07111d] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                            />
                          </label>
                        </div>
                        <label className="block">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/45 mb-1.5">Description</p>
                          <textarea
                            aria-label={`Topic description ${index + 1}`}
                            value={entry.description}
                            onChange={(event) => handleTopicEntryChange(index, 'description', event.target.value)}
                            rows={3}
                            placeholder="Members post work-in-progress and get feedback."
                            className="w-full rounded-xl bg-[#07111d] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                          />
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course storefront title</p>
                <input
                  aria-label="Course storefront title"
                  value={currentConsumerConfig.courses_storefront_title || ''}
                  onChange={(event) => handleConsumerConfigChange({ courses_storefront_title: event.target.value })}
                  placeholder="Sell structured knowledge, not merch."
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Course storefront description</p>
                <textarea
                  aria-label="Course storefront description"
                  value={currentConsumerConfig.courses_storefront_description || ''}
                  onChange={(event) => handleConsumerConfigChange({ courses_storefront_description: event.target.value })}
                  placeholder="This template replaces the merch shop with a course catalog..."
                  rows={3}
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none resize-none"
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Catalog title</p>
                <input
                  aria-label="Catalog title"
                  value={currentConsumerConfig.courses_catalog_title || ''}
                  onChange={(event) => handleConsumerConfigChange({ courses_catalog_title: event.target.value })}
                  placeholder="Course Catalog"
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="rounded-2xl border border-cyan-500/10 bg-[#0d1726] p-4 block">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/55 mb-2">Catalog subtitle</p>
                <input
                  aria-label="Catalog subtitle"
                  value={currentConsumerConfig.courses_catalog_subtitle || ''}
                  onChange={(event) => handleConsumerConfigChange({ courses_catalog_subtitle: event.target.value })}
                  placeholder="Structured offers with clear outcomes and chapter flow."
                  className="w-full rounded-xl bg-[#091422] border border-cyan-500/10 px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="font-bold">Approval policy</p>
                <p className="text-cyan-100/55 text-xs">Operational safeguards</p>
              </div>
            </div>
            <div className="space-y-2">
              {approvalRules.map((rule) => (
                <div key={rule} className="rounded-2xl p-3 bg-[#0d1726] border border-cyan-500/10 text-sm text-cyan-50/80">
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                  <KeyRound size={18} />
                </span>
                <div>
                  <p className="font-bold">Security</p>
                  <p className="text-cyan-100/55 text-xs">Session and access</p>
                </div>
              </div>
              <p className="text-sm text-cyan-50/75">Single operator login, {settings?.policies?.sandbox_policy?.takeover_mode || 'manual'} review for sensitive flows, and sandbox takeover visible at the workspace layer.</p>
            </div>

            <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="font-bold">Notifications</p>
                  <p className="text-cyan-100/55 text-xs">Team routing</p>
                </div>
              </div>
              <p className="text-sm text-cyan-50/75">Creator approvals, rejected offers, and publish events route into the business workspace: {settings?.policies?.notification_policy?.route_publish_events_to_workspace ? 'enabled' : 'disabled'}.</p>
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="font-bold">Billing state</p>
                <p className="text-cyan-100/55 text-xs">MVP placeholder</p>
              </div>
            </div>
              <p className="text-sm text-cyan-50/75">Current plan: {settings?.billing?.plan || 'starter'} · status: {settings?.billing?.status || 'trial'} · billing contact: {settings?.billing?.billing_email || user?.email}.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
