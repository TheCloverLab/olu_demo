import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import clsx from 'clsx'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

// ── Mock data ─────────────────────────────────────────────────

function generateGrowthData() {
  const data: { date: string; customers: number; newCustomers: number }[] = []
  let total = 42
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const newUsers = Math.floor(Math.random() * 8) + 1
    total += newUsers
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      customers: total,
      newCustomers: newUsers,
    })
  }
  return data
}

function generateRevenueData() {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  return months.map((m) => ({
    month: m,
    revenue: Math.floor(Math.random() * 3000) + 800,
    subscriptions: Math.floor(Math.random() * 1500) + 400,
  }))
}

function generateExperienceData() {
  return [
    { name: 'Art Forum', visits: 342, engagement: 78 },
    { name: 'Music Course', visits: 256, engagement: 85 },
    { name: 'Fashion Chat', visits: 189, engagement: 62 },
    { name: 'NFT Gallery', visits: 145, engagement: 71 },
    { name: 'Live Events', visits: 98, engagement: 55 },
  ]
}

const retentionData = [
  { name: 'Active', value: 68, color: '#06b6d4' },
  { name: 'At Risk', value: 18, color: '#f59e0b' },
  { name: 'Churned', value: 14, color: '#ef4444' },
]

const GROWTH_DATA = generateGrowthData()
const REVENUE_DATA = generateRevenueData()
const EXPERIENCE_DATA = generateExperienceData()

// ── Components ────────────────────────────────────────────────

function StatCard({ label, value, change, icon: Icon, color }: { label: string; value: string; change: string; icon: typeof TrendingUp; color: string }) {
  const isPositive = change.startsWith('+')
  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon size={16} className="text-white" />
        </div>
        <span className={clsx('text-xs font-medium', isPositive ? 'text-emerald-500' : 'text-red-500')}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-[var(--olu-muted)] mt-0.5">{label}</p>
    </div>
  )
}

type TimeRange = '7d' | '30d' | '90d'

export default function Analytics() {
  const { t } = useTranslation()
  const [range, setRange] = useState<TimeRange>('30d')

  const filteredGrowth = range === '7d' ? GROWTH_DATA.slice(-7) : range === '30d' ? GROWTH_DATA : GROWTH_DATA

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.2em] mb-1">
            <BarChart3 size={14} />
            {t('analytics.title', 'Analytics')}
          </div>
          <h1 className="font-black text-xl">{t('analytics.heading', 'Business Analytics')}</h1>
        </div>
        <div className="flex items-center gap-1 bg-[var(--olu-card-bg)] rounded-xl p-1 border border-[var(--olu-card-border)]">
          {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                range === r ? 'bg-cyan-500 text-white' : 'text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)]'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('analytics.totalCustomers', 'Total Customers')} value={GROWTH_DATA[GROWTH_DATA.length - 1].customers.toString()} change="+12.5%" icon={Users} color="bg-cyan-500" />
        <StatCard label={t('analytics.revenue', 'Revenue')} value="$4,280" change="+8.2%" icon={DollarSign} color="bg-emerald-500" />
        <StatCard label={t('analytics.engagement', 'Engagement Rate')} value="72%" change="+3.1%" icon={Activity} color="bg-purple-500" />
        <StatCard label={t('analytics.growth', 'Growth Rate')} value="18%" change="+5.4%" icon={TrendingUp} color="bg-amber-500" />
      </div>

      {/* Customer growth chart */}
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5">
        <h2 className="font-semibold text-sm mb-4">{t('analytics.customerGrowth', 'Customer Growth')}</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredGrowth}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--olu-border, #333)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--olu-card-bg, #1a1a2e)', border: '1px solid var(--olu-border, #333)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'var(--olu-text, #fff)' }}
              />
              <Area type="monotone" dataKey="customers" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue + Retention row */}
      <div className="grid lg:grid-cols-[1.4fr,0.8fr] gap-4">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5">
          <h2 className="font-semibold text-sm mb-4">{t('analytics.revenueTrend', 'Revenue Trend')}</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--olu-border, #333)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--olu-card-bg, #1a1a2e)', border: '1px solid var(--olu-border, #333)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`$${value}`, '']}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="subscriptions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Subscriptions
            </span>
          </div>
        </div>

        {/* Retention donut */}
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5">
          <h2 className="font-semibold text-sm mb-4">{t('analytics.retention', 'Customer Retention')}</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={retentionData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {retentionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--olu-card-bg, #1a1a2e)', border: '1px solid var(--olu-border, #333)', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {retentionData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Experience engagement */}
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5">
        <h2 className="font-semibold text-sm mb-4">{t('analytics.experienceEngagement', 'Experience Engagement')}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EXPERIENCE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--olu-border, #333)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--olu-muted, #888)' }} width={100} />
              <Tooltip
                contentStyle={{ background: 'var(--olu-card-bg, #1a1a2e)', border: '1px solid var(--olu-border, #333)', borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="visits" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              <Bar dataKey="engagement" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)]">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Visits
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--olu-muted)]">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Engagement Score
          </span>
        </div>
      </div>
    </div>
  )
}
