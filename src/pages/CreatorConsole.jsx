import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Users, DollarSign, Eye, CheckSquare, ShieldAlert, ShoppingBag, UserCheck, ChevronRight, MoreHorizontal, Check, X, ArrowUpRight } from 'lucide-react'
import { REVENUE_DATA, VIEWS_DATA, FANS, IP_LICENSES, IP_INFRINGEMENTS, SHOP_PRODUCTS, SUPPLIER_CREATORS, formatNumber } from '../data/mock'
import clsx from 'clsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'fans', label: 'Fans', icon: Users },
  { key: 'ip_licenses', label: 'IP Licenses', icon: CheckSquare },
  { key: 'ip_violations', label: 'IP Violations', icon: ShieldAlert },
  { key: 'shop', label: 'Shop', icon: ShoppingBag },
]

const STATUS_COLOR = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  negotiating: 'bg-amber-500/15 text-amber-400',
  rejected: 'bg-red-500/15 text-red-400',
  pending: 'bg-gray-500/15 text-gray-400',
}

const VIOLATION_STATUS_COLOR = {
  resolved: 'bg-emerald-500/15 text-emerald-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
}

const TIER_COLOR = {
  vip: 'bg-amber-500/15 text-amber-400',
  creator_club: 'bg-white/10 text-sky-400',
  free: 'bg-gray-500/15 text-gray-400',
}

const FAN_STATUS_ACTIONS = {
  active: ['Send message', 'Send coupon', '1-on-1 session', 'View details'],
  new: ['Welcome message', 'Offer discount', 'View details'],
  churned: ['Win-back offer', 'Send message', 'View details'],
}

function MetricCard({ label, value, change, icon: Icon, color }) {
  const positive = change > 0
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-olu-muted text-xs font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon size={14} className="text-white" />
        </div>
      </div>
      <p className="font-black text-2xl mb-1">{value}</p>
      <div className="flex items-center gap-1">
        <ArrowUpRight size={12} className={positive ? 'text-emerald-400' : 'text-red-400 rotate-180'} />
        <span className={clsx('text-xs font-medium', positive ? 'text-emerald-400' : 'text-red-400')}>{Math.abs(change)}% vs last month</span>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-olu-surface border border-olu-border rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-olu-muted capitalize">{p.dataKey}:</span>
          <span className="font-semibold">{typeof p.value === 'number' && p.value > 10000 ? formatNumber(p.value) : `$${p.value?.toLocaleString()}`}</span>
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Monthly Revenue" value="$12,400" change={8.2} icon={DollarSign} color="from-violet-600 to-indigo-600" />
        <MetricCard label="Total Fans" value="234K" change={12.4} icon={Users} color="from-emerald-600 to-teal-600" />
        <MetricCard label="Total Views" value="3.2M" change={23.1} icon={Eye} color="from-blue-600 to-cyan-600" />
        <MetricCard label="IP Licenses" value="$1,040/mo" change={45.2} icon={CheckSquare} color="from-amber-500 to-orange-600" />
      </div>

      {/* Revenue Chart */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Revenue Breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={REVENUE_DATA}>
            <defs>
              <linearGradient id="subs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tips" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="shop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
            <XAxis dataKey="month" tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#8b8baa' }} />
            <Area type="monotone" dataKey="subscriptions" stroke="#7c3aed" fill="url(#subs)" strokeWidth={2} />
            <Area type="monotone" dataKey="tips" stroke="#f59e0b" fill="url(#tips)" strokeWidth={2} />
            <Area type="monotone" dataKey="shop" stroke="#10b981" fill="url(#shop)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Views Chart */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Views by Platform</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={VIEWS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252545" />
            <XAxis dataKey="month" tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b8baa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#8b8baa' }} />
            <Bar dataKey="tiktok" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="youtube" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="instagram" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Todos */}
      <div className="glass rounded-2xl p-5">
        <p className="font-bold mb-4">Action Required 🔔</p>
        <div className="space-y-3">
          {[
            { title: 'Review IP license request from IndieSound Studio', type: 'IP License', urgent: true },
            { title: 'Approve hoodie product listing from ArtisanCraft Co.', type: 'Shop', urgent: false },
            { title: 'Review fan creation license application — 3 pending', type: 'Fan Creation', urgent: false },
            { title: 'Renew voice licensing terms with GameVerse Studios', type: 'IP License', urgent: true },
          ].map((todo, i) => (
            <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
              {todo.urgent && <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{todo.title}</p>
                <p className="text-olu-muted text-xs">{todo.type}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"><Check size={13} /></button>
                <button className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"><X size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FanCRM() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [actionFan, setActionFan] = useState(null)
  const filters = ['all', 'vip', 'creator_club', 'free', 'new', 'churned']

  const filtered = activeFilter === 'all' ? FANS : FANS.filter(f => f.tier === activeFilter || f.status === activeFilter)

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: FANS.length, color: 'text-olu-text' },
          { label: 'VIP', value: FANS.filter(f => f.tier === 'vip').length, color: 'text-amber-400' },
          { label: 'Paid', value: FANS.filter(f => f.tier !== 'free').length, color: 'text-sky-400' },
          { label: 'Churned', value: FANS.filter(f => f.status === 'churned').length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className={clsx('font-black text-xl', s.color)}>{s.value}</p>
            <p className="text-olu-muted text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-4 overflow-x-auto scrollbar-hide">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-all', activeFilter === f ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
            {f === 'all' ? 'All Fans' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((fan) => (
          <div key={fan.id} className="flex items-center gap-3 p-4 glass glass-hover rounded-2xl">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fan.color} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
              {fan.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm">{fan.name}</span>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize', TIER_COLOR[fan.tier])}>{fan.tier.replace('_', ' ')}</span>
              </div>
              <p className="text-olu-muted text-xs">{fan.handle} · Last seen {fan.lastSeen}</p>
            </div>
            <div className="text-right mr-2 hidden sm:block">
              <p className="font-semibold text-sm">${fan.totalSpend}</p>
              <p className="text-olu-muted text-xs">total spend</p>
            </div>
            <button onClick={() => setActionFan(actionFan === fan.id ? null : fan.id)} className="p-2 rounded-xl hover:bg-white/08 transition-colors">
              <MoreHorizontal size={16} className="text-olu-muted" />
            </button>

            {actionFan === fan.id && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 mt-2 bg-olu-surface border border-olu-border rounded-xl shadow-xl z-20 w-44 overflow-hidden" style={{ marginTop: '40px' }}>
                {(FAN_STATUS_ACTIONS[fan.status] || FAN_STATUS_ACTIONS.active).map((action) => (
                  <button key={action} onClick={() => setActionFan(null)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/05 transition-colors">{action}</button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function IPLicenses() {
  return (
    <div className="space-y-3">
      {IP_LICENSES.map((license) => (
        <div key={license.id} className="p-4 glass rounded-2xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">{license.requester}</p>
              <p className="text-olu-muted text-xs">{license.type}</p>
            </div>
            <span className={clsx('text-xs px-2 py-1 rounded-full font-medium capitalize', STATUS_COLOR[license.status])}>{license.status}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-olu-muted">
              <span>Fee: <strong className="text-olu-text">{license.amount}</strong></span>
              <span>Approved by: <strong className="text-olu-text">{license.approvedBy}</strong></span>
            </div>
            <span className="text-olu-muted">{license.date}</span>
          </div>
          {license.status === 'negotiating' && (
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1">
                <Check size={12} /> Approve
              </button>
              <button className="flex-1 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1">
                <X size={12} /> Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function IPViolations() {
  return (
    <div className="space-y-3">
      <div className="p-3 glass rounded-xl border border-red-500/20 flex items-center gap-2 mb-4">
        <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
        <p className="text-sm"><span className="text-red-300 font-semibold">Debian</span> is monitoring 6 platforms 24/7. <span className="text-emerald-400">75%</span> resolution rate this month.</p>
      </div>
      {IP_INFRINGEMENTS.map((item) => (
        <div key={item.id} className="p-4 glass rounded-2xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm">{item.platform}</span>
                <span className="text-olu-muted text-xs">· {item.offender}</span>
              </div>
              <p className="text-olu-muted text-xs">{item.content}</p>
            </div>
            <span className={clsx('text-xs px-2 py-1 rounded-full font-medium capitalize flex-shrink-0 ml-2', VIOLATION_STATUS_COLOR[item.status])}>{item.status.replace('_', ' ')}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-olu-border text-xs text-olu-muted">
            <p>Action: <span className="text-olu-text">{item.action}</span></p>
            <p>Result: <span className="text-olu-text">{item.result}</span></p>
            <p className="mt-1">{item.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Shop() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Monthly Sales', value: '$25,382' },
          { label: 'Products', value: SHOP_PRODUCTS.length },
          { label: 'Suppliers', value: '1 active' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className="font-black text-lg">{s.value}</p>
            <p className="text-olu-muted text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider">Products</p>
        {SHOP_PRODUCTS.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-4 glass rounded-2xl">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.gradientBg} flex items-center justify-center text-xl flex-shrink-0`}>
              {product.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
              <p className="text-olu-muted text-xs capitalize">{product.type} · {product.sales} sold</p>
              {product.stock !== null && (
                <p className={clsx('text-xs', product.stock < 20 ? 'text-red-400' : 'text-olu-muted')}>{product.stock} in stock</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">${product.price}</p>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Live</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Supplier Partnerships</p>
        {SUPPLIER_CREATORS.filter(s => s.status === 'active').map(supplier => (
          <div key={supplier.id} className="flex items-center gap-3 p-4 glass rounded-2xl">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${supplier.avatarColor} flex items-center justify-center font-bold text-white text-sm`}>
              AC
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">ArtisanCraft Co.</p>
              <p className="text-olu-muted text-xs">{supplier.products} products · Active partner</p>
            </div>
            <ChevronRight size={16} className="text-olu-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CreatorConsole() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <TrendingUp size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Creator Console</h1>
          <p className="text-olu-muted text-sm">Manage your creator business</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all', tab === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'fans' && <FanCRM />}
        {tab === 'ip_licenses' && <IPLicenses />}
        {tab === 'ip_violations' && <IPViolations />}
        {tab === 'shop' && <Shop />}
      </motion.div>
    </div>
  )
}
