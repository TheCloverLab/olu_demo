import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, Tag, DollarSign, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'
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
  deletePlan,
  linkExperienceToProduct,
  unlinkExperienceFromProduct,
  deleteProduct,
} from '../../../domain/product/api'
import ConfirmDialog from '../../../components/ConfirmDialog'

const PLAN_ROW = 'flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]'
const PLAN_CELL = 'bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-lg px-2 py-1.5 text-xs'

function PlanRow({ plan, onDelete }: { plan: ProductWithPlans['plans'][number]; onDelete: () => void }) {
  return (
    <div className={PLAN_ROW}>
      <span className={clsx(PLAN_CELL, 'w-[88px] text-center')}>
        {plan.billing_type === 'recurring' ? 'Recurring' : 'One-time'}
      </span>
      <span className={clsx(PLAN_CELL, 'w-16 text-center font-semibold')}>
        ${plan.price}
      </span>
      {plan.billing_type === 'recurring' && plan.interval ? (
        <span className={clsx(PLAN_CELL, 'w-[76px] text-center')}>/ {plan.interval}</span>
      ) : (
        <span className="w-[76px]" />
      )}
      <button
        onClick={onDelete}
        className="ml-auto text-xs px-2 py-0.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium"
      >
        Remove
      </button>
    </div>
  )
}

function AddPlanRow({ productId, onCreated }: { productId: string; onCreated: () => void }) {
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
      setPrice('')
      onCreated()
    } catch (err) {
      console.error('Failed to create plan', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={clsx(PLAN_ROW, 'border-dashed')}>
      <select
        value={billingType}
        onChange={(e) => setBillingType(e.target.value as any)}
        className={clsx(PLAN_CELL, 'w-[88px]')}
      >
        <option value="recurring">Recurring</option>
        <option value="one_time">One-time</option>
      </select>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="$"
        className={clsx(PLAN_CELL, 'w-16')}
      />
      {billingType === 'recurring' ? (
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value as any)}
          className={clsx(PLAN_CELL, 'w-[76px]')}
        >
          <option value="week">/ week</option>
          <option value="month">/ month</option>
          <option value="year">/ year</option>
        </select>
      ) : (
        <span className="w-[76px]" />
      )}
      <button
        onClick={handleAdd}
        disabled={saving || !price}
        className="ml-auto px-3 py-1.5 rounded-lg bg-cyan-300 text-[#04111f] text-xs font-semibold hover:bg-cyan-200 disabled:opacity-50"
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
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const [linking, setLinking] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [expDropdownOpen, setExpDropdownOpen] = useState(false)
  const expDropdownRef = useRef<HTMLDivElement>(null)
  const linkedExps = allExperiences.filter((e) => product.experience_ids.includes(e.id))
  const unlinkedExps = allExperiences.filter((e) => !product.experience_ids.includes(e.id))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (expDropdownRef.current && !expDropdownRef.current.contains(e.target as Node)) {
        setExpDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  async function handleAccessChange(newType: 'free' | 'paid') {
    if (newType === product.access_type) return
    await updateProduct(product.id, { access_type: newType })
    onUpdated()
  }

  async function handleDelete() {
    try {
      await deleteProduct(product.id)
      onUpdated()
    } catch (err) {
      console.error('Failed to delete product', err)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Header: name + delete/collapse */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{product.name}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDelete(true)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--olu-muted)] hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-[var(--olu-card-hover)] transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {product.description && (
          <p className="text-xs text-[var(--olu-text-secondary)]">{product.description}</p>
        )}

        {/* Access Type — explicit selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--olu-text-secondary)]">Access Type</label>
          <div className="flex gap-2">
            {(['free', 'paid'] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleAccessChange(v)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5',
                  product.access_type === v
                    ? v === 'free'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                    : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:border-[var(--olu-card-border)]'
                )}
              >
                {v === 'free' ? <Tag size={12} /> : <DollarSign size={12} />}
                {v === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>
        </div>

        {/* Plans (only when paid) */}
        {product.access_type === 'paid' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--olu-text-secondary)]">Pricing Plans</label>
            {product.plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} onDelete={async () => { await deletePlan(plan.id); onUpdated() }} />
            ))}
            <AddPlanRow productId={product.id} onCreated={onUpdated} />
          </div>
        )}

        {/* Experiences section */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--olu-text-secondary)]">
            Experiences ({linkedExps.length})
          </label>
          {linkedExps.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]"
            >
              <span className="text-xs font-medium">{exp.name}</span>
              <button
                onClick={() => handleUnlink(exp.id)}
                className="text-xs px-2 py-0.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          ))}
          {unlinkedExps.length > 0 && (
            <div className="relative" ref={expDropdownRef}>
              <button
                onClick={() => setExpDropdownOpen(!expDropdownOpen)}
                disabled={linking}
                className="w-full flex items-center justify-between bg-[var(--olu-card-bg)] border border-dashed border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-xs cursor-pointer hover:bg-[var(--olu-card-hover)] transition-colors disabled:opacity-50 text-[var(--olu-muted)]"
              >
                <span>+ Add experience...</span>
                <ChevronDown size={12} className={clsx('transition-transform', expDropdownOpen && 'rotate-180')} />
              </button>
              {expDropdownOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl shadow-lg overflow-hidden">
                  {unlinkedExps.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => { handleLink(exp.id); setExpDropdownOpen(false) }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--olu-card-hover)] transition-colors"
                    >
                      {exp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {linkedExps.length === 0 && unlinkedExps.length === 0 && (
            <p className="text-xs text-[var(--olu-muted)] italic">No experiences available</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete product"
        message={`Delete "${product.name}"? This cannot be undone.`}
        onConfirm={() => { setShowDelete(false); handleDelete() }}
        onCancel={() => setShowDelete(false)}
      />
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
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--olu-card-border)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--olu-text-secondary)] block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full access to all content"
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--olu-card-border)]"
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

  function reload(showSpinner = false) {
    if (!workspaceId) return
    if (showSpinner) setLoading(true)
    Promise.all([
      getProductsWithPlans(workspaceId),
      listExperiences(workspaceId),
    ])
      .then(([p, e]) => { setProducts(p); setExperiences(e) })
      .catch(() => { setProducts([]); setExperiences([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload(true)
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
