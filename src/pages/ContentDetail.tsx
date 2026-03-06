import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Share2, Gift, Lock, Repeat2, BadgeCheck, Check, X, Send } from 'lucide-react'
import { getPostById } from '../services/api'
import clsx from 'clsx'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

const MOCK_COMMENTS = [
  { id: 1, user: 'Alex Park', initials: 'AP', color: 'from-pink-500 to-rose-600', text: 'This is absolutely stunning! The color palette is incredible 🎨', time: '1h ago', likes: 24 },
  { id: 2, user: 'Jordan Lee', initials: 'JL', color: 'from-blue-500 to-indigo-600', text: 'Neon City vibes are immaculate. Can\'t wait for the full collection!', time: '2h ago', likes: 18 },
  { id: 3, user: 'Yuki Draws', initials: 'YD', color: 'from-pink-400 to-rose-600', text: 'Fellow creator here — the technique on these pixel gradients is chef\'s kiss 🤌', time: '3h ago', likes: 45 },
  { id: 4, user: 'Taylor Kim', initials: 'TK', color: 'from-violet-500 to-purple-600', text: 'VIP member here. Already downloaded the pack. Worth every penny!!', time: '4h ago', likes: 31 },
]

const TIP_AMOUNTS = [1, 2, 5, 10, 20]

function TipModal({ post, onClose }) {
  const [amount, setAmount] = useState(5)
  const [custom, setCustom] = useState('')
  const [done, setDone] = useState(false)

  if (done) return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-olu-surface rounded-2xl p-8 text-center max-w-sm w-full border border-olu-border">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="font-bold text-xl mb-2">Tip Sent!</h3>
          <p className="text-olu-muted text-sm mb-1">You tipped <span className="text-amber-400 font-bold">${amount}</span> to {post.creator?.name || 'Creator'}</p>
          <p className="text-olu-muted text-xs mt-2">Transaction processed instantly via OLU Pay</p>
          <button onClick={onClose} className="mt-6 px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm">Done</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm bg-olu-surface border border-olu-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-olu-border flex items-center justify-between">
            <div>
              <h3 className="font-bold">Send a Tip 🎁</h3>
               <p className="text-olu-muted text-xs mt-0.5">Support {post.creator?.name || 'Creator'} directly</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/08"><X size={18} className="text-olu-muted" /></button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {TIP_AMOUNTS.map((a) => (
                <button key={a} onClick={() => { setAmount(a); setCustom('') }}
                  className={clsx('py-2 rounded-xl text-sm font-bold transition-all', amount === a && !custom ? 'bg-amber-500 text-white' : 'glass hover:bg-amber-500/10 text-olu-muted hover:text-amber-400')}>
                  ${a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={custom}
              onChange={e => { setCustom(e.target.value); setAmount(parseFloat(e.target.value) || 0) }}
              placeholder="Custom amount..."
              className="w-full p-3 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none focus:border-amber-500/60 border border-transparent transition-colors mb-4"
            />
            <button onClick={() => setDone(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity">
              Send ${custom || amount} Tip
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function FanCreateModal({ post, onClose }) {
  const [step, setStep] = useState(1)

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-olu-surface border border-olu-border rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-olu-border flex items-center justify-between">
            <div>
              <h3 className="font-bold">Create Fan Work</h3>
              <p className="text-xs text-olu-muted mt-0.5">Powered by OLU IP Platform</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/08"><X size={18} className="text-olu-muted" /></button>
          </div>

          {step === 1 && (
            <div className="p-5">
              <div className="flex items-center gap-3 p-4 glass rounded-xl border border-white/10 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-xl">⚖️</div>
                <div>
                  <p className="font-semibold text-sm">Lisa — IP Manager</p>
                  <p className="text-xs text-olu-muted">Reviewing license request...</p>
                </div>
              </div>
              <div className="bg-olu-card rounded-xl p-4 mb-4">
                <p className="text-xs text-olu-muted mb-3">Lisa says:</p>
                <p className="text-sm">"Hi! You want to create derivative fan content based on Luna's <strong>"{post.title}"</strong>.</p>
                <p className="text-sm mt-2">Terms: 70% of your revenue, 30% to Luna. Automatic royalty distribution via OLU Pay. Attribution required."</p>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Your share', value: '70%' },
                  { label: 'Creator royalty', value: '30%' },
                  { label: 'License type', value: 'Monetizable Fan Creation' },
                  { label: 'Distribution', value: 'Automatic via OLU Pay' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-olu-muted">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-olu-border text-sm font-medium text-olu-muted">Decline</button>
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold">Accept & Create</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-5">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                <Check size={16} className="text-emerald-400" />
                <p className="text-sm text-emerald-300 font-medium">License granted by Lisa ✅</p>
              </div>
              <p className="text-sm text-olu-muted mb-4">Your fan creation license is active. Create and publish your work below.</p>
              <div className="space-y-3">
                <select className="w-full p-3 glass rounded-xl text-sm bg-transparent border border-olu-border focus:outline-none">
                  <option>Select content type</option>
                  <option>Fan Art (Image)</option>
                  <option>Fan Music (Audio)</option>
                  <option>Fan Short Story</option>
                  <option>Fan Video / Short Drama</option>
                </select>
                <textarea placeholder="Describe your fan creation..." className="w-full p-3 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-olu-border resize-none h-24 bg-transparent" />
                <div className="flex items-center justify-between p-3 glass rounded-xl">
                  <span className="text-sm">Set as paid content</span>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="$0.00" className="w-20 p-1.5 bg-olu-card rounded-lg text-sm text-right focus:outline-none" />
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:opacity-90 transition-opacity">
                Publish Fan Creation
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any | null>(null)
  const [loadingPost, setLoadingPost] = useState(true)

  const [liked, setLiked] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [showFanCreate, setShowFanCreate] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(MOCK_COMMENTS)

  useEffect(() => {
    async function loadPost() {
      if (!id) {
        setLoadingPost(false)
        return
      }

      try {
        const data = await getPostById(id)
        setPost(data)
      } catch (err) {
        console.error('Failed loading content detail', err)
      } finally {
        setLoadingPost(false)
      }
    }

    loadPost()
  }, [id])

  if (loadingPost) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Loading content...</div>
  }

  if (!post) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Content not found.</div>
  }

  const submitComment = () => {
    if (!comment.trim()) return
    setComments([{ id: Date.now(), user: 'You', initials: 'YU', color: 'from-violet-500 to-purple-600', text: comment, time: 'Just now', likes: 0 }, ...comments])
    setComment('')
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4 mb-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Content */}
      <div className={`mx-4 rounded-2xl h-72 bg-gradient-to-br ${post.gradient_bg || 'from-gray-700 to-gray-900'} flex items-center justify-center relative overflow-hidden mb-4`}>
        {post.cover_img && <img src={post.cover_img} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/20" />
        <div className="text-9xl opacity-10 relative">{post.emoji}</div>
        {post.locked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Lock size={32} className="text-white" />
            <p className="text-white font-semibold">Premium Content</p>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                Unlock for ${post.lock_price}
              </button>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full capitalize">{post.type}</span>
        </div>
        {post.sponsored && (
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-amber-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full font-medium">Sponsored · {post.sponsored_by}</span>
          </div>
        )}
      </div>

      <div className="px-4">
        {/* Creator row */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(`/creator/${post.creator_id}`)}>
            {post.creator?.avatar_img ? (
              <img src={post.creator.avatar_img} alt={post.creator?.name || 'Creator'} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${post.creator?.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-bold text-white text-xs`}>
                {post.creator?.initials || '?'}
              </div>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate(`/creator/${post.creator_id}`)} className="font-semibold text-sm hover:text-olu-muted transition-colors">{post.creator?.name || 'Creator'}</button>
              {post.creator?.verified && <BadgeCheck size={14} className="text-sky-400" fill="currentColor" />}
            </div>
            <p className="text-olu-muted text-xs">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}</p>
          </div>
        </div>

        <h1 className="font-bold text-xl mb-2">{post.title}</h1>
        <p className="text-olu-muted text-sm leading-relaxed mb-4">{post.preview}</p>

        {/* Tags */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {post.tags?.map(t => (
            <span key={t} className="text-xs bg-white/06 text-olu-muted px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-6 p-3 glass rounded-2xl">
          <button onClick={() => setLiked(!liked)} className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center', liked ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/08 text-olu-muted')}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            {formatNumber(post.likes + (liked ? 1 : 0))}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/08 text-olu-muted transition-all flex-1 justify-center">
            <MessageCircle size={16} /> {formatNumber(post.comments)}
          </button>
          <button onClick={() => setShowTip(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-500/10 text-olu-muted hover:text-amber-400 transition-all flex-1 justify-center">
            <Gift size={16} /> Tip
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/08 text-olu-muted transition-all flex-1 justify-center">
            <Share2 size={16} /> Share
          </button>
        </div>

        {/* Fan Creation CTA */}
        {post.allow_fan_creation && (
          <motion.div whileHover={{ scale: 1.01 }} className="p-4 glass rounded-2xl border border-white/10 mb-6 cursor-pointer" onClick={() => setShowFanCreate(true)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Repeat2 size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Create Fan Work from this post</p>
                <p className="text-xs text-olu-muted">Get a {Math.round((post.fan_creation_fee || 0) * 100)}% revenue-share license · Handled by Lisa (IP Manager)</p>
              </div>
              <div className="text-sky-400 text-xs font-semibold">License IP →</div>
            </div>
          </motion.div>
        )}

        {/* Comments */}
        <div className="mb-6">
          <h3 className="font-bold mb-4">Comments</h3>
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">YU</div>
            <div className="flex-1 flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2.5 glass rounded-xl text-sm placeholder:text-olu-muted focus:outline-none border border-transparent focus:border-white/20 transition-colors"
              />
              <button
                onClick={submitComment}
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-white text-black hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>{c.initials}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs">{c.user}</span>
                    <span className="text-olu-muted text-xs">{c.time}</span>
                  </div>
                  <p className="text-sm text-olu-muted leading-relaxed">{c.text}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button className="flex items-center gap-1 text-xs text-olu-muted hover:text-pink-400 transition-colors">
                      <Heart size={11} /> {c.likes}
                    </button>
                    <button className="text-xs text-olu-muted hover:text-olu-text transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTip && <TipModal post={post} onClose={() => setShowTip(false)} />}
      {showFanCreate && <FanCreateModal post={post} onClose={() => setShowFanCreate(false)} />}
    </div>
  )
}
