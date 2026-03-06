import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Gift, Lock, Repeat2, Search, BadgeCheck, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CREATORS, POSTS, formatNumber } from '../data/mock'
import clsx from 'clsx'

const FILTERS = ['All', 'Art', 'Gaming', 'Music', 'Fashion', 'Tech', 'Coding']

// Patreon-style: image-first card, name + tagline below
function CreatorCard({ creator }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/creator/${creator.id}`)}
      className="cursor-pointer flex-shrink-0 w-44"
    >
      {/* Square image */}
      <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${creator.coverColor} overflow-hidden relative mb-2.5`}>
        {creator.coverImg && (
          <img src={creator.coverImg} alt={creator.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={e => e.stopPropagation()}
          className="absolute top-2 right-2 p-1"
        >
          <MoreHorizontal size={16} className="text-white/80" />
        </button>
      </div>
      <p className="font-bold text-sm leading-tight mb-0.5 line-clamp-1">{creator.name}</p>
      <p className="text-olu-muted text-xs line-clamp-2 leading-snug">{creator.bio}</p>
    </motion.div>
  )
}

// Patreon "Popular this week" list row
function CreatorRow({ creator }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/creator/${creator.id}`)}
      className="w-full flex items-center gap-3 py-3"
    >
      {/* Square thumbnail */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${creator.avatarColor} flex-shrink-0 overflow-hidden`}>
        {creator.avatarImg
          ? <img src={creator.avatarImg} alt={creator.name} className="w-full h-full object-cover" />
          : <span className="w-full h-full flex items-center justify-center font-bold text-white">{creator.initials}</span>
        }
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-semibold text-sm">{creator.name}</p>
          {creator.verified && <BadgeCheck size={13} className="text-sky-400 flex-shrink-0" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-xs line-clamp-1">{creator.bio}</p>
      </div>
      <button onClick={e => e.stopPropagation()} className="p-1 flex-shrink-0">
        <MoreHorizontal size={18} className="text-olu-muted" />
      </button>
      {/* Thumbnail preview */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${creator.coverColor} flex-shrink-0 overflow-hidden`}>
        {creator.coverImg && <img src={creator.coverImg} alt="" className="w-full h-full object-cover opacity-80" />}
      </div>
    </motion.button>
  )
}

function PostCard({ post }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [tipped, setTipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <button onClick={() => navigate(`/creator/${post.creatorId}`)}>
          {post.avatarImg
            ? <img src={post.avatarImg} alt={post.creatorName} className="w-9 h-9 rounded-full object-cover" />
            : <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${post.avatarColor} flex items-center justify-center font-bold text-white text-xs`}>{post.initials}</div>
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(`/creator/${post.creatorId}`)} className="font-semibold text-sm hover:text-olu-muted transition-colors">{post.creatorName}</button>
            {post.verified && <BadgeCheck size={13} className="text-sky-400" fill="currentColor" />}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-olu-muted text-xs">{post.time}</p>
            {post.sponsored && <span className="text-xs bg-[#2a2a2a] text-olu-muted px-1.5 py-0.5 rounded font-medium">Sponsored</span>}
          </div>
        </div>
        <button className="p-1"><MoreHorizontal size={18} className="text-olu-muted" /></button>
      </div>

      {/* Cover image */}
      <button onClick={() => navigate(`/content/${post.id}`)} className="w-full">
        <div className={`mx-3 rounded-xl overflow-hidden h-48 bg-gradient-to-br ${post.gradientBg} relative`}>
          {post.coverImg && <img src={post.coverImg} alt={post.title} className="w-full h-full object-cover" />}
          {post.locked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Lock size={20} className="text-white" />
              <span className="text-white text-sm font-semibold">Unlock for ${post.lockPrice}</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-black/50 text-white/80 px-2 py-0.5 rounded-full capitalize font-medium">{post.type}</span>
          </div>
        </div>

        <div className="px-4 pt-3 pb-1 text-left">
          <p className="font-bold text-sm mb-1">{post.title}</p>
          <p className="text-olu-muted text-xs leading-relaxed line-clamp-2">{post.preview}</p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 px-3 py-3 mt-1">
        <button
          onClick={() => setLiked(!liked)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all', liked ? 'text-pink-400' : 'text-olu-muted hover:text-white')}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          {formatNumber(post.likes + (liked ? 1 : 0))}
        </button>
        <button
          onClick={() => navigate(`/content/${post.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-olu-muted hover:text-white transition-colors"
        >
          <MessageCircle size={15} />
          {formatNumber(post.comments)}
        </button>
        {post.allowFanCreation && (
          <button
            onClick={() => navigate(`/content/${post.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-olu-muted hover:text-white transition-colors"
          >
            <Repeat2 size={15} />
            Customer Create
          </button>
        )}
        <button
          onClick={() => setTipped(!tipped)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ml-auto', tipped ? 'text-amber-400' : 'text-olu-muted hover:text-amber-400')}
        >
          <Gift size={15} />
          {tipped ? 'Tipped!' : 'Tip'}
        </button>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const { currentRole } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('discover')
  const [filter, setFilter] = useState('All')

  const filtered = CREATORS.filter(c => filter === 'All' || c.tags.includes(filter))
  const recent = CREATORS.slice(0, 3)
  const popular = [...CREATORS].sort((a, b) => b.followers - a.followers).slice(0, 4)

  return (
    <div className="pb-24 md:pb-6">
      {/* Constrained container for desktop */}
      <div className="max-w-2xl mx-auto">
        {/* Search bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 bg-[#1c1c1c] rounded-full px-4 py-2.5">
            <Search size={16} className="text-olu-muted flex-shrink-0" />
            <input
              placeholder="Search for creators or topics"
              className="flex-1 bg-transparent text-sm placeholder:text-olu-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx('chip flex-shrink-0', filter === f ? 'chip-active' : 'chip-inactive')}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mx-4 mb-5 p-1 bg-[#1a1a1a] rounded-full">
          {[
            { key: 'discover', label: 'Discover' },
            { key: 'following', label: 'Following' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx('flex-1 py-2 rounded-full text-sm font-semibold transition-all', tab === key ? 'bg-white text-black' : 'text-olu-muted hover:text-white')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'discover' ? (
        <div className="max-w-2xl mx-auto">
          {/* Recently visited */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-bold text-lg">Recently visited</h2>
              <button className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <ChevronRight size={16} className="text-olu-muted" />
              </button>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
              {recent.map(creator => (
                <button
                  key={creator.id}
                  onClick={() => navigate(`/creator/${creator.id}`)}
                  className="flex-shrink-0 flex items-center gap-3 bg-[#1c1c1c] rounded-2xl px-3 py-2.5 min-w-[160px] hover:bg-[#242424] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${creator.avatarColor} flex-shrink-0 overflow-hidden`}>
                    {creator.avatarImg
                      ? <img src={creator.avatarImg} alt={creator.name} className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center font-bold text-white text-sm">{creator.initials}</span>
                    }
                  </div>
                  <span className="font-semibold text-sm truncate">{creator.name}</span>
                  <MoreHorizontal size={16} className="text-olu-muted ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Creators for you */}
          <div className="mb-6">
            <div className="px-4 mb-3">
              <p className="text-olu-muted text-xs mb-0.5">Based on your memberships</p>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Creators for you</h2>
                <button className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                  <ChevronRight size={16} className="text-olu-muted" />
                </button>
              </div>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
              {filtered.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>

          {/* Popular this week */}
          <div>
            <div className="flex items-center justify-between px-4 mb-1">
              <h2 className="font-bold text-lg">Popular this week</h2>
              <button className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <ChevronRight size={16} className="text-olu-muted" />
              </button>
            </div>
            <div className="px-4 divide-y divide-[#1c1c1c]">
              {popular.map(creator => (
                <CreatorRow key={creator.id} creator={creator} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          {POSTS.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
