import { useEffect, useMemo, useState } from 'react'
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getSupplierPartnershipsBySupplier, getSupplierProductsBySupplier } from '../../../services/api'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { key: 'rankings', label: 'Rankings', icon: Package },
  { key: 'creators', label: 'Creators', icon: Users },
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

export default function SupplierConsole() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [products, setProducts] = useState<any[]>([])
  const [partnerships, setPartnerships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [productsData, partnershipsData] = await Promise.all([
          getSupplierProductsBySupplier(user.id),
          getSupplierPartnershipsBySupplier(user.id),
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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-olu-muted">Loading supplier console...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
          <Package size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Supplier Console</h1>
          <p className="text-olu-muted text-sm">Creator partnerships and product operations</p>
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
            <MetricCard label="Monthly Revenue" value={`$${Math.round(totals.revenue).toLocaleString()}`} icon={DollarSign} />
            <MetricCard label="Units Sold" value={compactNumber(totals.sold)} icon={Package} />
            <MetricCard label="Active Creators" value={totals.activeCreators.toString()} icon={Users} />
            <MetricCard label="Products" value={products.length.toString()} icon={TrendingUp} />
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="font-bold">Active Partnerships</p>
            {partnerships.filter((p) => p.status === 'active').map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[#161616]">
                <div>
                  <p className="font-medium text-sm">{p.creator?.name || 'Creator'}</p>
                  <p className="text-olu-muted text-xs">{p.products_count} products · manager {p.channel_manager || '-'}</p>
                </div>
                <p className="text-sm font-semibold">${Math.round(p.monthly_sales || 0).toLocaleString()}</p>
              </div>
            ))}
            {partnerships.filter((p) => p.status === 'active').length === 0 && <p className="text-olu-muted text-sm">No active partnerships yet.</p>}
          </div>
        </div>
      )}

      {tab === 'rankings' && (
        <div className="space-y-3">
          {products
            .slice()
            .sort((a, b) => Number(b.sold_month || 0) - Number(a.sold_month || 0))
            .map((product, i) => (
              <div key={product.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1b1b1b] flex items-center justify-center font-black text-sm">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <p className="text-olu-muted text-xs">{product.sku} · ${Number(product.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{product.sold_month || 0}</p>
                  <p className="text-olu-muted text-xs">month</p>
                </div>
              </div>
            ))}
          {products.length === 0 && <p className="text-olu-muted text-sm">No products yet.</p>}
        </div>
      )}

      {tab === 'creators' && (
        <div className="space-y-3">
          {partnerships.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.creator?.name || 'Creator'}</p>
                  <p className="text-olu-muted text-xs">{p.creator?.handle || ''}</p>
                </div>
                <span className={clsx('text-xs px-2 py-1 rounded-full capitalize', p.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-olu-muted')}>
                  {p.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="p-2 rounded-lg bg-[#161616] text-center">
                  <p className="font-semibold">{p.products_count || 0}</p>
                  <p className="text-olu-muted">Products</p>
                </div>
                <div className="p-2 rounded-lg bg-[#161616] text-center">
                  <p className="font-semibold">{p.ip_approved ? 'Approved' : 'Pending'}</p>
                  <p className="text-olu-muted">IP</p>
                </div>
                <div className="p-2 rounded-lg bg-[#161616] text-center">
                  <p className="font-semibold">${Math.round(p.monthly_sales || 0).toLocaleString()}</p>
                  <p className="text-olu-muted">Monthly</p>
                </div>
              </div>
            </div>
          ))}
          {partnerships.length === 0 && <p className="text-olu-muted text-sm">No creator partnerships yet.</p>}
        </div>
      )}
    </div>
  )
}
