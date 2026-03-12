import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Loader2, Tag, DollarSign, Link2, Unlink, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import type { WorkspaceExperience } from '../../../lib/supabase'
import { listExperiences } from '../../../domain/experience/api'
import {
  type ProductWithPlans,
  getProductsWithPlans,
  createProduct,
  updateProduct,
  createPlan,
  linkExperienceToProduct,
  unlinkExperienceFromProduct,
} from '../../../domain/product/api'

function PlanBadge({ plan }: { plan: ProductWithPlans['plans'][number] }) {
  const label = plan.billing_type === 'recurring'
    ? `$${plan.price}/${plan.interval}`
    : `$${plan.price} one-time`
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-600 dark:text-emerald-400">
      {label}
    </span>
  )
}

function AddPlanForm({ productId, onCreated }: { productId: string; onCreated: () => void }) {
  const [billingType, setBillingType] = useState<'one_time' | 'recurring'>('recurring')
  const [price, setPrice] = useState('')
  const [interval, setInterval] = useState<'month' | 'year' | 'week'>('month')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const p = parseFloat(price)
    if (isNaN(p) || p < 0) return
    setSaving(true)
    try {
      await createPlan(productId, billingType, p, billingType === 'recurring' ? interval : null)
      onCreated()
    } catch (err) {
      console.error('Failed to create plan', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="text-[10px] text-[var(--olu-muted)] block mb-0.5">Type</label>
        <select
          value={billingType}
          onChange={(e) => setBillingType(e.target.value as any)}
          className="bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-lg px-2 py-1.5 text-xs"
        >
          <option value="recurring">Recurring</option>
          <option value="one_time">One-time</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] text-[var(--olu-muted)] block mb-0.5">Price (USD)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="9.99"
          className="w-20 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-lg px-2 py-1.5 text-xs"
        />
      </div>
      {billingType === 'recurring' && (
        <div>
          <label className="text-[10px] text-[var(--olu-muted)] block mb-0.5">Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as any)}
            className="bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-lg px-2 py-1.5 text-xs"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      )}
      <button
        onClick={handleAdd}
        disabled={saving || !price}
        className="px-3 py-1.5 rounded-lg bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 disabled:opacity-50"
      >
        {saving ? '...' : 'Add'}
      </button>
    </div>
  )
}

function ProductCard({
  product,
  allExperiences,
  onUpdated,
}: {
  product: ProductWithPlans
  allExperiences: WorkspaceExperience[]
  onUpdated: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [linking, setLinking] = useState(false)

  const linkedExps = allExperiences.filter((e) => product.experience_ids.includes(e.id))
  const unlinkedExps = allExperiences.filter((e) => !product.experience_ids.includes(e.id))

  async function handleLink(experienceId: string) {
    setLinking(true)
    try {
      await linkExperienceToProduct(product.id, experienceId)
      onUpdated()
    } finally {
      setLinking(false)
    }
  }

  async function handleUnlink(experienceId: string) {
    try {
      await unlinkExperienceFromProduct(product.id, experienceId)
      onUpdated()
    } catch (err) {
      console.error('Failed to unlink', err)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              product.access_type === 'free' ? 'bg-emerald-400/10' : 'bg-amber-400/10'
            )}>
              {product.access_type === 'free' ? (
                <Tag size={16} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-[var(--olu-muted)] text-xs">{product.access_type === 'free' ? 'Free' : 'Paid'}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {product.description && (
          <p className="text-xs text-[var(--olu-text-secondary)]">{product.description}</p>
        )}

        {/* Plans */}
        <div className="flex flex-wrap gap-1.5">
          {product.plans.map((plan) => (
            <PlanBadge key={plan.id} plan={plan} />
          ))}
          {product.plans.length === 0 && product.access_type === 'free' && (
            <span className="text-xs text-[var(--olu-muted)]">Free access</span>
          )}
        </div>

        {/* Linked experiences */}
        <div>
          <p className="text-[10px] text-[var(--olu-muted)] mb-1">Included experiences ({linkedExps.length})</p>
          <div className="flex flex-wrap gap-1">
            {linkedExps.map((exp) => (
              <span key={exp.id} className="text-xs px-2 py-0.5 rounded-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center gap-1">
                {exp.name}
                <button onClick={() => handleUnlink(exp.id)} className="text-[var(--olu-muted)] hover:text-red-400">
                  <Unlink size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 pt-3 border-t border-[var(--olu-card-border)]">
            {/* Add plan */}
            {product.access_type === 'paid' && (
              <div>
                <p className="text-xs text-[var(--olu-text-secondary)] mb-2">Add pricing plan</p>
                <AddPlanForm productId={product.id} onCreated={onUpdated} />
              </div>
            )}

            {/* Link experience */}
            {unlinkedExps.length > 0 && (
              <div>
                <p className="text-xs text-[var(--olu-text-secondary)] mb-2">Link experience</p>
                <div className="flex flex-wrap gap-1.5">
                  {unlinkedExps.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => handleLink(exp.id)}
                      disabled={linking}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] hover:border-cyan-300/40 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Link2 size={10} />
                      {exp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateProductPanel({ workspaceId, onCreated, onClose }: { workspaceId: string; onCreated: () => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accessType, setAccessType] = useState<'free' | 'paid'>('paid')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await createProduct(workspaceId, name.trim(), accessType, description || undefined)
      onCreated()
    } catch (err) {
      console.error('Failed to create product', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Create Product</h3>
        <button onClick={onClose} className="text-xs text-[var(--olu-muted)] hover:text-[var(--olu-text)]">Cancel</button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pro Membership"
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full access to all content"
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Access type</label>
          <div className="flex gap-2">
            {(['free', 'paid'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setAccessType(v)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5',
                  accessType === v
                    ? 'bg-cyan-300 text-[#04111f]'
                    : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)]'
                )}
              >
                {v === 'free' ? <Tag size={12} /> : <DollarSign size={12} />}
                {v === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Create Product
        </button>
      </div>
    </div>
  )
}

export default function ProductManager() {
  const { t } = useTranslation()
  const { workspace } = useApp()
  const [products, setProducts] = useState<ProductWithPlans[]>([])
  const [experiences, setExperiences] = useState<WorkspaceExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const workspaceId = workspace?.id

  function reload() {
    if (!workspaceId) return
    setLoading(true)
    Promise.all([
      getProductsWithPlans(workspaceId),
      listExperiences(workspaceId),
    ])
      .then(([p, e]) => { setProducts(p); setExperiences(e) })
      .catch(() => { setProducts([]); setExperiences([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs tracking-wider mb-2">{t('nav.workspace')}</p>
          <h1 className="font-black text-2xl">{t('nav.products', 'Products')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} · {experiences.length} experiences
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {showCreate && workspaceId && (
        <CreateProductPanel
          workspaceId={workspaceId}
          onCreated={() => { setShowCreate(false); reload() }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {products.length === 0 ? (
        <div className="rounded-3xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-12 text-center space-y-3">
          <Tag size={32} className="text-[var(--olu-muted)] mx-auto" />
          <p className="text-[var(--olu-text-secondary)] text-sm">No products yet.</p>
          <p className="text-[var(--olu-muted)] text-xs">Create a free or paid product to gate access to experiences.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              allExperiences={experiences}
              onUpdated={reload}
            />
          ))}
        </div>
      )}
    </div>
  )
}
