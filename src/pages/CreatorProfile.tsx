import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Heart, MessageCircle, Gift, Lock, ArrowLeft, ShoppingBag, Crown, FileText, Send } from 'lucide-react'
import clsx from 'clsx'
import { getMembershipTiersByCreator, getPostsByCreator, getProductsByCreator, getUserById } from '../services/api'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

export default function CreatorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [creator, setCreator] = useState<any | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [tiers, setTiers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [tab, setTab] = useState<'posts' | 'shop' | 'members'>('posts')
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coverBroken, setCoverBroken] = useState(false)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const avatarSrc = creator?.avatar_img || creator?.avatarImg

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const [creatorData, postData, tierData, productData] = await Promise.all([
          getUserById(id),
          getPostsByCreator(id),
          getMembershipTiersByCreator(id),
          getProductsByCreator(id),
        ])

        setCreator(creatorData)
        setPosts(postData)
        setTiers(tierData)
        setProducts(productData)
      } catch (err) {
        console.error('Failed loading creator profile', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Loading creator...</div>
  if (!creator) return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Creator not found.</div>

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className={`h-40 bg-gradient-to-br ${creator.avatar_color || 'from-gray-700 to-gray-900'} relative mx-4 rounded-2xl overflow-hidden`}>
        {creator.cover_img && !coverBroken && (
          <img
            src={creator.cover_img}
            alt=""
            className="w-full h-full object-cover opacity-75"
            onError={() => setCoverBroken(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-olu-bg/80 to-transparent" />
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg shadow-xl overflow-hidden`}>
            {avatarSrc && !avatarBroken ? (
              <img src={avatarSrc} alt={creator.name} className="w-full h-full object-cover" onError={() => setAvatarBroken(true)} />
            ) : (
              creator.initials
            )}
          </div>
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => navigate(`/chat?with=${creator.id}`)}
              className="px-3 py-2 rounded-xl glass glass-hover text-olu-muted text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Send size={13} /> Message
            </button>
            <button className="px-3 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0">
              <Crown size={13} /> Subscribe
            </button>
            <button
              onClick={() => setFollowing(!following)}
              className={clsx(
                'w-11 h-11 rounded-xl transition-all flex items-center justify-center flex-shrink-0 text-lg leading-none',
                following ? 'bg-white/10 text-sky-400 border border-white/10' : 'glass glass-hover text-olu-muted'
              )}
            >
              {following ? '✓' : '+'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-black text-xl">{creator.name}</h1>
          {creator.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-sm mb-2">{creator.handle}</p>
        <p className="text-sm mb-4 text-olu-muted leading-relaxed">{creator.bio || 'No bio yet.'}</p>

        <div className="flex gap-6 mb-5">
          {[
            { val: formatNumber(creator.followers), label: 'Followers' },
            { val: formatNumber(posts.length), label: 'Posts' },
            { val: formatNumber(tiers.reduce((acc, t) => acc + (t.subscriber_count || 0), 0)), label: 'Members' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-bold text-base">{s.val}</p>
              <p className="text-olu-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-5">
          {[
            { key: 'posts', label: 'Posts', icon: FileText },
            { key: 'shop', label: 'Shop', icon: ShoppingBag },
            { key: 'members', label: 'Members', icon: Crown },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all', tab === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {tab === 'posts' && (
          <div className="space-y-4">
            {posts.length > 0 ? posts.map((post) => (
              <motion.div key={post.id} whileHover={{ y: -2 }} onClick={() => navigate(`/content/${post.id}`)} className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer">
                <div className={`h-36 bg-gradient-to-br ${post.gradient_bg || 'from-gray-700 to-gray-900'} flex items-center justify-center relative overflow-hidden`}>
                  {post.cover_img ? <img src={post.cover_img} alt={post.title} className="w-full h-full object-cover" /> : <div className="text-6xl opacity-20">{post.emoji}</div>}
                  {post.locked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                      <Lock size={16} className="text-white" />
                      <span className="text-white text-sm font-medium">Unlock ${post.lock_price}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm mb-1">{post.title}</p>
                  <p className="text-olu-muted text-xs mb-3 line-clamp-1">{post.preview}</p>
                  <div className="flex items-center gap-4 text-xs text-olu-muted">
                    <span className="flex items-center gap-1"><Heart size={11} />{formatNumber(post.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} />{formatNumber(post.comments)}</span>
                    <span className="flex items-center gap-1"><Gift size={11} />{formatNumber(post.tips)}</span>
                  </div>
                </div>
              </motion.div>
            )) : <div className="text-center py-12 text-olu-muted text-sm">No posts yet</div>}
          </div>
        )}

        {tab === 'shop' && (
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
            {products.length === 0 && <div className="col-span-2 text-center py-12 text-olu-muted text-sm">No products yet</div>}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{tier.name}</p>
                  <p className="font-bold">{tier.price === 0 ? 'Free' : `$${tier.price}/mo`}</p>
                </div>
                <p className="text-olu-muted text-xs mb-2">{tier.description}</p>
                <p className="text-olu-muted text-xs">{formatNumber(tier.subscriber_count || 0)} subscribers</p>
              </div>
            ))}
            {tiers.length === 0 && <div className="text-center py-12 text-olu-muted text-sm">No membership tiers yet</div>}
          </div>
        )}
      </div>
    </div>
  )
}
