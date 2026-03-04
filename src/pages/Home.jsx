import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Gift, Lock, Repeat2, Search, BadgeCheck, TrendingUp, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CREATORS, POSTS, formatNumber } from '../data/mock'
import clsx from 'clsx'

function Avatar({ initials, color, size = 'md' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size]
  return (
    <div className={`bg-gradient-to-br ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${sz}`}>
      {initials}
    </div>
  )
}

function CreatorCard({ creator }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => navigate(`/creator/${creator.id}`)}
      className="glass rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Cover */}
      <div className={`h-24 bg-gradient-to-br ${creator.coverColor} relative overflow-hidden`}>
        {creator.coverImg && <img src={creator.coverImg} alt="" className="w-full h-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-4 -mt-6 relative">
        <div className="flex items-end justify-between mb-3">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${creator.avatarColor} flex items-center justify-center font-bold text-white text-lg border-2 border-olu-card overflow-hidden`}>
            {creator.avatarImg ? <img src={creator.avatarImg} alt={creator.name} className="w-full h-full object-cover" /> : creator.initials}
          </div>
          <button
            onClick={(e) => { e.stopPropagation() }}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Follow
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-sm">{creator.name}</p>
          {creator.verified && <BadgeCheck size={14} className="text-violet-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-xs mb-2">{creator.category}</p>
        <p className="text-olu-muted text-xs line-clamp-2 mb-3">{creator.bio}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{formatNumber(creator.followers)} <span className="text-olu-muted font-normal">followers</span></span>
          <div className="flex gap-1">
            {creator.tags.map(t => (
              <span key={t} className="text-xs bg-white/05 text-olu-muted px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PostCard({ post }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [tipped, setTipped] = useState(false)
  const [tipAmount, setTipAmount] = useState(null)

  const handleTip = (e) => {
    e.stopPropagation()
    setTipped(true)
    setTipAmount(2.00)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <button onClick={() => navigate(`/creator/${post.creatorId}`)}>
          {post.avatarImg
            ? <img src={post.avatarImg} alt={post.creatorName} className="w-10 h-10 rounded-full object-cover ring-2 ring-olu-border" />
            : <Avatar initials={post.initials} color={post.avatarColor} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(`/creator/${post.creatorId}`)} className="font-semibold text-sm hover:text-violet-300 transition-colors">{post.creatorName}</button>
            {post.verified && <BadgeCheck size={13} className="text-violet-400" fill="currentColor" />}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-olu-muted text-xs">{post.time}</p>
            {post.sponsored && (
              <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-medium">Sponsored</span>
            )}
          </div>
        </div>
      </div>

      {/* Content preview */}
      <button onClick={() => navigate(`/content/${post.id}`)} className="w-full text-left">
        <div className={`mx-4 rounded-xl h-44 bg-gradient-to-br ${post.gradientBg} flex items-center justify-center relative overflow-hidden`}>
          {post.coverImg && <img src={post.coverImg} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="text-7xl opacity-10 relative">{post.emoji}</div>
          {post.locked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Lock size={20} className="text-white" />
              <span className="text-white text-sm font-medium">Unlock for ${post.lockPrice}</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full capitalize">{post.type}</span>
          </div>
        </div>
        <div className="p-4 pt-3">
          <p className="font-semibold text-sm mb-1">{post.title}</p>
          <p className="text-olu-muted text-xs leading-relaxed line-clamp-2">{post.preview}</p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-4 border-t border-white/05 pt-3">
        <button
          onClick={() => setLiked(!liked)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all', liked ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/08 text-olu-muted')}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          {formatNumber(post.likes + (liked ? 1 : 0))}
        </button>
        <button
          onClick={() => navigate(`/content/${post.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/08 text-olu-muted transition-all"
        >
          <MessageCircle size={14} />
          {formatNumber(post.comments)}
        </button>
        {post.allowFanCreation && (
          <button
            onClick={() => navigate(`/content/${post.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-violet-600/20 text-violet-400 transition-all"
          >
            <Repeat2 size={14} />
            Fan Create
          </button>
        )}
        <button
          onClick={handleTip}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ml-auto', tipped ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-amber-500/10 text-olu-muted hover:text-amber-400')}
        >
          <Gift size={14} />
          {tipped ? `Tipped $${tipAmount}` : 'Tip'}
        </button>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const { currentRole } = useApp()
  const [tab, setTab] = useState('discover')
  const [search, setSearch] = useState('')

  const greeting = currentRole === 'creator' ? '👋 Your Dashboard' :
    currentRole === 'advertiser' ? '📣 Discover Creators' :
    currentRole === 'supplier' ? '🏭 Find Creator Partners' : '✨ Discover'

  const filteredCreators = CREATORS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olu-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search creators, content..."
          className="w-full pl-9 pr-4 py-2.5 bg-olu-card border border-olu-border rounded-xl text-sm placeholder:text-olu-muted focus:outline-none focus:border-violet-500/60 transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-olu-card rounded-xl">
        {[
          { key: 'discover', label: 'Discover', icon: Sparkles },
          { key: 'following', label: 'Following', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all', tab === key ? 'bg-olu-surface text-olu-text shadow-sm' : 'text-olu-muted hover:text-olu-text')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'discover' ? (
        <>
          {(currentRole === 'advertiser' || currentRole === 'supplier') && (
            <div className="mb-4 p-3 glass rounded-xl border border-violet-500/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">AI-Powered Discovery</p>
                <p className="text-xs text-olu-muted">Your AI Agent has pre-screened creators that match your criteria</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
