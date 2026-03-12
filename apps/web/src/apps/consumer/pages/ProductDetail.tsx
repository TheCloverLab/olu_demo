import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, Check, Sparkles, ShieldCheck, BookOpen, MessageSquare, Users } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import type { WorkspaceProduct, WorkspaceProductPlan, WorkspaceExperience } from '../../../lib/supabase'
import { getProduct, listPlans, getProductExperienceIds, purchaseProduct, getUserPurchases } from '../../../domain/product/api'
import { listExperiences } from '../../../domain/experience/api'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const TYPE_ICON: Record<string, typeof MessageSquare> = {
  forum: MessageSquare,
  course: BookOpen,
  group_chat: Users,
}

export default function ProductDetail() {
  const { productId, workspaceSlug } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const userId = IS_DEMO ? 'demo-consumer' : authUser?.id

  const [product, setProduct] = useState<WorkspaceProduct | null>(null)
  const [plans, setPlans] = useState<WorkspaceProductPlan[]>([])
  const [includedExperiences, setIncludedExperiences] = useState<WorkspaceExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')

  useEffect(() => {
    async function load() {
      if (!productId) return
      try {
        const prod = await getProduct(productId)
        if (!prod) { setLoading(false); return }
        setProduct(prod)

        const [productPlans, experienceIds] = await Promise.all([
          listPlans(productId),
          getProductExperienceIds(productId),
        ])
        setPlans(productPlans)
        if (productPlans.length > 0) setSelectedPlanId(productPlans[0].id)

        // Load workspace name
        if (!IS_DEMO) {
          const { data: ws } = await supabase
            .from('workspaces')
            .select('name')
            .eq('id', prod.workspace_id)
            .single()
          if (ws) setWorkspaceName(ws.name)
        }

        // Load included experiences
        if (experienceIds.length > 0) {
          const allExps = await listExperiences(prod.workspace_id)
          setIncludedExperiences(allExps.filter((e) => experienceIds.includes(e.id)))
        }

        // Check if already purchased
        if (userId) {
          const purchases = await getUserPurchases(userId, prod.workspace_id)
          if (purchases.some((p) => p.product_id === productId)) {
            setPurchased(true)
          }
        }
      } catch (err) {
        console.error('Failed to load product', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  async function handlePurchase() {
    if (!userId || !productId) return
    setPurchasing(true)
    try {
      await purchaseProduct(userId, productId, selectedPlanId || undefined)
      setPurchased(true)
    } catch (err) {
      console.error('Purchase failed', err)
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--olu-muted)]">Product not found.</p>
      </div>
    )
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          {workspaceName && (
            <p className="text-xs text-[var(--olu-muted)]">{workspaceName}</p>
          )}
          <h1 className="font-black text-xl truncate">{product.name}</h1>
        </div>
      </div>

      {/* Product info */}
      <div className="px-4 space-y-4">
        {/* Description */}
        {product.description && (
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4">
            <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* What's included */}
        {includedExperiences.length > 0 && (
          <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
            <h3 className="font-semibold text-sm">{t('consumer.whatsIncluded', "What's included")}</h3>
            <div className="space-y-2">
              {includedExperiences.map((exp) => {
                const Icon = TYPE_ICON[exp.type] || MessageSquare
                return (
                  <div key={exp.id} className="flex items-center gap-3 p-2 rounded-xl bg-[var(--olu-card-bg)]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--olu-accent-bg)] flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-cyan-700 dark:text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{exp.name}</p>
                      <p className="text-xs text-[var(--olu-muted)] capitalize">{exp.type.replace('_', ' ')}</p>
                    </div>
                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pricing plans */}
        {plans.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm px-1">{t('consumer.choosePlan', 'Choose a plan')}</h3>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                disabled={purchased}
                className={clsx(
                  'w-full rounded-2xl border p-4 text-left transition-all',
                  selectedPlanId === plan.id
                    ? 'border-cyan-400 bg-cyan-300/5 ring-1 ring-cyan-400/30'
                    : 'border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] hover:border-[var(--olu-muted)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      ${plan.price}
                      {plan.interval && <span className="text-[var(--olu-muted)] font-normal">/{plan.interval}</span>}
                    </p>
                    <p className="text-xs text-[var(--olu-muted)] mt-0.5">
                      {plan.billing_type === 'one_time' ? 'One-time payment' : `Billed ${plan.interval}ly`}
                      {(plan.trial_days ?? 0) > 0 && ` · ${plan.trial_days}-day free trial`}
                    </p>
                  </div>
                  <div className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedPlanId === plan.id
                      ? 'border-cyan-400 bg-cyan-400'
                      : 'border-[var(--olu-muted)]'
                  )}>
                    {selectedPlanId === plan.id && <Check size={12} className="text-[#04111f]" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Purchase button */}
        <div className="pt-2">
          {purchased ? (
            <div className="w-full rounded-2xl py-3 text-center bg-emerald-400/10 border border-emerald-400/30">
              <span className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Check size={16} />
                {t('consumer.purchased', 'Purchased')}
              </span>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={purchasing || (!selectedPlanId && product.access_type === 'paid')}
              className={clsx(
                'w-full rounded-2xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                product.access_type === 'free'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50'
              )}
            >
              {purchasing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  {product.access_type === 'free'
                    ? t('consumer.joinFree', 'Join Free')
                    : selectedPlan
                      ? `${t('consumer.getAccess', 'Get Access')} · $${selectedPlan.price}${selectedPlan.interval ? `/${selectedPlan.interval}` : ''}`
                      : t('consumer.getAccess', 'Get Access')
                  }
                </>
              )}
            </button>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <span className="flex items-center gap-1 text-xs text-[var(--olu-muted)]">
            <ShieldCheck size={12} />
            Secure checkout
          </span>
          <span className="text-xs text-[var(--olu-muted)]">Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}
