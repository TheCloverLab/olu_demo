import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, Clock3, Wallet, Coins, Landmark, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceWalletForUser } from '../../../domain/workspace/api'
import type { WorkspaceWallet } from '../../../lib/supabase'

const TAB_OPTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'payouts', label: 'Payouts' },
] as const

type TabKey = (typeof TAB_OPTIONS)[number]['key']

const REVENUE_SPLIT = [
  { source: 'Memberships', value: 48, amount: 1864.32, color: 'bg-indigo-400' },
  { source: 'Shop', value: 27, amount: 1038.54, color: 'bg-emerald-400' },
  { source: 'Tips', value: 15, amount: 582.1, color: 'bg-amber-400' },
  { source: 'Licensing', value: 10, amount: 392.7, color: 'bg-sky-400' },
]

const TRANSACTIONS = [
  { id: 'tx-1', type: 'in', title: 'VIP Collective subscription batch', channel: 'Memberships', amount: 426.88, at: 'Today, 10:42 AM', status: 'settled' },
  { id: 'tx-2', type: 'out', title: 'Payout to creator treasury', channel: 'Payout', amount: 300, at: 'Yesterday, 4:12 PM', status: 'processing' },
  { id: 'tx-3', type: 'in', title: 'Neon City Hoodie sales settlement', channel: 'Shop', amount: 218.3, at: 'Yesterday, 11:06 AM', status: 'settled' },
  { id: 'tx-4', type: 'in', title: 'GameVerse campaign milestone', channel: 'Licensing', amount: 1200, at: 'Mar 03, 9:20 AM', status: 'settled' },
  { id: 'tx-5', type: 'out', title: 'Bank transfer withdrawal', channel: 'Fiat', amount: 650, at: 'Mar 01, 3:01 PM', status: 'settled' },
]

export default function WalletPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('overview')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState('')
  const [wallet, setWallet] = useState<WorkspaceWallet | null>(null)

  useEffect(() => {
    if (user) {
      getWorkspaceWalletForUser(user).then(setWallet).catch(() => {})
    }
  }, [user?.id])

  const balances = {
    totalUsd: wallet ? Number(wallet.usdc_balance) + Number(wallet.pending_revenue) : 0,
    availableUsd: wallet ? Number(wallet.usdc_balance) : 0,
    pendingUsd: wallet ? Number(wallet.pending_revenue) : 0,
    usdc: wallet ? Number(wallet.usdc_balance) : 0,
  }

  const monthlyInflow = useMemo(
    () => TRANSACTIONS.filter((t) => t.type === 'in').reduce((acc, t) => acc + t.amount, 0),
    []
  )

  const handleRequestPayout = async () => {
    const amount = Number(withdrawAmount)

    if (!withdrawAmount || Number.isNaN(amount) || amount <= 0) {
      setPayoutMessage('Enter a valid withdrawal amount.')
      return
    }

    if (amount > balances.availableUsd) {
      setPayoutMessage(`Amount exceeds available balance ($${balances.availableUsd.toFixed(2)}).`)
      return
    }

    setWithdrawing(true)
    setPayoutMessage('')

    // Placeholder for backend payout API
    await new Promise((resolve) => setTimeout(resolve, 700))

    setWithdrawing(false)
    setWithdrawAmount('')
    setPayoutMessage(`Payout request for $${amount.toFixed(2)} submitted. Processing usually takes 1-2 business days.`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Wallet</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm">Earnings, payouts, and treasury</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
              tab === item.key ? 'bg-cyan-300 text-[#04111f]' : 'bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)]'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-[28px] p-4 md:col-span-2 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="text-[var(--olu-text-secondary)] text-xs mb-1">Total Wallet Balance</p>
              <p className="font-black text-3xl mb-3">${balances.totalUsd.toLocaleString()}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)]">Available</p>
                  <p className="font-semibold mt-1">${balances.availableUsd.toFixed(2)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)]">Pending</p>
                  <p className="font-semibold mt-1">${balances.pendingUsd.toFixed(2)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]">
                  <p className="text-[var(--olu-text-secondary)]">Treasury</p>
                  <p className="font-semibold mt-1">${balances.usdc.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <p className="text-[var(--olu-text-secondary)] text-xs mb-2">Withdraw</p>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={t('common.amountInUsd')}
                className="w-full rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--olu-card-border)]"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[100, 300, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setWithdrawAmount(String(quick))}
                    className="rounded-lg bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)] text-xs py-1.5"
                  >
                    ${quick}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={withdrawing}
                className="w-full mt-3 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              >
                {withdrawing ? 'Submitting...' : 'Request payout'}
              </button>
              {payoutMessage && (
                <p className="mt-2 text-xs text-[var(--olu-text-secondary)]">{payoutMessage}</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
            <p className="font-semibold mb-3">Revenue Mix (30 days)</p>
            <div className="space-y-3">
              {REVENUE_SPLIT.map((item) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[var(--olu-text-secondary)]">{item.source}</span>
                    <span className="font-semibold">${item.amount.toFixed(2)} · {item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-olu-border/40 overflow-hidden">
                    <div className={clsx('h-full rounded-full', item.color)} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-300">
                <ArrowDownLeft size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Inflow</p>
              </div>
              <p className="font-black text-2xl">${monthlyInflow.toFixed(2)}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Last 30 days</p>
            </div>

            <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <div className="flex items-center gap-2 mb-2 text-cyan-700 dark:text-cyan-300">
                <Coins size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Treasury</p>
              </div>
              <p className="font-black text-2xl">${balances.usdc.toFixed(2)}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Treasury balance</p>
            </div>

            <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
              <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-300">
                <Clock3 size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Next Payout</p>
              </div>
              <p className="font-black text-2xl">2 days</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Scheduled bank settlement</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="rounded-[28px] p-4 space-y-3 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
          {TRANSACTIONS.map((tx) => (
            <motion.div key={tx.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300')}>
                {tx.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{tx.title}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{tx.channel} · {tx.at}</p>
              </div>
              <div className="text-right">
                <p className={clsx('font-semibold', tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-300' : 'text-cyan-700 dark:text-cyan-300')}>
                  {tx.type === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
                <p className={clsx('text-[11px] capitalize', tx.status === 'settled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                  {tx.status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="space-y-4">
          <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
            <p className="font-semibold mb-3">Payout Methods</p>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Landmark size={16} className="text-emerald-600 dark:text-emerald-300" />
                  <div>
                    <p className="text-sm font-medium">Bank Transfer (USD)</p>
                    <p className="text-[var(--olu-text-secondary)] text-xs">Chase **** 9831 · primary</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">Active</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins size={16} className="text-cyan-700 dark:text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium">Treasury Wallet</p>
                    <p className="text-[var(--olu-text-secondary)] text-xs">Digital wallet · primary</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300">Active</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] p-4 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-[0_2px_12px_rgba(2,8,23,0.08)]">
            <p className="font-semibold mb-2">Risk & Compliance</p>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)]">
              <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-300 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Compliance checks passed</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">KYC level 2 verified · no payout holds in the last 90 days.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
