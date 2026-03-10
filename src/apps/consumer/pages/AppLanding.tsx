import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, BookOpen, Crown, FileText, Lock, MessageCircle, Send, ShoppingBag, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { getCommunityMembershipTiers, getCommunityPosts, getCommunityProducts } from '../../../domain/consumer/data'
import { getMembershipStatus, getPurchasedCourseSlugs } from '../../../domain/consumer/engagement'
import { getProfileById } from '../../../domain/profile/api'
import { getPublicCommunityConfigsByOwner } from '../../../domain/profile/data'
import { getCommunityTitle } from '../../../domain/consumer/apps'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

export default function AppLanding() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, enabledBusinessModules } = useApp()

  const [creator, setCreator] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [tiers, setTiers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [tab, setTab] = useState<'overview' | 'content' | 'access'>('overview')
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coverBroken, setCoverBroken] = useState(false)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<{ tier_name?: string } | null>(null)
  const [hasCourseAccess, setHasCourseAccess] = useState(false)
  const [communityTitle, setCommunityTitle] = useState<string | null>(null)
  const avatarSrc = creator?.avatar_img || creator?.avatarImg
  const isCommunity = true
  const isOwner = !!creator?.id && currentUser?.id === creator.id
  const canManageApp = isOwner && enabledBusinessModules.includes('creator_ops')

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const [creatorData, postData, tierData, productData] = await Promise.all([
          getProfileById(id),
          getCommunityPosts(id),
          getCommunityMembershipTiers(id),
          getCommunityProducts(id),
        ])

        setCreator(creatorData)
        setPosts(postData)
        setTiers(tierData)
        setProducts(productData)

        // Load custom community title (graceful fallback)
        getPublicCommunityConfigsByOwner([id])
          .then((configs) => {
            const cfg = configs.get(id)
            if (cfg?.community_hero_title) setCommunityTitle(cfg.community_hero_title)
          })
          .catch(() => {})
      } catch (err) {
        console.error('Failed loading creator app', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    async function loadAccess() {
      if (!id) return

      if (isCommunity) {
        const status = await getMembershipStatus(currentUser?.id ? currentUser as any : null, id).catch(() => null)
        setMembershipStatus(status)
        setHasCourseAccess(false)
        return
      }

      const purchased = await getPurchasedCourseSlugs(currentUser?.id ? currentUser as any : null, []).catch(() => [])
      setHasCourseAccess(purchased.length > 0)
      setMembershipStatus(null)
    }

    loadAccess()
  }, [isCommunity, currentUser, id])

  const appCopy = useMemo(() => {
    if (isCommunity) {
      return {
        eyebrow: 'Community',
        titleSuffix: 'Inner Circle',
        summary: 'Join recurring conversations, member-only drops, and creator rituals that stay alive every week.',
        primaryCta: membershipStatus ? 'Open membership' : 'Join membership',
        primaryHref: '/membership',
        secondaryCta: 'Open topics',
        secondaryHref: '/topics',
        stats: [
          { val: formatNumber(tiers.reduce((acc, t) => acc + (t.subscriber_count || 0), 0)), label: 'Members' },
          { val: formatNumber(posts.length), label: 'Member drops' },
          { val: formatNumber(creator?.followers || 0), label: 'Followers' },
        ],
        tabs: [
          { key: 'overview', label: 'Overview', icon: Sparkles },
          { key: 'content', label: 'Recent drops', icon: FileText },
          { key: 'access', label: 'Membership', icon: Crown },
        ] as const,
        included: [
          'Member-only updates and creator notes',
          'Private topics with recurring discussion',
          'Live sessions and priority Q&A',
        ],
        nowLive: [
          posts[0]?.title || 'Weekly critique thread',
          posts[1]?.title || 'Backstage drop preview',
          'Members chat and event calendar',
        ],
      }
    }

    return {
      eyebrow: 'Academy',
      titleSuffix: 'Academy',
      summary: 'Browse structured lessons, outcome-led curriculum, and a course flow designed for repeat learning.',
      primaryCta: hasCourseAccess ? 'Open learning' : 'Browse catalog',
      primaryHref: hasCourseAccess ? '/learning' : '/courses',
      secondaryCta: 'Browse courses',
      secondaryHref: '/courses',
      stats: [
        { val: formatNumber(posts.length), label: 'Sample lessons' },
        { val: formatNumber(products.length), label: 'Offers' },
        { val: formatNumber(creator?.followers || 0), label: 'Followers' },
      ],
      tabs: [
        { key: 'overview', label: 'Overview', icon: BookOpen },
        { key: 'content', label: 'Curriculum', icon: FileText },
        { key: 'access', label: 'Offer', icon: ShoppingBag },
      ] as const,
      included: [
        'Structured lessons and clear outcomes',
        'Self-paced chapters with progress tracking',
        'Templates, examples, and rewatchable sessions',
      ],
      nowLive: [
        posts[0]?.title || 'Course walkthrough and module notes',
        products[0]?.name || 'Course bundle and workbook',
        'Learning hub with next-lesson flow',
      ],
    }
  }, [isCommunity, membershipStatus, hasCourseAccess, tiers, posts, products, creator?.followers])

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading app...</div>
  if (!creator) return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">App not found.</div>

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {isCommunity ? null : (
        <div className={`h-44 bg-gradient-to-br ${creator.avatar_color || 'from-gray-700 to-gray-900'} relative mx-4 rounded-3xl overflow-hidden`}>
          {creator.cover_img && !coverBroken && (
            <img
              src={creator.cover_img}
              alt=""
              className="w-full h-full object-cover opacity-80"
              onError={() => setCoverBroken(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-olu-bg via-olu-bg/55 to-transparent" />
        </div>
      )}

      <div className={clsx('px-4 relative', isCommunity ? 'pt-2' : '-mt-10')}>
        <div className={clsx('backdrop-blur', isCommunity ? 'rounded-2xl bg-[#111111] p-4 md:p-5' : 'rounded-3xl bg-[#111111]/90 p-5 md:p-6')}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex gap-4">
              {isCommunity ? null : (
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg shadow-xl overflow-hidden flex-shrink-0`}>
                  {avatarSrc && !avatarBroken ? (
                    <img src={avatarSrc} alt={creator.name} className="w-full h-full object-cover" onError={() => setAvatarBroken(true)} />
                  ) : (
                    creator.initials
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-olu-muted mb-2">{appCopy.eyebrow}</p>
                <div className="flex items-center gap-2">
                <h1 className={clsx('font-black', isCommunity ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl')}>{communityTitle || getCommunityTitle(creator)}</h1>
                  {creator.verified && <BadgeCheck size={18} className="text-sky-400 flex-shrink-0" fill="currentColor" />}
                </div>
                {isCommunity ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-olu-muted">
                    <button
                      onClick={() => navigate(`/people/${creator.id}`)}
                      className="hover:text-white transition-colors"
                    >
                      Hosted by {creator.name}
                    </button>
                    {canManageApp ? (
                      <button
                        onClick={() => navigate('/business/consumer')}
                        className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs text-sky-200 hover:bg-sky-400/15 transition-colors"
                      >
                        Manage community
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/chat?with=${creator.id}`)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72 hover:bg-white/8 transition-colors"
                      >
                        Message host
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/people/${creator.id}`)}
                    className="text-olu-muted text-sm mt-2 hover:text-white transition-colors"
                  >
                    {creator.handle}
                  </button>
                )}
                <p className="text-sm text-olu-muted mt-3 leading-relaxed max-w-2xl">{creator.bio || appCopy.summary}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={() => navigate(appCopy.primaryHref)}
                className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <Crown size={14} />
                {appCopy.primaryCta}
              </button>
              <button
                onClick={() => navigate(appCopy.secondaryHref)}
                className="px-4 py-2.5 rounded-xl glass glass-hover text-olu-muted text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <Send size={14} />
                {appCopy.secondaryCta}
              </button>
              {isCommunity ? null : (
                <button
                  onClick={() => setFollowing(!following)}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    following ? 'bg-white/10 text-sky-400 border border-white/10' : 'glass glass-hover text-olu-muted'
                  )}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div className={clsx('grid gap-3 mt-5', isCommunity ? 'grid-cols-3' : 'grid-cols-3')}>
            {appCopy.stats.map((item) => (
              <div key={item.label} className={clsx('border border-white/[0.04] px-4 py-3', isCommunity ? 'rounded-full bg-white/5' : 'rounded-2xl bg-[#181818]')}>
                <p className={clsx('font-black', isCommunity ? 'text-base' : 'text-xl')}>{item.val}</p>
                <p className="text-olu-muted text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-olu-card rounded-xl mt-5 mb-5">
          {appCopy.tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all', tab === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <p className="font-semibold text-sm mb-3">{isCommunity ? 'Latest in the community' : 'Included in the academy'}</p>
                {isCommunity ? (
                  <div className="space-y-3">
                    {posts.slice(0, 3).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => navigate(`/content/${post.id}`)}
                        className="w-full rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-3 text-left hover:bg-white/[0.05] transition-colors"
                      >
                        <p className="font-medium text-sm text-white">{post.title}</p>
                        <p className="mt-1 text-xs text-olu-muted line-clamp-2">{post.preview}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-olu-muted">
                    {appCopy.included.map((item) => (
                      <div key={item} className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass rounded-2xl p-5">
                <p className="font-semibold text-sm mb-3">{isCommunity ? 'Community spaces' : 'Inside right now'}</p>
                {isCommunity ? (
                  <div className="space-y-2 text-sm text-olu-muted">
                    {[
                      'General feed',
                      'Topics',
                      membershipStatus ? `${membershipStatus.tier_name} member access` : 'Membership access',
                    ].map((item) => (
                      <div key={item} className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-olu-muted">
                    {appCopy.nowLive.map((item) => (
                      <div key={item} className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="space-y-4">
            {posts.length > 0 ? posts.map((post) => (
              <motion.div key={post.id} whileHover={{ y: -2 }} onClick={() => navigate(`/content/${post.id}`)} className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer">
                <div className={`h-36 bg-gradient-to-br ${post.gradient_bg || 'from-gray-700 to-gray-900'} flex items-center justify-center relative overflow-hidden`}>
                  {post.cover_img ? <img src={post.cover_img} alt={post.title} className="w-full h-full object-cover" /> : <div className="text-6xl opacity-20">{post.emoji}</div>}
                  {post.locked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                      <Lock size={16} className="text-white" />
                        <span className="text-white text-sm font-medium">Members only</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm mb-1">{post.title}</p>
                  <p className="text-olu-muted text-xs mb-3 line-clamp-1">{post.preview}</p>
                </div>
              </motion.div>
            )) : <div className="text-center py-12 text-olu-muted text-sm">No content yet</div>}
          </div>
        )}

        {tab === 'access' && (
          <div className="space-y-3">
            {isCommunity ? (
              tiers.length > 0 ? tiers.map((tier) => (
                <div key={tier.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{tier.name}</p>
                    <p className="font-bold">{tier.price === 0 ? 'Free' : `$${tier.price}/mo`}</p>
                  </div>
                  <p className="text-olu-muted text-xs mb-2">{tier.description}</p>
                  <p className="text-olu-muted text-xs">{formatNumber(tier.subscriber_count || 0)} subscribers</p>
                </div>
              )) : <div className="text-center py-12 text-olu-muted text-sm">No membership tiers yet</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <div key={p.id} className="glass rounded-2xl overflow-hidden">
                    <div className="aspect-square bg-[#161616]">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                      <p className="text-olu-muted text-xs">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <div className="col-span-2 text-center py-12 text-olu-muted text-sm">No offers yet</div>}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {canManageApp ? null : (
            <button
              onClick={() => navigate(`/chat?with=${creator.id}`)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold glass glass-hover text-olu-muted flex items-center gap-2"
            >
              <MessageCircle size={15} />
              Message creator
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
