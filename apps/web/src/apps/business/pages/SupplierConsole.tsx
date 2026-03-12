import { useEffect, useMemo, useState } from 'react'
import { Package, TrendingUp, Users, DollarSign, Boxes, Link2, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getSupplierCatalog, getSupplierCreatorLinks } from '../../../domain/business/api'
import type { SupplierCreatorPartnership, SupplierProduct } from '../../../lib/supabase'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'rankings', label: 'Rankings', icon: Boxes },
  { key: 'creators', label: 'Creators', icon: Users },
] as const

type TabKey = (typeof TABS)[number]['key']

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-[24px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_16px_40px_rgba(2,8,23,0.18)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[var(--olu-text-secondary)] text-xs">{label}</p>
        <Icon size={14} className="text-[var(--olu-text-secondary)]" />
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  )
}

export default function SupplierConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [partnerships, setPartnerships] = useState<SupplierCreatorPartnership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [productsData, partnershipsData] = await Promise.all([
          getSupplierCatalog(user.id),
          getSupplierCreatorLinks(user.id),
        ])
        setProducts(productsData || [])
        setPartnerships(partnershipsData || [])
      } catch (err) {
        console.error('Failed loading supplier console', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const totals = useMemo(() => {
    const revenue = products.reduce((acc, p) => acc + Number(p.revenue_month || 0), 0)
    const sold = products.reduce((acc, p) => acc + Number(p.sold_month || 0), 0)
    const activeCreators = partnerships.filter((p) => p.status === 'active').length
    return { revenue, sold, activeCreators }
  }, [products, partnerships])

  const activePartnerships = partnerships.filter((p) => p.status === 'active')

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-[var(--olu-text-secondary)]">Loading supplier console...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="rounded-[32px] border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
              <Package size={18} className="text-cyan-700 dark:text-cyan-200" />
            </div>
            <div>
              <h1 className="font-black text-2xl">Supply Chain</h1>
              <p className="text-[var(--olu-text-secondary)] text-sm">Creator partnerships, catalog readiness, and merchandise operations inside the business workspace</p>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-cyan-400/10 bg-[var(--olu-section-bg)] p-4">
              <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.18em] mb-2">Active Links</p>
              <p className="font-black text-2xl">{activePartnerships.length}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Live creator-supplier relationships</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/10 bg-[var(--olu-section-bg)] p-4">
              <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-[0.18em] mb-2">Monthly GMV</p>
              <p className="font-black text-2xl">${Math.round(totals.revenue).toLocaleString()}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Current merchandise throughput</p>
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
              tab === key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:text-white'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-cyan-400/10 bg-[var(--olu-header-bg)] p-4 flex items-center gap-3">
            <ShieldCheck size={16} className="text-cyan-700 dark:text-cyan-200" />
            <p className="text-sm text-cyan-700/68 dark:text-cyan-100/68">Supply Chain uses the same business cockpit tokens and will later move to workspace-backed supplier partnerships and catalogs.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Monthly Revenue" value={`$${Math.round(totals.revenue).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Units Sold" value={compactNumber(totals.sold)} icon={Package} />
            <MetricCard label="Active Creators" value={totals.activeCreators.toString()} icon={Users} />
            <MetricCard label="Products" value={products.length.toString()} icon={TrendingUp} />
          </div>

          <div className="rounded-[32px] p-5 space-y-3 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_16px_50px_rgba(2,8,23,0.22)]">
            <p className="font-bold">Active Partnerships</p>
            {activePartnerships.map((partnership) => (
              <div key={partnership.id} className="flex items-center justify-between p-4 rounded-[24px] bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]">
                <div>
                  <p className="font-medium text-sm">{partnership.creator?.name || 'Creator'}</p>
                  <p className="text-[var(--olu-text-secondary)] text-xs">{partnership.products_count} products · manager {partnership.channel_manager || '-'}</p>
                </div>
                <p className="text-sm font-semibold">${Math.round(partnership.monthly_sales || 0).toLocaleString()}</p>
              </div>
            ))}
            {activePartnerships.length === 0 && <p className="text-[var(--olu-text-secondary)] text-sm">No active partnerships yet.</p>}
          </div>
        </div>
      )}

      {tab === 'rankings' && (
        <div className="space-y-3">
          {products
            .slice()
            .sort((a, b) => Number(b.sold_month || 0) - Number(a.sold_month || 0))
            .map((product, index) => (
              <div key={product.id} className="rounded-[28px] p-4 flex items-center gap-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center justify-center font-black text-sm">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <p className="text-[var(--olu-text-secondary)] text-xs">{product.sku} · ${Number(product.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{product.sold_month || 0}</p>
                  <p className="text-[var(--olu-text-secondary)] text-xs">month</p>
                </div>
              </div>
            ))}
          {products.length === 0 && <p className="text-[var(--olu-text-secondary)] text-sm">No products yet.</p>}
        </div>
      )}

      {tab === 'creators' && (
        <div className="space-y-3">
          {partnerships.map((partnership) => (
            <div key={partnership.id} className="rounded-[32px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_16px_40px_rgba(2,8,23,0.16)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
                    <Link2 size={16} className="text-cyan-700 dark:text-cyan-200" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{partnership.creator?.name || 'Creator'}</p>
                    <p className="text-[var(--olu-text-secondary)] text-xs">{partnership.creator?.handle || ''}</p>
                  </div>
                </div>
                <span className={clsx('text-xs px-2 py-1 rounded-full capitalize', partnership.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-cyan-500/10 text-[var(--olu-text-secondary)]')}>
                  {partnership.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-center">
                  <p className="font-semibold">{partnership.products_count || 0}</p>
                  <p className="text-[var(--olu-text-secondary)]">Products</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-center">
                  <p className="font-semibold">{partnership.ip_approved ? 'Approved' : 'Pending'}</p>
                  <p className="text-[var(--olu-text-secondary)]">IP</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-center">
                  <p className="font-semibold">${Math.round(partnership.monthly_sales || 0).toLocaleString()}</p>
                  <p className="text-[var(--olu-text-secondary)]">Monthly</p>
                </div>
              </div>
            </div>
          ))}
          {partnerships.length === 0 && <p className="text-[var(--olu-text-secondary)] text-sm">No creator partnerships yet.</p>}
        </div>
      )}
    </div>
  )
}
