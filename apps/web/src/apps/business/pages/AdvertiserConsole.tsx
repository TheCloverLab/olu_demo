import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Megaphone, Target, DollarSign, TrendingUp, Users, Sparkles, ArrowRight, RefreshCcw, CheckCircle2, Clock3 } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getBusinessCreators, getMarketingCampaignsForAdvertiser } from '../../../domain/business/api'
import { getLatestBusinessCampaignForAdvertiser, startBusinessCampaignDemo, advanceBusinessCampaign } from '../../../domain/campaign/api'
import type { BusinessCampaignWorkflow, Campaign, User } from '../../../lib/supabase'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'mission', label: 'Mission Control', icon: Sparkles },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'creators', label: 'Creator CRM', icon: Users },
] as const

const STAGE_META = {
  draft: { label: 'Draft', tone: 'bg-[var(--olu-accent-bg)] text-[var(--olu-text-secondary)]' },
  sourcing: { label: 'Sourcing', tone: 'bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300' },
  offer_sent: { label: 'Offer Sent', tone: 'bg-amber-500/20 text-amber-600 dark:text-amber-300' },
  creator_review: { label: 'Creator Review', tone: 'bg-amber-500/20 text-amber-600 dark:text-amber-300' },
  approved: { label: 'Approved', tone: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  scheduled: { label: 'Scheduled', tone: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  published: { label: 'Published', tone: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  reporting: { label: 'Reporting', tone: 'bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300' },
  completed: { label: 'Completed', tone: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' },
  cancelled: { label: 'Cancelled', tone: 'bg-red-500/20 text-red-300' },
} as const

type TabKey = (typeof TABS)[number]['key']

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-[24px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[var(--olu-text-secondary)] text-xs">{label}</p>
        <Icon size={14} className="text-[var(--olu-text-secondary)]" />
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  )
}

export default function AdvertiserConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('mission')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [workflow, setWorkflow] = useState<BusinessCampaignWorkflow | null>(null)
  const [creators, setCreators] = useState<User[]>([])
  const [selectedCreatorId, setSelectedCreatorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const [campaignData, workflowData] = await Promise.all([
        getMarketingCampaignsForAdvertiser(user.id),
        getLatestBusinessCampaignForAdvertiser(user.id),
      ])
      const creatorData = await getBusinessCreators()
      setCampaigns(campaignData)
      setWorkflow(workflowData)
      setCreators(creatorData)
      setSelectedCreatorId((current) => current || workflowData?.targets?.[0]?.creator_id || creatorData[0]?.id || '')
    } catch (err) {
      console.error('Failed loading advertiser console', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const totals = useMemo(() => {
    const budget = campaigns.reduce((acc, c) => acc + Number(c.budget), 0)
    const spent = campaigns.reduce((acc, c) => acc + Number(c.spent), 0)
    const reach = campaigns.reduce((acc, c) => acc + Number(c.reach), 0)
    const conversions = campaigns.reduce((acc, c) => acc + Number(c.conversions), 0)
    return { budget, spent, reach, conversions }
  }, [campaigns])

  const chartData = campaigns.map((c) => ({
    name: c.name,
    budget: Number(c.budget),
    spent: Number(c.spent),
    conversions: Number(c.conversions),
  }))

  const stageMeta = workflow ? STAGE_META[workflow.campaign.status] : STAGE_META.draft
  const primaryTarget = workflow?.targets[0]
  const selectedCreator = creators.find((creator) => creator.id === selectedCreatorId) || null
  const demoProgress = useMemo(() => {
    if (!workflow) return 0
    const stageOrder = ['draft', 'sourcing', 'offer_sent', 'approved', 'scheduled', 'published', 'completed']
    const index = stageOrder.indexOf(workflow.campaign.status)
    return index <= 0 ? 0 : (index / (stageOrder.length - 1)) * 100
  }, [workflow])

  async function handleStart() {
    if (!user?.id || !selectedCreatorId) return
    setActionLoading(true)
    try {
      const data = await startBusinessCampaignDemo(user.id, selectedCreatorId)
      setWorkflow(data)
    } catch (err) {
      console.error('Failed to start business campaign demo', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAdvance() {
    if (!workflow?.campaign.id || !user?.id) return
    setActionLoading(true)
    try {
      const data = await advanceBusinessCampaign(workflow.campaign.id, user.id)
      setWorkflow(data)
    } catch (err) {
      console.error('Failed to advance business campaign', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRefresh() {
    setActionLoading(true)
    try {
      await loadData()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-[var(--olu-text-secondary)]">Loading advertiser console...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="rounded-[32px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
              <Megaphone size={18} className="text-cyan-700 dark:text-cyan-200" />
            </div>
            <div>
              <h1 className="font-black text-2xl">Marketing Workspace</h1>
              <p className="text-[var(--olu-text-secondary)] text-sm">Influencer campaign operations, creator approvals, and reporting inside the business workspace</p>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4">
              <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.18em] mb-2">Live Stage</p>
              <p className="font-black text-2xl">{stageMeta.label}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Current workflow progression</p>
            </div>
            <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4">
              <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.18em] mb-2">Reach Returned</p>
              <p className="font-black text-2xl">{compactNumber(workflow?.campaign.reported_reach || 0)}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Synced from backend workflow data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors',
              tab === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)]'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'mission' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-[1.25fr,0.9fr] gap-4">
            <div className="rounded-[32px] p-6 space-y-5 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">Mission control</p>
                  <h2 className="font-black text-2xl">{workflow?.campaign.brand_name || 'No active workflow'}</h2>
                  <p className="text-[var(--olu-text-secondary)] text-sm mt-2 max-w-2xl">
                    {workflow?.campaign.objective || 'Start a real workflow row in Supabase, then drive it across marketer and creator workspaces.'}
                  </p>
                </div>
                <span className={clsx('text-xs px-3 py-1.5 rounded-full font-semibold', stageMeta.tone)}>
                  {stageMeta.label}
                </span>
              </div>

              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all" style={{ width: `${demoProgress}%` }} />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Budget</p>
                  <p className="font-black text-xl">${workflow?.campaign.budget ?? 0}</p>
                </div>
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Spent</p>
                  <p className="font-black text-xl">${workflow?.campaign.budget_spent ?? 0}</p>
                </div>
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Creator Fee</p>
                  <p className="font-black text-xl">${primaryTarget?.offer_amount ?? 0}</p>
                </div>
              </div>

              <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Clock3 size={14} className="text-[var(--olu-text-secondary)]" />
                  <p className="font-semibold text-sm">Latest workflow event</p>
                </div>
                <p className="text-sm text-white">{workflow?.events[0]?.title || 'No activity yet'}</p>
                <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed mt-2">{workflow?.events[0]?.detail || 'The workflow timeline will appear here once you create or advance it.'}</p>
              </div>

              <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                <p className="font-semibold text-sm mb-3">Target creator</p>
                <select
                  value={selectedCreatorId}
                  onChange={(e) => setSelectedCreatorId(e.target.value)}
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-[var(--olu-header-bg)] border border-[var(--olu-card-border)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--olu-card-border)]"
                >
                  {creators.map((creator) => (
                    <option key={creator.id} value={creator.id}>
                      {creator.name} ({creator.handle})
                    </option>
                  ))}
                </select>
                <p className="text-[var(--olu-text-secondary)] text-xs mt-2">
                  New workflows are now tied to a selected creator instead of a hardcoded seed account.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStart}
                  disabled={actionLoading || !selectedCreatorId}
                  className="px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Start workflow for {selectedCreator?.name || 'creator'}
                </button>
                <button
                  onClick={handleAdvance}
                  disabled={actionLoading || !workflow || !['sourcing', 'approved', 'scheduled', 'published'].includes(workflow.campaign.status)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-white text-sm font-semibold disabled:opacity-40"
                >
                  Advance marketer step
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-sm font-semibold hover:text-[var(--olu-text)] transition-colors inline-flex items-center gap-2 disabled:opacity-40"
                >
                  <RefreshCcw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-[32px] p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="font-bold mb-4">Execution stages</p>
              <div className="space-y-3">
                {[
                  { title: '1. Source KOLs', desc: 'Agent finds sports creators and ranks them by fit.', active: ['sourcing', 'offer_sent', 'approved', 'scheduled', 'completed'].includes(workflow?.campaign.status || 'draft') },
                  { title: '2. Send package', desc: 'Offer includes AI video sample, fee, and posting requirements.', active: ['offer_sent', 'approved', 'scheduled', 'completed'].includes(workflow?.campaign.status || 'draft') },
                  { title: '3. Creator approval', desc: 'KOL-side business agent requests approval in creator workspace.', active: ['approved', 'scheduled', 'completed'].includes(workflow?.campaign.status || 'draft') },
                  { title: '4. Scheduled publish', desc: 'Approved promo moves into creator publishing queue.', active: ['scheduled', 'published', 'completed'].includes(workflow?.campaign.status || 'draft') },
                  { title: '5. Metrics return', desc: 'First-day reach, clicks, and conversions come back into marketing workspace.', active: ['completed'].includes(workflow?.campaign.status || 'draft') },
                ].map((step) => (
                  <div key={step.title} className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-start gap-3">
                    <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', step.active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-[var(--olu-accent-bg)] text-[var(--olu-text-secondary)]')}>
                      {step.active ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{step.title}</p>
                      <p className="text-[var(--olu-text-secondary)] text-xs mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-[32px] p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="font-bold mb-4">Creator pipeline</p>
              <div className="space-y-3">
                {(workflow?.targets || []).map((target) => (
                  <div key={target.id} className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{target.creator?.name || 'Creator'}</p>
                      <p className="text-[var(--olu-text-secondary)] text-xs mt-1">{target.stage} · {target.deliverable_status}</p>
                    </div>
                    <span className="text-sm font-semibold">${target.offer_amount}</span>
                  </div>
                ))}
                {!workflow && <p className="text-[var(--olu-text-secondary)] text-sm">No live workflow yet.</p>}
              </div>
            </div>

            <div className="rounded-[32px] p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="font-bold mb-4">Activity log</p>
              <div className="space-y-3">
                {(workflow?.events || []).map((event) => (
                  <div key={event.id} className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                    <p className="font-semibold text-sm">{event.title}</p>
                    <p className="text-[var(--olu-text-secondary)] text-xs mt-1 leading-relaxed">{event.detail}</p>
                  </div>
                ))}
                {!workflow && <p className="text-[var(--olu-text-secondary)] text-sm">Create a workflow to see persistent timeline events.</p>}
              </div>
            </div>
          </div>

          {workflow && (
            <div className="rounded-[32px] p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="font-bold mb-4">Reported outcome</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Reach</p>
                  <p className="font-black text-xl">{compactNumber(workflow.campaign.reported_reach || 0)}</p>
                </div>
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Conversions</p>
                  <p className="font-black text-xl">{compactNumber(workflow.campaign.reported_conversions || 0)}</p>
                </div>
                <div className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Clicks</p>
                  <p className="font-black text-xl">{compactNumber(primaryTarget?.reported_clicks || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Budget" value={`$${Math.round(totals.budget).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Spent" value={`$${Math.round(totals.spent).toLocaleString()}`} icon={TrendingUp} />
            <MetricCard label="Reach" value={compactNumber(totals.reach)} icon={Target} />
            <MetricCard label="Conversions" value={compactNumber(totals.conversions)} icon={Users} />
          </div>

          <div className="rounded-[28px] p-5 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
            <p className="font-bold mb-4">Budget vs Spend</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
                <XAxis dataKey="name" tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="budget" stroke="#3b82f6" fill="#3b82f633" />
                <Area type="monotone" dataKey="spent" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const progress = campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0
            return (
              <div key={campaign.id} className="rounded-[28px] p-5 space-y-3 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-[var(--olu-text-secondary)] text-xs">{campaign.start_date} - {campaign.end_date}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-full capitalize', campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-[var(--olu-accent-bg)] text-[var(--olu-text-secondary)]')}>
                    {campaign.status}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p className="text-[var(--olu-text-secondary)]">Spent <span className="text-white font-semibold">${Math.round(campaign.spent).toLocaleString()}</span></p>
                  <p className="text-[var(--olu-text-secondary)]">Budget <span className="text-white font-semibold">${Math.round(campaign.budget).toLocaleString()}</span></p>
                  <p className="text-[var(--olu-text-secondary)]">Reach <span className="text-white font-semibold">{compactNumber(campaign.reach)}</span></p>
                  <p className="text-[var(--olu-text-secondary)]">Conversions <span className="text-white font-semibold">{compactNumber(campaign.conversions)}</span></p>
                </div>
              </div>
            )
          })}

          {campaigns.length === 0 && <p className="text-[var(--olu-text-secondary)] text-sm">No campaigns yet.</p>}
        </div>
      )}

      {tab === 'creators' && (
        <div className="rounded-[32px] p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
          <p className="font-semibold mb-4">Creator CRM</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {creators.slice(0, 6).map((creator) => (
              <div key={creator.id} className="rounded-[24px] bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-center gap-3">
                {creator.avatar_img ? (
                  <img src={creator.avatar_img} alt={creator.name} className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center text-sm font-bold text-white`}>
                    {creator.initials || creator.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{creator.name}</p>
                  <p className="text-[var(--olu-text-secondary)] text-xs">{creator.handle}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-4">Mission Control now reads the cross-workspace workflow from backend tables. The next step is expanding this into broader creator relationship records.</p>
        </div>
      )}
    </div>
  )
}
