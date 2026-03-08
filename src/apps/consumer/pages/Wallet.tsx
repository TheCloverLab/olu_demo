import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, CreditCard, Crown, ReceiptText } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import { getMembershipStatus, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getCreators, getMembershipTiersByCreator } from '../../../services/api'
import type { Course } from '../courseData'

type ChargeItem = {
  id: string
  label: string
  detail: string
  amount: string
  href: string
  kind: 'membership' | 'course'
}

function fallbackPriceFromCourse(course: Course) {
  if (typeof course.price === 'number') return `$${course.price}`
  return 'Paid'
}

export default function Wallet() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [membershipCharges, setMembershipCharges] = useState<ChargeItem[]>([])
  const [courseCharges, setCourseCharges] = useState<ChargeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadWallet() {
      if (!user?.id) return

      try {
        const [creators, courseSnapshot] = await Promise.all([
          getCreators(),
          getCourseLibrarySnapshot(),
        ])

        const memberships = await Promise.all(
          creators.map(async (creator) => {
            const membership = await getMembershipStatus(user as any, creator.id).catch(() => null)
            if (!membership?.tier_name) return null

            const tiers = await getMembershipTiersByCreator(creator.id).catch(() => [])
            const tier = tiers.find((item) => item.key === membership.tier_key || item.name === membership.tier_name) || null

            return {
              id: `membership-${creator.id}`,
              label: `${creator.name} Inner Circle`,
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

      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Wallet</p>
            <h1 className="font-black text-2xl mt-2">Payments and purchases</h1>
            <p className="text-sm text-olu-muted mt-2">
              Track membership renewals, academy purchases, and the things you already paid for.
            </p>
          </div>
          <CreditCard size={20} className="text-white/45" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{totalMemberships}</span>
            <span className="ml-2 text-olu-muted">Memberships</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{totalAcademies}</span>
            <span className="ml-2 text-olu-muted">Academies</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span className="font-semibold">{recentCharges.length}</span>
            <span className="ml-2 text-olu-muted">Recent charges</span>
          </div>
        </div>
      </section>

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

      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Receipts and billing history</p>
            <p className="text-xs text-olu-muted mt-1">
              Payment history will become downloadable when full checkout is wired in. For now this page reflects active consumer purchases.
            </p>
          </div>
          <ReceiptText size={18} className="text-white/45" />
        </div>
      </section>
    </div>
  )
}
