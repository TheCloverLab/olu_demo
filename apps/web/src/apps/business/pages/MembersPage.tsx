import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Users, CreditCard, Check, X, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { getWorkspacePurchases, type PurchaseWithDetails } from '../../../domain/product/api'
import { getWorkspaceMembers, type WorkspaceMember } from '../../../domain/workspace/api'

function Avatar({ initials, color, img }: { initials: string; color: string; img?: string }) {
  if (img) {
    return <img src={img} alt={initials} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
  }
  return (
    <div className={clsx('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-xs flex-shrink-0', color)}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-red-400/10 text-red-600 dark:text-red-400',
    expired: 'bg-gray-400/10 text-gray-600 dark:text-gray-400',
    refunded: 'bg-amber-400/10 text-amber-600 dark:text-amber-400',
  }
  const icons: Record<string, typeof Check> = { active: Check, cancelled: X, expired: X, refunded: X }
  const Icon = icons[status] || Check

  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1', styles[status] || styles.active)}>
      <Icon size={10} />
      {status}
    </span>
  )
}

export default function MembersPage() {
  const { t } = useTranslation()
  const { workspace } = useApp()
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspace?.id) return
    Promise.all([
      getWorkspacePurchases(workspace.id),
      getWorkspaceMembers(workspace.id),
    ])
      .then(([p, m]) => { setPurchases(p); setMembers(m) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspace?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  const active = purchases.filter((p) => p.status === 'active')
  const other = purchases.filter((p) => p.status !== 'active')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl">{t('nav.members', 'Customers')}</h1>
          <p className="text-sm text-[var(--olu-muted)]">{members.length} customers, {purchases.length} purchases</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <Users size={14} />
            {members.length} customers
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('members.totalMembers', 'Total Customers'), value: members.length, color: 'text-cyan-500' },
          { label: t('members.activeMembers'), value: active.length, color: 'text-emerald-500' },
          { label: t('members.paid'), value: active.filter((p) => p.plan_label !== 'Free').length, color: 'text-amber-500' },
          { label: t('members.churned'), value: other.length, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-3">
            <p className="text-xs text-[var(--olu-muted)]">{stat.label}</p>
            <p className={clsx('text-2xl font-black mt-1', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--olu-card-border)]">
          <h2 className="font-semibold text-sm">{t('members.joinedMembers', 'Customers')}</h2>
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--olu-muted)]">No customers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--olu-card-border)]">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--olu-card-hover)] transition-colors">
                <Avatar
                  initials={m.user?.initials || '??'}
                  color={m.user?.avatar_color || 'from-gray-400 to-gray-500'}
                  img={m.user?.avatar_img || undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{m.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-[var(--olu-muted)]">{m.user?.handle || ''}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-[var(--olu-muted)]">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  <Check size={10} />
                  customer
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase records */}
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--olu-card-border)]">
          <h2 className="font-semibold text-sm">{t('members.purchaseRecords')}</h2>
        </div>
        {purchases.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--olu-muted)]">{t('members.noPurchases')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--olu-card-border)]">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--olu-card-hover)] transition-colors">
                <Avatar initials={p.buyer_initials} color={p.buyer_avatar_color} img={p.buyer_avatar_img} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.buyer_name}</p>
                  <p className="text-xs text-[var(--olu-muted)]">{p.buyer_handle}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{p.product_name}</p>
                  <p className="text-xs text-[var(--olu-muted)]">{p.plan_label}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-[var(--olu-muted)]">
                    {new Date(p.started_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
