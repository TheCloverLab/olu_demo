import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, Eye, CheckSquare, ShoppingBag } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import {
  getRevenueAnalytics,
  getViewsAnalytics,
  getFansByCreator,
  getIPLicensesByCreator,
  getIPInfringementsByCreator,
  getProductsByCreator,
} from '../services/api'
import type { AnalyticsRevenue, AnalyticsViews, Fan, IPLicense, IPInfringement, Product } from '../lib/supabase'

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'fans', label: 'Customers', icon: Users },
  { key: 'ip', label: 'IP', icon: CheckSquare },
  { key: 'shop', label: 'Shop', icon: ShoppingBag },
] as const

type TabKey = (typeof TABS)[number]['key']

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

export default function CreatorConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [loading, setLoading] = useState(true)

  const [revenue, setRevenue] = useState<AnalyticsRevenue[]>([])
  const [views, setViews] = useState<AnalyticsViews[]>([])
  const [fans, setFans] = useState<Fan[]>([])
  const [licenses, setLicenses] = useState<IPLicense[]>([])
  const [infringements, setInfringements] = useState<IPInfringement[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [revenueData, viewsData, fansData, licensesData, infringementsData, productsData] = await Promise.all([
          getRevenueAnalytics(user.id),
          getViewsAnalytics(user.id),
          getFansByCreator(user.id),
          getIPLicensesByCreator(user.id),
          getIPInfringementsByCreator(user.id),
          getProductsByCreator(user.id),
        ])

        setRevenue(revenueData)
        setViews(viewsData)
        setFans(fansData)
        setLicenses(licensesData)
        setInfringements(infringementsData)
        setProducts(productsData)
      } catch (err) {
        console.error('Failed loading creator console', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const totals = useMemo(() => {
    const totalRevenue = revenue.reduce((acc, r) => acc + r.subscriptions + r.tips + r.shop + r.ip, 0)
    const totalViews = views.reduce((acc, v) => acc + v.tiktok + v.youtube + v.instagram, 0)
    const activeFans = fans.filter((f) => f.status === 'active').length
    return { totalRevenue, totalViews, activeFans }
  }, [revenue, views, fans])

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-olu-muted">Loading creator console...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="font-black text-2xl">Creator Console</h1>
        <p className="text-olu-muted text-sm">Real-time creator operations from Supabase</p>
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
            <MetricCard label="Total Revenue" value={`$${Math.round(totals.totalRevenue).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Total Views" value={compactNumber(totals.totalViews)} icon={Eye} />
            <MetricCard label="Active Customers" value={totals.activeFans.toString()} icon={Users} />
            <MetricCard label="IP Licenses" value={licenses.length.toString()} icon={CheckSquare} />
          </div>

          <div className="glass rounded-2xl p-5">
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

          <div className="glass rounded-2xl p-5">
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
        <div className="glass rounded-2xl p-5 space-y-3">
          {fans.map((fan) => (
            <div key={fan.id} className="flex items-center justify-between p-3 rounded-xl bg-[#161616]">
              <div>
                <p className="font-medium text-sm">{fan.name}</p>
                <p className="text-olu-muted text-xs">{fan.handle} · {fan.tier}</p>
              </div>
              <p className="text-sm font-semibold">${Math.round(fan.total_spend)}</p>
            </div>
          ))}
          {fans.length === 0 && <p className="text-olu-muted text-sm">No customer data yet.</p>}
        </div>
      )}

      {tab === 'ip' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="font-bold">Licenses</p>
            {licenses.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-[#161616]">
                <p className="text-sm font-medium">{item.requester}</p>
                <p className="text-olu-muted text-xs">{item.type} · {item.status}</p>
              </div>
            ))}
            {licenses.length === 0 && <p className="text-olu-muted text-sm">No license requests.</p>}
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="font-bold">Infringements</p>
            {infringements.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-[#161616]">
                <p className="text-sm font-medium">{item.platform} · {item.offender}</p>
                <p className="text-olu-muted text-xs">{item.content} · {item.status}</p>
              </div>
            ))}
            {infringements.length === 0 && <p className="text-olu-muted text-sm">No infringement records.</p>}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="glass rounded-2xl p-5 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-[#161616]">
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-olu-muted text-xs">{product.status} · stock {product.stock}</p>
              </div>
              <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
            </div>
          ))}
          {products.length === 0 && <p className="text-olu-muted text-sm">No products yet.</p>}
        </div>
      )}
    </div>
  )
}
