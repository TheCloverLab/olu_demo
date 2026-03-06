import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Megaphone, Target, DollarSign, TrendingUp, Users } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import { getCampaignsByAdvertiser } from '../services/api'
import type { Campaign } from '../lib/supabase'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'creators', label: 'Creator CRM', icon: Users },
] as const

type TabKey = (typeof TABS)[number]['key']

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-olu-muted text-xs">{label}</p>
        <Icon size={14} className="text-olu-muted" />
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  )
}

export default function AdvertiserConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const data = await getCampaignsByAdvertiser(user.id)
        setCampaigns(data)
      } catch (err) {
        console.error('Failed loading advertiser console', err)
      } finally {
        setLoading(false)
      }
    }

    load()
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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-olu-muted">Loading advertiser console...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
          <Megaphone size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Advertiser Console</h1>
          <p className="text-olu-muted text-sm">Live campaign operations from Supabase</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors',
              tab === key ? 'bg-white text-black' : 'bg-[#1b1b1b] text-olu-muted hover:text-white'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Budget" value={`$${Math.round(totals.budget).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Spent" value={`$${Math.round(totals.spent).toLocaleString()}`} icon={TrendingUp} />
            <MetricCard label="Reach" value={compactNumber(totals.reach)} icon={Target} />
            <MetricCard label="Conversions" value={compactNumber(totals.conversions)} icon={Users} />
          </div>

          <div className="glass rounded-2xl p-5">
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
              <div key={campaign.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-olu-muted text-xs">{campaign.start_date} - {campaign.end_date}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-full capitalize', campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-olu-muted')}>
                    {campaign.status}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p className="text-olu-muted">Spent <span className="text-white font-semibold">${Math.round(campaign.spent).toLocaleString()}</span></p>
                  <p className="text-olu-muted">Budget <span className="text-white font-semibold">${Math.round(campaign.budget).toLocaleString()}</span></p>
                  <p className="text-olu-muted">Reach <span className="text-white font-semibold">{compactNumber(campaign.reach)}</span></p>
                  <p className="text-olu-muted">Conversions <span className="text-white font-semibold">{compactNumber(campaign.conversions)}</span></p>
                </div>
              </div>
            )
          })}

          {campaigns.length === 0 && <p className="text-olu-muted text-sm">No campaigns yet.</p>}
        </div>
      )}

      {tab === 'creators' && (
        <div className="glass rounded-2xl p-5">
          <p className="font-semibold mb-2">Creator CRM</p>
          <p className="text-olu-muted text-sm">Creator relationship details will be powered by `campaign_creators` next.</p>
        </div>
      )}
    </div>
  )
}
