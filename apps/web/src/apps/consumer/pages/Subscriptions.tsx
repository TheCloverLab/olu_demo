import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, RefreshCcw } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getCommunityMembershipTiers } from '../../../domain/consumer/data'
import { getMembershipStatus } from '../../../domain/consumer/engagement'
import { getPublicCreators } from '../../../domain/profile/api'
import type { MembershipTier, User } from '../../../lib/supabase'

type ActiveSubscription = {
  creator: User
  membership: { tier_name?: string; tier_key?: string } | null
  tier: MembershipTier | null
}

export default function Subscriptions() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadSubscriptions() {
      if (!user?.id) return

      try {
        const creators = await getPublicCreators()
        const entries = await Promise.all(
          creators.map(async (creator) => {
            const membership = await getMembershipStatus(user as any, creator.id).catch(() => null)
            if (!membership?.tier_name) return null

            const tiers = await getCommunityMembershipTiers(creator.id).catch(() => [] as MembershipTier[])
            const tier = tiers.find((item) => item.key === membership.tier_key || item.name === membership.tier_name) || null

            return {
              creator,
              membership,
              tier,
            }
          }),
        )

        if (cancelled) return
        setSubscriptions(entries.filter(Boolean) as ActiveSubscription[])
      } catch (error) {
        console.error('Failed to load subscriptions', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSubscriptions()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <section className="rounded-[28px] border border-olu-border bg-olu-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-olu-muted">Subscriptions</p>
        <h1 className="font-black text-2xl mt-2">Your active memberships</h1>
        <p className="text-sm text-olu-muted mt-2">
          Review the communities you support, the tier you are on, and where to jump back in.
        </p>
      </section>

      <section className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mt-5">
        {loading ? (
          <div className="text-sm text-olu-muted">Loading memberships...</div>
        ) : subscriptions.length > 0 ? (
          <div className="space-y-3">
            {subscriptions.map(({ creator, membership, tier }) => (
              <button
                key={creator.id}
                onClick={() => navigate(`/communities/${creator.id}`)}
                className="w-full rounded-2xl border border-olu-border bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{creator.name} Community</p>
                    <p className="text-xs text-olu-muted mt-1">{membership?.tier_name || 'Active member'}</p>
                    <p className="text-xs text-olu-muted mt-2">{creator.bio || 'Membership access and recurring community drops.'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300">
                      <Crown size={12} />
                      {tier ? `$${tier.price}/mo` : 'Active'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-olu-border px-4 py-6 text-sm text-olu-muted">
            No active memberships yet.
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Renewals and changes</p>
            <p className="text-xs text-olu-muted mt-1">
              Membership renewals are automatic in the final product. For now, use the community page to review access.
            </p>
          </div>
          <RefreshCcw size={18} className="text-olu-muted" />
        </div>
      </section>
    </div>
  )
}
