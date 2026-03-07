import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, Eye, CheckSquare, ShoppingBag, Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCcw } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getRevenueAnalytics, getViewsAnalytics, getFansByCreator, getIPLicensesByCreator, getIPInfringementsByCreator, getProductsByCreator } from '../../../services/api'
import { getLatestBusinessCampaignForCreator, approveBusinessCampaignTarget, rejectBusinessCampaignTarget } from '../../../domain/campaign/api'
import type { AnalyticsRevenue, AnalyticsViews, BusinessCampaignWorkflow, Fan, IPLicense, IPInfringement, Product } from '../../../lib/supabase'

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'campaigns', label: 'Business Agent', icon: Sparkles },
  { key: 'fans', label: 'Customers', icon: Users },
  { key: 'ip', label: 'IP', icon: CheckSquare },
  { key: 'shop', label: 'Shop', icon: ShoppingBag },
] as const

type TabKey = (typeof TABS)[number]['key']

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-[24px] p-4 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-cyan-100/55 text-xs">{label}</p>
        <Icon size={14} className="text-cyan-100/55" />
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  )
}

export default function CreatorConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('campaigns')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [revenue, setRevenue] = useState<AnalyticsRevenue[]>([])
  const [views, setViews] = useState<AnalyticsViews[]>([])
  const [fans, setFans] = useState<Fan[]>([])
  const [licenses, setLicenses] = useState<IPLicense[]>([])
  const [infringements, setInfringements] = useState<IPInfringement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [workflow, setWorkflow] = useState<BusinessCampaignWorkflow | null>(null)

  async function loadData() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const [revenueData, viewsData, fansData, licensesData, infringementsData, productsData, workflowData] = await Promise.all([
        getRevenueAnalytics(user.id),
        getViewsAnalytics(user.id),
        getFansByCreator(user.id),
        getIPLicensesByCreator(user.id),
        getIPInfringementsByCreator(user.id),
        getProductsByCreator(user.id),
        getLatestBusinessCampaignForCreator(user.id),
      ])

      setRevenue(revenueData)
      setViews(viewsData)
      setFans(fansData)
      setLicenses(licensesData)
      setInfringements(infringementsData)
      setProducts(productsData)
      setWorkflow(workflowData)
    } catch (err) {
      console.error('Failed loading creator console', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const totals = useMemo(() => {
    const totalRevenue = revenue.reduce((acc, r) => acc + r.subscriptions + r.tips + r.shop + r.ip, 0)
    const totalViews = views.reduce((acc, v) => acc + v.tiktok + v.youtube + v.instagram, 0)
    const activeFans = fans.filter((f) => f.status === 'active').length
    return { totalRevenue, totalViews, activeFans }
  }, [revenue, views, fans])

  const myTarget = useMemo(() => {
    if (!workflow || !user?.id) return null
    return workflow.targets.find((target) => target.creator_id === user.id) || workflow.targets[0] || null
  }, [workflow, user?.id])

  const hasIncomingCampaign = ['offer_sent', 'creator_review'].includes(workflow?.campaign.status || '')
  const campaignAccepted = ['approved', 'scheduled', 'published', 'completed'].includes(workflow?.campaign.status || '')

  async function handleApprove() {
    if (!myTarget?.id || !user?.id) return
    setActionLoading(true)
    try {
      const data = await approveBusinessCampaignTarget(myTarget.id, user.id)
      setWorkflow(data)
    } catch (err) {
      console.error('Failed to approve business campaign target', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!myTarget?.id || !user?.id) return
    setActionLoading(true)
    try {
      const data = await rejectBusinessCampaignTarget(myTarget.id, user.id)
      setWorkflow(data)
    } catch (err) {
      console.error('Failed to reject business campaign target', err)
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
    return <div className="max-w-6xl mx-auto px-4 py-8 text-olu-muted">Loading creator console...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div className="rounded-[32px] border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(17,33,53,0.96),rgba(8,19,34,0.88))] p-6 shadow-[0_18px_60px_rgba(2,8,23,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-black text-2xl">Creator Ops</h1>
            <p className="text-cyan-100/60 text-sm mt-1">Creator-side approvals, monetization, and workflow telemetry inside the business workspace</p>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-cyan-400/10 bg-[#0a1525] p-4">
              <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Reward Locked</p>
              <p className="font-black text-2xl">${myTarget?.creator_reward ?? 0}</p>
              <p className="text-cyan-100/60 text-xs mt-1">Current workflow payout</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/10 bg-[#0a1525] p-4">
              <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Current Stage</p>
              <p className="font-black text-2xl capitalize">{workflow?.campaign.status || 'idle'}</p>
              <p className="text-cyan-100/60 text-xs mt-1">Synced from backend campaign state</p>
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
              tab === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[#091422] border border-cyan-500/10 text-cyan-100/60 hover:text-white'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="grid lg:grid-cols-[1.2fr,0.95fr] gap-4">
          <div className="rounded-[32px] p-6 space-y-5 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_50px_rgba(2,8,23,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-cyan-100/55 text-xs uppercase tracking-wider mb-2">KOL-side workspace</p>
                <h2 className="font-black text-2xl">Business Agent inbox</h2>
                <p className="text-cyan-100/60 text-sm mt-2 max-w-2xl">
                  The creator now sees the same workflow from Supabase, not from local UI state. This is the approval step for an incoming advertiser collaboration.
                </p>
              </div>
              <span className={clsx('text-xs px-3 py-1.5 rounded-full font-semibold', campaignAccepted ? 'bg-emerald-500/20 text-emerald-300' : hasIncomingCampaign ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/10 text-cyan-100/60')}>
                {campaignAccepted ? 'Accepted' : hasIncomingCampaign ? 'Needs review' : 'No request'}
              </span>
            </div>

            <div className="rounded-[28px] bg-[#0d1726] p-5 border border-cyan-500/10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-lg">{workflow?.campaign.brand_name || 'No campaign'}</p>
                  <p className="text-cyan-100/55 text-xs mt-1">Promotion request for {myTarget?.creator?.name || user?.name || 'creator'}</p>
                </div>
                <span className="text-sm font-semibold">${myTarget?.offer_amount ?? 0}</span>
              </div>
              <p className="text-sm text-cyan-100/65 leading-relaxed">{myTarget?.creator_message || 'No incoming request yet.'}</p>
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="rounded-2xl bg-[#08111d] p-4 border border-cyan-500/10">
                  <p className="text-cyan-100/55 text-xs mb-1">Deliverable</p>
                  <p className="font-semibold text-sm">{myTarget?.deliverable_type || 'ai_video'}</p>
                </div>
                <div className="rounded-2xl bg-[#08111d] p-4 border border-cyan-500/10">
                  <p className="text-cyan-100/55 text-xs mb-1">Placement fee</p>
                  <p className="font-semibold text-sm">${myTarget?.offer_amount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-[#08111d] p-4 border border-cyan-500/10">
                  <p className="text-cyan-100/55 text-xs mb-1">Queue status</p>
                  <p className="font-semibold text-sm capitalize">{myTarget?.deliverable_status || 'waiting'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleApprove}
                disabled={!hasIncomingCampaign || actionLoading}
                className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Approve campaign
              </button>
              <button
                onClick={handleReject}
                disabled={!hasIncomingCampaign || actionLoading}
                className="px-4 py-2.5 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/65 text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={handleRefresh}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/65 text-sm font-semibold hover:text-white transition-colors inline-flex items-center gap-2 disabled:opacity-40"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-[32px] p-6 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_50px_rgba(2,8,23,0.22)]">
            <p className="font-bold mb-4">Approval story</p>
            <div className="space-y-3">
              {[
                { title: 'Incoming brief', desc: 'Your business agent shows who the advertiser is, what the promo asset looks like, and the fee being offered.', active: hasIncomingCampaign || campaignAccepted },
                { title: 'Creator decision', desc: 'You approve the placement from your own workspace, and the backend writes the new state for both parties.', active: campaignAccepted },
                { title: 'Publishing queue', desc: 'After approval, the campaign can be advanced by the marketer into scheduled and published states.', active: ['scheduled', 'published', 'completed'].includes(workflow?.campaign.status || '') },
                { title: 'Metrics returned', desc: 'The creator-side workspace can see when reported results come back from the live placement.', active: ['completed'].includes(workflow?.campaign.status || '') },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 flex items-start gap-3">
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/10 text-cyan-100/55')}>
                    {item.active ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-cyan-100/60 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#0d1726] p-4 mt-4 border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Creator reward locked</p>
              <p className="font-black text-2xl">${myTarget?.creator_reward ?? 0}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-cyan-100/55 text-xs mb-1">Views</p>
                <p className="font-black text-xl">{compactNumber(myTarget?.reported_views ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-cyan-100/55 text-xs mb-1">Clicks</p>
                <p className="font-black text-xl">{compactNumber(myTarget?.reported_clicks ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                <p className="text-cyan-100/55 text-xs mb-1">Conversions</p>
                <p className="font-black text-xl">{compactNumber(myTarget?.reported_conversions ?? 0)}</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {(workflow?.events || []).slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
                  <p className="font-semibold text-sm">{event.title}</p>
                  <p className="text-cyan-100/60 text-xs mt-1">{event.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Revenue" value={`$${Math.round(totals.totalRevenue).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Total Views" value={compactNumber(totals.totalViews)} icon={Eye} />
            <MetricCard label="Active Customers" value={totals.activeFans.toString()} icon={Users} />
            <MetricCard label="IP Licenses" value={licenses.length.toString()} icon={CheckSquare} />
          </div>

          <div className="rounded-[28px] p-5 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
            <p className="font-bold mb-4">Revenue Breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
                <XAxis dataKey="month" tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="#8b5cf6" fill="#8b5cf633" />
                <Area type="monotone" dataKey="tips" stackId="1" stroke="#f59e0b" fill="#f59e0b33" />
                <Area type="monotone" dataKey="shop" stackId="1" stroke="#10b981" fill="#10b98133" />
                <Area type="monotone" dataKey="ip" stackId="1" stroke="#3b82f6" fill="#3b82f633" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[28px] p-5 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
            <p className="font-bold mb-4">Platform Views</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={views}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
                <XAxis dataKey="month" tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="tiktok" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="youtube" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="instagram" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'fans' && (
        <div className="rounded-[32px] p-5 space-y-3 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
          {fans.map((fan) => (
            <div key={fan.id} className="flex items-center justify-between p-4 rounded-[24px] bg-[#0d1726] border border-cyan-500/10">
              <div>
                <p className="font-medium text-sm">{fan.name}</p>
                <p className="text-cyan-100/55 text-xs">{fan.handle} · {fan.tier}</p>
              </div>
              <p className="text-sm font-semibold">${Math.round(fan.total_spend)}</p>
            </div>
          ))}
          {fans.length === 0 && <p className="text-cyan-100/60 text-sm">No customer data yet.</p>}
        </div>
      )}

      {tab === 'ip' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-[32px] p-5 space-y-3 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
            <p className="font-bold">Licenses</p>
            {licenses.map((item) => (
              <div key={item.id} className="p-4 rounded-[24px] bg-[#0d1726] border border-cyan-500/10">
                <p className="text-sm font-medium">{item.requester}</p>
                <p className="text-cyan-100/55 text-xs">{item.type} · {item.status}</p>
              </div>
            ))}
            {licenses.length === 0 && <p className="text-cyan-100/60 text-sm">No license requests.</p>}
          </div>

          <div className="rounded-[32px] p-5 space-y-3 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
            <p className="font-bold">Infringements</p>
            {infringements.map((item) => (
              <div key={item.id} className="p-4 rounded-[24px] bg-[#0d1726] border border-cyan-500/10">
                <p className="text-sm font-medium">{item.platform} · {item.offender}</p>
                <p className="text-cyan-100/55 text-xs">{item.content} · {item.status}</p>
              </div>
            ))}
            {infringements.length === 0 && <p className="text-cyan-100/60 text-sm">No infringement records.</p>}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="rounded-[32px] p-5 space-y-3 border border-cyan-500/10 bg-[#091523] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 rounded-[24px] bg-[#0d1726] border border-cyan-500/10">
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-cyan-100/55 text-xs">{product.status} · stock {product.stock}</p>
              </div>
              <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
            </div>
          ))}
          {products.length === 0 && <p className="text-cyan-100/60 text-sm">No products yet.</p>}
        </div>
      )}
    </div>
  )
}
