import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Megaphone, Target, DollarSign, TrendingUp, ChevronRight, ArrowUpRight, Check, Clock, Users } from 'lucide-react'
import { CAMPAIGNS, CREATORS, formatNumber } from '../data/mock'
import clsx from 'clsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'creators', label: 'Creator CRM', icon: Users },
]

const STAGE_COLOR = {
  live: 'bg-emerald-500/15 text-emerald-400',
  production: 'bg-blue-500/15 text-blue-400',
  negotiating: 'bg-amber-500/15 text-amber-400',
  outreach: 'bg-gray-500/15 text-gray-400',
  completed: 'bg-violet-500/15 text-violet-400',
}

const SPEND_DATA = [
  { day: 'Jun 10', spend: 2000, conversions: 450 },
  { day: 'Jun 12', spend: 4500, conversions: 980 },
  { day: 'Jun 14', spend: 6200, conversions: 1400 },
  { day: 'Jun 16', spend: 7100, conversions: 1700 },
  { day: 'Jun 18', spend: 8900, conversions: 2100 },
  { day: 'Jun 20', spend: 10200, conversions: 2600 },
  { day: 'Jun 22', spend: 11800, conversions: 3100 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-olu-surface border border-olu-border rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-olu-muted capitalize">{p.dataKey}:</span>
          <span className="font-semibold">{p.dataKey === 'spend' ? `$${p.value?.toLocaleString()}` : p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ value, max, color = 'bg-violet-600' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-2 bg-white/08 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Dashboard() {
  const active = CAMPAIGNS.filter(c => c.status === 'active')
  const totalBudget = CAMPAIGNS.reduce((acc, c) => acc + c.budget, 0)
  const totalSpent = CAMPAIGNS.reduce((acc, c) => acc + c.spent, 0)
  const totalReach = CAMPAIGNS.reduce((acc, c) => acc + c.reach, 0)
  const totalConversions = CAMPAIGNS.reduce((acc, c) => acc + c.conversions, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, change: 0, icon: DollarSign, color: 'from-blue-600 to-cyan-600' },
          { label: 'Spent', value: `$${totalSpent.toLocaleString()}`, sub: `${Math.round((totalSpent / totalBudget) * 100)}% of budget`, icon: TrendingUp, color: 'from-violet-600 to-indigo-600' },
          { label: 'Total Reach', value: formatNumber(totalReach), change: 15, icon: Target, color: 'from-emerald-600 to-teal-600' },
          { label: 'Conversions', value: formatNumber(totalConversions), change: 8, icon: Check, color: 'from-amber-500 to-orange-600' },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-olu-muted text-xs font-medium">{card.label}</p>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="font-black text-2xl mb-0.5">{card.value}</p>
            {card.sub && <p className="text-olu-muted text-xs">{card.sub}</p>}
            {card.change > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={11} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">+{card.change}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Campaigns Summary */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Active Campaigns</p>
        <div className="space-y-4">
          {active.map(campaign => (
            <div key={campaign.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{campaign.name}</p>
                  <p className="text-olu-muted text-xs">Managed by {campaign.agent} · {campaign.creators.filter(c => c.status === 'live').length}/{campaign.creators.length} creators live</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${campaign.spent.toLocaleString()}</p>
                  <p className="text-olu-muted text-xs">of ${campaign.budget.toLocaleString()}</p>
                </div>
              </div>
              <ProgressBar value={campaign.spent} max={campaign.budget} />
              <div className="flex items-center justify-between mt-1.5 text-xs text-olu-muted">
                <span>{Math.round((campaign.spent / campaign.budget) * 100)}% budget used</span>
                <span>{formatNumber(campaign.reach)} / {formatNumber(campaign.targetReach)} reach</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spend Chart */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Budget Spend & Conversions</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={SPEND_DATA}>
            <defs>
              <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
            <XAxis dataKey="day" tick={{ fill: '#8b8baa', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8baa', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="spend" stroke="#3b82f6" fill="url(#spend)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Campaigns() {
  const [expanded, setExpanded] = useState('c1')

  return (
    <div className="space-y-4">
      {CAMPAIGNS.map((campaign) => (
        <div key={campaign.id} className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}
            className="w-full flex items-center gap-4 p-5 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold">{campaign.name}</p>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', campaign.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400')}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-olu-muted text-xs">AI Manager: {campaign.agent} · {campaign.startDate} – {campaign.endDate}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-semibold">{formatNumber(campaign.reach)}</p>
                <p className="text-olu-muted text-xs">reach</p>
              </div>
              <ChevronRight size={16} className={clsx('text-olu-muted transition-transform', expanded === campaign.id && 'rotate-90')} />
            </div>
          </button>

          {expanded === campaign.id && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-t border-olu-border px-5 pb-5">
              {/* Budget */}
              <div className="py-4 border-b border-olu-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Budget Utilization</p>
                  <p className="text-sm font-bold">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</p>
                </div>
                <ProgressBar value={campaign.spent} max={campaign.budget} />
              </div>

              {/* Creators */}
              <div className="pt-4">
                <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Creator Partnerships ({campaign.creators.length})</p>
                <div className="space-y-2">
                  {campaign.creators.map((creator) => {
                    const c = CREATORS.find(c => c.id === creator.id)
                    return (
                      <div key={creator.id} className="flex items-center gap-3 p-3 bg-olu-bg/50 rounded-xl">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c?.avatarColor || 'from-gray-500 to-gray-600'} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
                          {c?.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{creator.name}</p>
                          <p className="text-olu-muted text-xs">{creator.stage}</p>
                        </div>
                        <div className="text-right hidden sm:block mr-2">
                          {creator.views > 0 && <p className="text-xs font-semibold">{formatNumber(creator.views)} views</p>}
                          <p className="text-olu-muted text-xs">${creator.budget.toLocaleString()}</p>
                        </div>
                        <span className={clsx('text-xs px-2 py-1 rounded-full font-medium flex-shrink-0', STAGE_COLOR[creator.status])}>
                          {creator.status === 'live' ? '● Live' : creator.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

function CreatorCRM() {
  const collaborated = CAMPAIGNS.flatMap(c => c.creators.map(cr => cr.id))
  const unique = [...new Set(collaborated)]

  return (
    <div>
      <p className="text-olu-muted text-sm mb-4">{unique.length} creators you've worked with</p>
      <div className="space-y-3">
        {unique.map(id => {
          const c = CREATORS.find(c => c.id === id)
          if (!c) return null
          const campaigns = CAMPAIGNS.filter(camp => camp.creators.some(cr => cr.id === id))
          const totalBudget = campaigns.reduce((acc, camp) => acc + (camp.creators.find(cr => cr.id === id)?.budget || 0), 0)
          return (
            <div key={id} className="flex items-center gap-3 p-4 glass glass-hover rounded-2xl">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${c.avatarColor} flex items-center justify-center font-bold text-white flex-shrink-0`}>
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-semibold text-sm">{c.name}</p>
                  {c.verified && <div className="w-3 h-3 rounded-full bg-violet-500 flex items-center justify-center"><Check size={8} className="text-white" strokeWidth={3} /></div>}
                </div>
                <p className="text-olu-muted text-xs">{c.handle} · {formatNumber(c.followers)} followers</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">${totalBudget.toLocaleString()}</p>
                <p className="text-olu-muted text-xs">{campaigns.length} campaign{campaigns.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdvertiserConsole() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
          <Megaphone size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Advertiser Console</h1>
          <p className="text-olu-muted text-sm">AI-driven influencer marketing</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all', tab === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'campaigns' && <Campaigns />}
        {tab === 'creators' && <CreatorCRM />}
      </motion.div>
    </div>
  )
}
