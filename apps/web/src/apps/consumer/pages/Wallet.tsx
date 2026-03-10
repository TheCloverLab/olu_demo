import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, BookOpen, CreditCard, Crown, Plus, ReceiptText } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getUserWallet } from '../../../domain/workspace/api'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { getCommunityMembershipTiers } from '../../../domain/consumer/data'
import { getMembershipStatus, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getPublicCreators } from '../../../domain/profile/api'
import type { Course } from '../courseData'

type ChargeItem = {
  id: string
  label: string
  detail: string
  amount: string
  href: string
  kind: 'membership' | 'course'
}

type TxnItem = {
  id: string
  label: string
  detail: string
  amount: string
  direction: 'in' | 'out'
  date: string
}

function fallbackPriceFromCourse(course: Course) {
  if (typeof course.price === 'number') return `$${course.price}`
  return 'Paid'
}


const DEMO_TRANSACTIONS: TxnItem[] = [
  { id: 'txn-1', label: 'Top-up via Apple Pay', detail: 'Mar 8, 2026', amount: '+$50.00', direction: 'in', date: '2026-03-08' },
  { id: 'txn-2', label: 'Pixel Realm membership', detail: 'Mar 7, 2026 · Monthly renewal', amount: '-$9.99', direction: 'out', date: '2026-03-07' },
  { id: 'txn-3', label: 'Lo-fi Production 101', detail: 'Mar 3, 2026 · Course purchase', amount: '-$39.00', direction: 'out', date: '2026-03-03' },
  { id: 'txn-4', label: 'Referral bonus', detail: 'Feb 28, 2026 · Invited Jordan Lee', amount: '+$5.00', direction: 'in', date: '2026-02-28' },
  { id: 'txn-5', label: 'Top-up via card', detail: 'Feb 25, 2026', amount: '+$100.00', direction: 'in', date: '2026-02-25' },
  { id: 'txn-6', label: 'The Listening Room membership', detail: 'Feb 20, 2026 · Monthly renewal', amount: '-$4.99', direction: 'out', date: '2026-02-20' },
  { id: 'txn-7', label: 'Digital Art Masterclass', detail: 'Feb 15, 2026 · Course purchase', amount: '-$49.00', direction: 'out', date: '2026-02-15' },
  { id: 'txn-8', label: 'Welcome bonus', detail: 'Feb 10, 2026 · New account', amount: '+$10.00', direction: 'in', date: '2026-02-10' },
]

export default function Wallet() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [membershipCharges, setMembershipCharges] = useState<ChargeItem[]>([])
  const [courseCharges, setCourseCharges] = useState<ChargeItem[]>([])
  const [balanceUsdc, setBalanceUsdc] = useState(0)
  const [points, setPoints] = useState(0)
  const [walletReady, setWalletReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadWallet() {
      if (!user?.id) return

      // Load wallet balance from DB
      getUserWallet(user.id).then((w) => {
        if (!cancelled) {
          if (w) {
            setBalanceUsdc(Number(w.usdc_balance))
            setPoints(Number(w.token_balance))
          }
          setWalletReady(true)
        }
      }).catch(() => { if (!cancelled) setWalletReady(true) })

      try {
        const [creators, courseSnapshot] = await Promise.all([
          getPublicCreators(),
          getCourseLibrarySnapshot(),
        ])

        const memberships = await Promise.all(
          creators.map(async (creator) => {
            const membership = await getMembershipStatus(user as any, creator.id).catch(() => null)
            if (!membership?.tier_name) return null

            const tiers = await getCommunityMembershipTiers(creator.id).catch(() => [])
            const tier = tiers.find((item) => item.key === membership.tier_key || item.name === membership.tier_name) || null

            return {
              id: `membership-${creator.id}`,
              label: `${creator.name} Community`,
              detail: membership.tier_name,
              amount: tier ? `$${tier.price}/mo` : 'Active',
              href: `/communities/${creator.id}`,
              kind: 'membership' as const,
            }
          }),
        )

        const purchasedSlugs = await getPurchasedCourseSlugs(user as any, courseSnapshot.courses).catch(() => [])
        const purchasedCourses = courseSnapshot.courses
          .filter((course) => purchasedSlugs.includes(course.slug))
          .map((course) => ({
            id: `course-${course.id}`,
            label: course.title,
            detail: course.instructor || 'Academy purchase',
            amount: fallbackPriceFromCourse(course),
            href: `/courses/${course.slug}/catalog`,
            kind: 'course' as const,
          }))

        if (cancelled) return
        setMembershipCharges(memberships.filter(Boolean) as ChargeItem[])
        setCourseCharges(purchasedCourses)
      } catch (error) {
        console.error('Failed to load wallet', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWallet()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const totalMemberships = membershipCharges.length
  const totalAcademies = courseCharges.length
  const recentCharges = useMemo(() => [...membershipCharges, ...courseCharges].slice(0, 6), [membershipCharges, courseCharges])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Balance card */}
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#111111] to-[#0a0e17] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Total balance</p>
            <h1 className="font-black text-4xl mt-2">${balanceUsdc.toFixed(2)}</h1>
            <p className="text-sm text-olu-muted mt-2">
              {points.toLocaleString()} points earned
            </p>
          </div>
          <CreditCard size={22} className="text-white/35" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/5 p-3">
            <p className="text-xs text-olu-muted">USDC Balance</p>
            <p className="font-bold text-lg mt-1">{balanceUsdc.toFixed(2)} <span className="text-xs text-olu-muted font-normal">USDC</span></p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/5 p-3">
            <p className="text-xs text-olu-muted">Token Balance</p>
            <p className="font-bold text-lg mt-1">{points.toLocaleString()} <span className="text-xs text-olu-muted font-normal">OLU</span></p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="flex items-center gap-2 rounded-2xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors">
            <Plus size={16} /> Top up
          </button>
          <button className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors">
            <ArrowUpRight size={16} /> Send
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{totalMemberships}</span>
            <span className="ml-2 text-olu-muted">Memberships</span>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{totalAcademies}</span>
            <span className="ml-2 text-olu-muted">Academies</span>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{recentCharges.length}</span>
            <span className="ml-2 text-olu-muted">Charges</span>
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Transactions</p>
            <p className="font-semibold text-base mt-1">Recent activity</p>
          </div>
          <ReceiptText size={18} className="text-white/45" />
        </div>

        <div className="space-y-2">
          {DEMO_TRANSACTIONS.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3.5"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                txn.direction === 'in' ? 'bg-emerald-500/15' : 'bg-white/5'
              }`}>
                {txn.direction === 'in'
                  ? <ArrowDownLeft size={14} className="text-emerald-400" />
                  : <ArrowUpRight size={14} className="text-white/45" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{txn.label}</p>
                <p className="text-xs text-olu-muted mt-0.5">{txn.detail}</p>
              </div>
              <span className={`text-sm font-semibold ${
                txn.direction === 'in' ? 'text-emerald-400' : 'text-white/70'
              }`}>
                {txn.amount}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Memberships */}
      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Memberships</p>
            <p className="font-semibold text-base mt-1">Recurring support</p>
          </div>
          <Crown size={18} className="text-white/45" />
        </div>

        {loading ? (
          <div className="text-sm text-olu-muted">Loading membership charges...</div>
        ) : membershipCharges.length > 0 ? (
          <div className="space-y-3">
            {membershipCharges.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-olu-muted mt-1">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300">{item.amount}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
            No recurring memberships yet.
          </div>
        )}
      </section>

      {/* Course purchases */}
      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Purchases</p>
            <p className="font-semibold text-base mt-1">Academy purchases</p>
          </div>
          <BookOpen size={18} className="text-white/45" />
        </div>

        {loading ? (
          <div className="text-sm text-olu-muted">Loading purchases...</div>
        ) : courseCharges.length > 0 ? (
          <div className="space-y-3">
            {courseCharges.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-olu-muted mt-1">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-300">{item.amount}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-olu-muted">
            No academy purchases yet.
          </div>
        )}
      </section>

      {/* Payment methods */}
      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Payment methods</p>
            <p className="font-semibold text-base mt-1">Linked accounts</p>
          </div>
          <CreditCard size={18} className="text-white/45" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">AP</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Apple Pay</p>
              <p className="text-xs text-olu-muted">Default</p>
            </div>
            <span className="text-xs text-emerald-400">Connected</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">V</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Visa ····4829</p>
              <p className="text-xs text-olu-muted">Expires 09/27</p>
            </div>
            <span className="text-xs text-emerald-400">Active</span>
          </div>
        </div>

        <button className="mt-3 w-full rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-olu-muted hover:bg-white/[0.03] transition-colors">
          + Add payment method
        </button>
      </section>
    </div>
  )
}
