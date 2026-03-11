import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { getCommunityMembershipSnapshot, type CommunityTier } from '../../../domain/consumer/api'
import { getMembershipStatus, joinMembership } from '../../../domain/consumer/engagement'

export default function Membership() {
  const { t } = useTranslation()
  const { consumerConfig, consumerExperience } = useApp()
  const { user } = useAuth()
  const { membership } = consumerExperience.community
  const [tiers, setTiers] = useState<CommunityTier[]>(membership.tiers)
  const [summary, setSummary] = useState<{ totalMembers: number; activeFans: number; hostName?: string }>({
    totalMembers: 0,
    activeFans: 0,
  })
  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [activeTierKey, setActiveTierKey] = useState<string | null>(null)
  const [joiningTier, setJoiningTier] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSnapshot() {
      try {
        const snapshot = await getCommunityMembershipSnapshot(
          user as any,
          consumerConfig.featured_creator_id
        )
        if (!cancelled) {
          setTiers(snapshot.tiers)
          setCreatorId(snapshot.creator?.id || null)
          setSummary({
            totalMembers: snapshot.totalMembers,
            activeFans: snapshot.activeFans,
            hostName: snapshot.creator?.name,
          })
        }
      } catch (error) {
        console.error('Failed to load membership snapshot', error)
      }
    }

    loadSnapshot()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false

    async function loadMembershipStatus() {
      if (!creatorId) return
      const status = await getMembershipStatus(user as any, creatorId)
      if (!cancelled) {
        setActiveTierKey(status?.tier_key || null)
      }
    }

    loadMembershipStatus()
    return () => {
      cancelled = true
    }
  }, [creatorId, user?.id])

  async function handleJoin(tier: CommunityTier) {
    if (!creatorId) return
    setJoiningTier(tier.name)
    try {
      await joinMembership(user as any, creatorId, tier.key, tier.name)
      setActiveTierKey(tier.key)
    } catch (error) {
      console.error('Failed to join membership', error)
    } finally {
      setJoiningTier(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <Crown size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">{t('consumer.membership')}</h1>
          <p className="text-olu-muted text-sm">
            {summary.hostName
              ? `${summary.hostName} · ${summary.totalMembers} members`
              : membership.subtitle}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={`rounded-[24px] border p-5 ${
              index === 1
                ? 'bg-white text-black border-white'
                : index === 2
                  ? 'bg-amber-500/10 border-amber-400/20'
                  : 'bg-[var(--olu-card-bg)] border-olu-border'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-lg">{tier.name}</p>
              {index === 1 ? <Star size={16} className="text-black" fill="currentColor" /> : <Sparkles size={16} className={index === 2 ? 'text-amber-300' : 'text-olu-muted'} />}
            </div>
            <p className={`font-black text-3xl ${index === 1 ? 'text-black' : 'text-white'}`}>{tier.price}</p>
            <p className={`text-sm mt-2 ${index === 1 ? 'text-black/72' : 'text-olu-muted'}`}>{tier.note}</p>
            <div className="space-y-2 mt-5">
              {tier.perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2">
                  <ShieldCheck size={14} className={index === 1 ? 'text-black/70' : 'text-emerald-300'} />
                  <p className={`text-sm ${index === 1 ? 'text-black/72' : 'text-olu-muted'}`}>{perk}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleJoin(tier)}
              disabled={joiningTier === tier.name || activeTierKey === tier.key}
              className={`mt-5 w-full py-3 rounded-2xl font-semibold transition-opacity disabled:opacity-60 ${index === 1 ? 'bg-black text-white hover:opacity-90' : 'bg-white text-black hover:opacity-90'}`}
            >
              {activeTierKey === tier.key
                ? t('consumer.currentPlan')
                : joiningTier === tier.name
                  ? t('consumer.joining')
                  : tier.name === 'Free'
                    ? t('consumer.stayFree')
                    : t('consumer.choose', { name: tier.name })}
            </button>
          </div>
        ))}
      </div>

      {summary.activeFans > 0 && (
        <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mt-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-3 py-1.5 text-xs text-olu-muted">
              {t('consumer.activeNow', { count: summary.activeFans })}
            </span>
            <span className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-3 py-1.5 text-xs text-olu-muted">
              {t('consumer.memberChat')}
            </span>
            <span className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-3 py-1.5 text-xs text-olu-muted">
              {t('consumer.weeklyDrops')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
