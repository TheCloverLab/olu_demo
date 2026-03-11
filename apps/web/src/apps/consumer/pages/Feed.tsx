import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Image, Send, Pin, Bookmark, MoreHorizontal, X, Rss } from 'lucide-react'
import clsx from 'clsx'

const MOCK_POSTS = [
  {
    id: 'post-1',
    author: { name: 'Luna Chen', initials: 'LC', color: 'from-rose-500 to-fuchsia-600', verified: true },
    title: 'Neon City Collection — Preview Drop',
    text: 'Just wrapped the first 8 pieces of the Neon City collection. Each piece explores cyberpunk architecture through digital brushwork. VIP members get early access this Friday.',
    images: 2,
    gradient: 'from-rose-600 via-fuchsia-600 to-orange-500',
    likes: 342,
    comments: 47,
    shares: 18,
    pinned: true,
    time: '2h ago',
    tags: ['art', 'neon', 'drop'],
  },
  {
    id: 'post-2',
    author: { name: 'Luna Chen', initials: 'LC', color: 'from-rose-500 to-fuchsia-600', verified: true },
    title: 'Studio Session — Behind the Scenes',
    text: 'Spent 6 hours on a single gradient today. Sometimes the simplest things take the longest. Sharing my process for those curious about the workflow.',
    images: 0,
    gradient: 'from-violet-600 via-purple-600 to-indigo-500',
    likes: 189,
    comments: 23,
    shares: 5,
    pinned: false,
    time: '5h ago',
    tags: ['process', 'studio'],
  },
  {
    id: 'post-3',
    author: { name: 'Luna Chen', initials: 'LC', color: 'from-rose-500 to-fuchsia-600', verified: true },
    title: 'Fan Art Spotlight — March Edition',
    text: 'Highlighting the best fan submissions this month. @AlexPark your reinterpretation of the rooftop series was incredible. Full gallery in the thread.',
    images: 4,
    gradient: 'from-cyan-600 via-teal-500 to-emerald-400',
    likes: 521,
    comments: 89,
    shares: 34,
    pinned: false,
    time: '1d ago',
    tags: ['fan-art', 'spotlight'],
  },
  {
    id: 'post-4',
    author: { name: 'Luna Chen', initials: 'LC', color: 'from-rose-500 to-fuchsia-600', verified: true },
    title: 'Weekly Critique Thread #42',
    text: 'Drop your WIPs below and I\'ll give feedback on composition and color. Members get priority — I\'ll reply to all VIP submissions by end of day.',
    images: 0,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    likes: 156,
    comments: 112,
    shares: 8,
    pinned: false,
    time: '2d ago',
    tags: ['critique', 'feedback'],
  },
  {
    id: 'post-5',
    author: { name: 'Luna Chen', initials: 'LC', color: 'from-rose-500 to-fuchsia-600', verified: true },
    title: 'New Brush Pack — Free for Members',
    text: 'Released a 12-brush pack for Procreate and Photoshop. Includes the neon glow brushes from the city series. Download link in the members area.',
    images: 1,
    gradient: 'from-blue-600 via-sky-500 to-cyan-400',
    likes: 678,
    comments: 54,
    shares: 92,
    pinned: false,
    time: '3d ago',
    tags: ['resources', 'free'],
  },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function PostComposer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [imageCount, setImageCount] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl border border-olu-border bg-olu-surface p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{t('consumer.newPost')}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--olu-card-hover)]">
          <X size={16} className="text-olu-muted" />
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('consumer.writePost')}
        className="w-full bg-transparent border-none resize-none text-sm placeholder:text-olu-muted focus:outline-none min-h-[100px] leading-relaxed"
        autoFocus
      />
      {imageCount > 0 && (
        <div className="flex gap-2 mb-3">
          {Array.from({ length: imageCount }, (_, i) => (
            <div
              key={i}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center relative"
            >
              <Image size={16} className="text-white/30" />
              <button
                onClick={() => setImageCount((c) => c - 1)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-olu-border">
        <button
          onClick={() => setImageCount((c) => Math.min(c + 1, 4))}
          className="flex items-center gap-1.5 text-xs text-olu-muted hover:text-olu-text transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--olu-card-hover)]"
        >
          <Image size={14} />
          {t('consumer.addImages')}
        </button>
        <button
          disabled={!text.trim()}
          className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Send size={12} className="inline mr-1.5" />
          {t('consumer.newPost')}
        </button>
      </div>
    </motion.div>
  )
}

export default function Feed() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [showComposer, setShowComposer] = useState(false)

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  function toggleSave(postId: string) {
    setSavedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-orange-500/15 text-orange-300 flex items-center justify-center">
          <Rss size={18} />
        </div>
        <div className="flex-1">
          <h1 className="font-black text-2xl">{t('consumer.feed')}</h1>
          <p className="text-olu-muted text-sm">{t('consumer.feedSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('consumer.newPost')}
        </button>
      </div>

      <AnimatePresence>
        {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
      </AnimatePresence>

      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <motion.div
            key={post.id}
            whileHover={{ y: -1 }}
            className="rounded-2xl border border-olu-border bg-olu-surface overflow-hidden"
          >
            {post.pinned && (
              <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-amber-400">
                <Pin size={11} />
                {t('consumer.pinnedPost')}
              </div>
            )}

            <div className="p-4">
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${post.author.color} flex items-center justify-center font-bold text-white text-xs`}>
                  {post.author.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm">{post.author.name}</span>
                    {post.author.verified && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-sky-400">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-olu-muted text-xs">{post.time}</span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-[var(--olu-card-hover)]">
                  <MoreHorizontal size={16} className="text-olu-muted" />
                </button>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-sm mb-2">{post.title}</h3>
              <p className="text-olu-muted text-sm leading-relaxed mb-3">{post.text}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-[var(--olu-card-bg)] text-olu-muted px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Images */}
            {post.images > 0 && (
              <div className={clsx(
                'px-4 pb-3',
                post.images === 1 ? '' : 'grid grid-cols-2 gap-2',
              )}>
                {Array.from({ length: Math.min(post.images, 4) }, (_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden',
                      post.gradient,
                      post.images === 1 ? 'h-48' : 'h-32',
                    )}
                  >
                    <Image size={20} className="text-white/20" />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center border-t border-olu-border">
              <button
                onClick={() => toggleLike(post.id)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all',
                  likedPosts.has(post.id) ? 'text-pink-400' : 'text-olu-muted hover:text-pink-400',
                )}
              >
                <Heart size={14} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                {formatNumber(post.likes + (likedPosts.has(post.id) ? 1 : 0))}
              </button>
              <button
                onClick={() => navigate(`/content/${post.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium text-olu-muted hover:text-olu-text transition-all"
              >
                <MessageCircle size={14} />
                {formatNumber(post.comments)}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium text-olu-muted hover:text-olu-text transition-all">
                <Share2 size={14} />
                {formatNumber(post.shares)}
              </button>
              <button
                onClick={() => toggleSave(post.id)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all',
                  savedPosts.has(post.id) ? 'text-amber-400' : 'text-olu-muted hover:text-amber-400',
                )}
              >
                <Bookmark size={14} fill={savedPosts.has(post.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
