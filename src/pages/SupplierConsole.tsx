import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Package, TrendingUp, Users, DollarSign, ArrowUpRight, Check, Clock, AlertCircle } from 'lucide-react'
import { SUPPLIER_CREATORS, SUPPLIER_PRODUCTS, formatNumber } from '../data/mock'
import clsx from 'clsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'rankings', label: 'Rankings', icon: Package },
  { key: 'creators', label: 'Creators', icon: Users },
]

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400', icon: Check },
  negotiating: { label: 'Negotiating', color: 'bg-amber-500/15 text-amber-400', icon: Clock },
  outreach: { label: 'Outreach', color: 'bg-blue-500/15 text-blue-400', icon: AlertCircle },
  past: { label: 'Past', color: 'bg-gray-500/15 text-gray-400', icon: Check },
}

const RANKING_DATA = [
  { name: 'Neon Hoodie', today: 12, week: 78, month: 234 },
  { name: 'Pixel Pins', today: 8, week: 45, month: 189 },
  { name: 'Acrylic Stand', today: 3, week: 22, month: 89 },
  { name: 'Chibi Plushie', today: 5, week: 31, month: 78 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-olu-surface border border-olu-border rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-olu-muted">{p.dataKey}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  const activeCreators = SUPPLIER_CREATORS.filter(c => c.status === 'active')
  const totalRevenue = SUPPLIER_PRODUCTS.reduce((acc, p) => acc + p.revenue_month, 0)
  const totalSold = SUPPLIER_PRODUCTS.reduce((acc, p) => acc + p.sold_month, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-600 to-teal-600', change: 18 },
          { label: 'Units Sold', value: totalSold.toString(), icon: Package, color: 'from-violet-600 to-indigo-600', change: 12 },
          { label: 'Active Creators', value: activeCreators.length.toString(), icon: Users, color: 'from-blue-600 to-cyan-600', change: 5 },
          { label: 'Active Products', value: SUPPLIER_PRODUCTS.length.toString(), icon: TrendingUp, color: 'from-amber-500 to-orange-600', change: 0 },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-olu-muted text-xs font-medium">{card.label}</p>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="font-black text-2xl mb-0.5">{card.value}</p>
            {card.change > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUpRight size={11} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">+{card.change}% MoM</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Creator Partnerships */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Active Creator Partnerships</p>
        <div className="space-y-3">
          {activeCreators.map(creator => (
            <div key={creator.id} className="flex items-center gap-3 p-3 bg-olu-bg/50 rounded-xl">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${creator.avatarColor} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                {creator.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{creator.name}</p>
                <p className="text-olu-muted text-xs">{creator.products} products · Channel: {creator.channelManager}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">${creator.monthlySales.toLocaleString()}</p>
                <p className="text-olu-muted text-xs">monthly</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's performance */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Today's Sales by Product</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={SUPPLIER_PRODUCTS.map(p => ({ name: p.name.split(' ')[0] + ' ' + p.name.split(' ')[1], units: p.sold_today }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
            <XAxis dataKey="name" tick={{ fill: '#8b8baa', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8baa', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="units" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Rankings() {
  const [period, setPeriod] = useState('week')

  const periodKey = period === 'today' ? 'today' : period === 'week' ? 'week' : 'month'

  const sorted = [...SUPPLIER_PRODUCTS].sort((a, b) => b[`sold_${periodKey}`] - a[`sold_${periodKey}`])

  return (
    <div>
      <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-4">
        {['today', 'week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all', period === p ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((product, i) => (
          <div key={product.id} className="flex items-center gap-4 p-4 glass rounded-2xl">
            <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0',
              i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-olu-card text-olu-muted')}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
              <p className="text-olu-muted text-xs">{product.sku} · ${product.price}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-black text-xl">{product[`sold_${periodKey}`]}</p>
              <p className="text-olu-muted text-xs">units</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Creators() {
  return (
    <div className="space-y-3">
      <div className="p-3 glass rounded-xl border border-emerald-500/20 flex items-center gap-2 mb-4">
        <div className="text-lg">🤖</div>
        <p className="text-sm"><span className="text-emerald-300 font-semibold">Chan</span> (Channel Manager) is actively reaching out to creators. 3 partnerships in progress.</p>
      </div>
      {SUPPLIER_CREATORS.map(creator => {
        const cfg = STATUS_CONFIG[creator.status]
        return (
          <div key={creator.id} className="p-4 glass glass-hover rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${creator.avatarColor} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                {creator.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm">{creator.name}</p>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>{cfg.label}</span>
                </div>
                <p className="text-olu-muted text-xs">AI Channel Manager: {creator.channelManager}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="glass rounded-lg p-2 text-center">
                <p className="font-bold">{creator.products}</p>
                <p className="text-olu-muted">Products</p>
              </div>
              <div className="glass rounded-lg p-2 text-center">
                <p className={clsx('font-bold', creator.ipApproved ? 'text-emerald-400' : 'text-amber-400')}>
                  {creator.ipApproved ? '✓ Cleared' : 'Pending'}
                </p>
                <p className="text-olu-muted">IP Status</p>
              </div>
              <div className="glass rounded-lg p-2 text-center">
                <p className="font-bold">{creator.monthlySales > 0 ? `$${creator.monthlySales.toLocaleString()}` : '-'}</p>
                <p className="text-olu-muted">Monthly</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SupplierConsole() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
          <Package size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Supplier Console</h1>
          <p className="text-olu-muted text-sm">Creator partnerships & sales management</p>
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
        {tab === 'rankings' && <Rankings />}
        {tab === 'creators' && <Creators />}
      </motion.div>
    </div>
  )
}
