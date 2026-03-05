import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCheck, Heart, MessageCircle, Gift, Lock, ArrowLeft, Share2, ShoppingBag, Crown, Users, FileText, Repeat2, Check, X } from 'lucide-react'
import { CREATORS, POSTS, MEMBERSHIP_TIERS, SHOP_PRODUCTS, formatNumber } from '../data/mock'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

const SOCIAL_ICONS = {
  youtube: { icon: '▶', color: 'from-red-600 to-red-700', label: 'YouTube' },
  tiktok: { icon: '♪', color: 'from-gray-800 to-black', label: 'TikTok' },
  instagram: { icon: '◉', color: 'from-pink-600 to-purple-700', label: 'Instagram' },
  twitch: { icon: '⬡', color: 'from-purple-600 to-violet-700', label: 'Twitch' },
}

function MembershipModal({ tiers, onClose }) {
  const [selected, setSelected] = useState(null)
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="w-full max-w-md bg-olu-surface border border-olu-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-olu-border flex items-center justify-between">
            <h3 className="font-bold text-lg">Choose Membership</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/08"><X size={18} className="text-olu-muted" /></button>
          </div>
          <div className="p-4 space-y-3">
            {tiers.map((tier) => (
              <motion.button key={tier.id} whileHover={{ scale: 1.01 }} onClick={() => setSelected(tier.id)}
                className={clsx('w-full p-4 rounded-xl border text-left transition-all relative', selected === tier.id ? 'border-white/30 bg-white/5' : 'border-olu-border hover:border-white/20')}>
                {tier.popular && <span className="absolute top-3 right-3 text-xs bg-white text-black px-2 py-0.5 rounded-full font-medium">Popular</span>}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${tier.color} text-white text-xs font-bold mb-2`}>
                  <Crown size={10} />{tier.name}
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-black">{tier.price === 0 ? 'Free' : `$${tier.price}`}</span>
                  {tier.price > 0 && <span className="text-olu-muted text-sm">/month</span>}
                </div>
                <ul className="space-y-1">
                  {tier.perks.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-olu-muted">
                      <Check size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.button>
            ))}
          </div>
          <div className="p-4 border-t border-olu-border">
            <button className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:opacity-90 transition-opacity">
              {selected ? `Subscribe to ${tiers.find(t => t.id === selected)?.name}` : 'Select a Plan'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function IPLicenseModal({ creator, onClose }) {
  const [step, setStep] = useState(1)
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-olu-surface border border-olu-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-olu-border flex items-center justify-between">
            <div>
              <h3 className="font-bold">IP License Request</h3>
              <p className="text-olu-muted text-xs mt-0.5">Handled by Lisa (IP Manager)</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/08"><X size={18} className="text-olu-muted" /></button>
          </div>
          {step === 1 && (
            <div className="p-5 space-y-3">
              <p className="text-sm text-olu-muted">Select the type of IP license you need:</p>
              {[
                { type: 'Fan Art (Non-commercial)', price: 'Free', desc: 'Personal use only, must credit original creator' },
                { type: 'Fan Creation (Monetizable)', price: '30% revenue share', desc: 'Create and sell derivative content. Revenue split with creator.' },
                { type: 'Voice/Likeness', price: 'Negotiable', desc: 'Commercial use of creator\'s voice or likeness' },
                { type: 'Full IP License', price: 'Negotiable', desc: 'Broad commercial rights — contact Lisa directly' },
              ].map(item => (
                <button key={item.type} onClick={() => setStep(2)} className="w-full p-3 glass glass-hover rounded-xl text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sky-400 text-xs font-semibold">{item.price}</span>
                  </div>
                  <p className="text-olu-muted text-xs">{item.desc}</p>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="p-5">
              <div className="flex items-center gap-3 p-4 glass rounded-xl mb-4 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-lg">⚖️</div>
                <div>
                  <p className="font-semibold text-sm">Lisa is reviewing your request</p>
                  <p className="text-olu-muted text-xs">IP Manager · Usually responds in minutes</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ delay: i * 0.2, repeat: Infinity, duration: 1 }} />)}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 p-3 bg-olu-card rounded-xl">
                  <span className="text-olu-muted text-xs mt-0.5">Lisa:</span>
                  <p className="text-xs text-olu-muted flex-1">Hi! I've received your fan creation license request for Luna's IP. For monetizable fan content, the terms are: 30% of net revenue goes to Luna's account. You retain 70%. All content must credit @lunachen. Want to proceed?</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-olu-border text-sm font-medium text-olu-muted hover:text-olu-text transition-colors">Cancel</button>
                <button className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity">Accept Terms</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function CreatorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentRole } = useApp()
  const creator = CREATORS.find(c => c.id === id) || CREATORS[0]
  const posts = POSTS.filter(p => p.creatorId === creator.id)
  const tiers = MEMBERSHIP_TIERS[creator.id] || MEMBERSHIP_TIERS.luna
  const [tab, setTab] = useState('posts')
  const [showMembership, setShowMembership] = useState(false)
  const [showIPLicense, setShowIPLicense] = useState(false)
  const [following, setFollowing] = useState(false)

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      {/* Back */}
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Cover */}
      <div className={`h-40 bg-gradient-to-br ${creator.coverColor} relative mx-4 rounded-2xl overflow-hidden`}>
        {creator.coverImg && <img src={creator.coverImg} alt="" className="w-full h-full object-cover opacity-75" />}
        <div className="absolute inset-0 bg-gradient-to-t from-olu-bg/80 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${creator.avatarColor} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg shadow-xl overflow-hidden`}>
            {creator.avatarImg ? <img src={creator.avatarImg} alt={creator.name} className="w-full h-full object-cover" /> : creator.initials}
          </div>
          <div className="flex gap-2 mb-1">
            {currentRole !== 'creator' && (
              <button onClick={() => setShowIPLicense(true)} className="px-3 py-2 rounded-xl glass glass-hover text-xs font-medium flex items-center gap-1.5 text-olu-muted border border-white/10">
                <FileText size={13} /> License IP
              </button>
            )}
            <button onClick={() => setShowMembership(true)} className="px-3 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <Crown size={13} /> Subscribe
            </button>
            <button onClick={() => setFollowing(!following)} className={clsx('p-2 rounded-xl transition-all', following ? 'bg-white/10 text-sky-400 border border-white/10' : 'glass glass-hover text-olu-muted')}>
              {following ? <Check size={16} /> : <Users size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-black text-xl">{creator.name}</h1>
          {creator.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-sm mb-2">{creator.handle} · {creator.category}</p>
        <p className="text-sm mb-4 text-olu-muted leading-relaxed">{creator.bio}</p>

        {/* Stats */}
        <div className="flex gap-6 mb-5">
          {[
            { val: formatNumber(creator.followers), label: 'Followers' },
            { val: '847', label: 'Posts' },
            { val: '12.4K', label: 'Members' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-bold text-base">{s.val}</p>
              <p className="text-olu-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Social Links — prominently displayed */}
        {creator.socialLinks && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(creator.socialLinks).map(([key, url]) => {
              const info = SOCIAL_ICONS[key]
              return (
                <a key={key} href="#" onClick={(e) => e.preventDefault()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${info.color} text-white text-xs font-semibold hover:opacity-90 transition-opacity`}>
                  <span>{info.icon}</span>
                  {info.label}
                </a>
              )
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-5">
          {[
            { key: 'posts', label: 'Posts', icon: FileText },
            { key: 'shop', label: 'Shop', icon: ShoppingBag },
            { key: 'members', label: 'Members', icon: Crown },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all', tab === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text')}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {tab === 'posts' && (
          <div className="space-y-4">
            {posts.length > 0 ? posts.map((post) => (
              <motion.div key={post.id} whileHover={{ y: -2 }} onClick={() => navigate(`/content/${post.id}`)}
                className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer">
                <div className={`h-36 bg-gradient-to-br ${post.gradientBg} flex items-center justify-center relative`}>
                  <div className="text-6xl opacity-20">{post.emoji}</div>
                  {post.locked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                      <Lock size={16} className="text-white" />
                      <span className="text-white text-sm font-medium">Unlock ${post.lockPrice}</span>
                    </div>
                  )}
                  {post.allowFanCreation && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      <Repeat2 size={10} /> Customer Create
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
                    <span className="ml-auto">{post.time}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12 text-olu-muted text-sm">No posts yet</div>
            )}
          </div>
        )}

        {tab === 'shop' && (
          <div className="grid grid-cols-2 gap-3">
            {SHOP_PRODUCTS.map((product) => (
              <motion.div key={product.id} whileHover={{ y: -2 }} className="glass glass-hover rounded-xl overflow-hidden cursor-pointer">
                <div className={`h-28 bg-gradient-to-br ${product.gradientBg} flex items-center justify-center text-4xl`}>
                  {product.emoji}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold mb-0.5 line-clamp-1">{product.name}</p>
                  <p className="text-olu-muted text-xs capitalize mb-2">{product.type}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">${product.price}</span>
                    <button className="text-xs bg-white text-black px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity">Buy</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.id} className={clsx('p-4 glass rounded-xl border', tier.popular ? 'border-white/20' : 'border-olu-border')}>
                {tier.popular && <div className="text-xs text-sky-400 font-semibold mb-2">⭐ Most Popular</div>}
                <div className="flex items-center justify-between mb-3">
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${tier.color} text-white text-xs font-bold inline-flex items-center gap-1.5`}>
                    <Crown size={10} />{tier.name}
                  </div>
                  <span className="font-black text-lg">{tier.price === 0 ? 'Free' : `$${tier.price}/mo`}</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {tier.perks.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-olu-muted">
                      <Check size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowMembership(true)} className={clsx('w-full py-2.5 rounded-xl text-sm font-semibold transition-all', tier.price === 0 ? 'glass glass-hover text-olu-text' : 'bg-white text-black hover:opacity-90')}>
                  {tier.price === 0 ? 'Join Free' : `Subscribe for $${tier.price}/mo`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMembership && <MembershipModal tiers={tiers} onClose={() => setShowMembership(false)} />}
      {showIPLicense && <IPLicenseModal creator={creator} onClose={() => setShowIPLicense(false)} />}
    </div>
  )
}
