import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Settings, Share2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getPostsByCreator } from '../../../services/api'
import { motion } from 'framer-motion'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myPosts, setMyPosts] = useState<any[]>([])

  useEffect(() => {
    async function loadPosts() {
      if (!user?.id) return
      try {
        const data = await getPostsByCreator(user.id)
        setMyPosts(data)
      } catch (err) {
        console.error('Failed to load profile posts', err)
      }
    }

    loadPosts()
  }, [user?.id])

  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-olu-muted">Loading profile...</div>
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="h-36 bg-[#1a1a1a] relative mx-4 mt-4 rounded-2xl overflow-hidden">
        {user.cover_img && <img src={user.cover_img} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-olu-bg/80 to-transparent" />
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          {user.avatar_img ? (
            <img src={user.avatar_img} alt={user.name} className="w-[72px] h-[72px] rounded-2xl object-cover border-4 border-olu-bg" />
          ) : (
            <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${user.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg`}>
              {user.initials || 'U'}
            </div>
          )}
          <div className="flex gap-2 mb-1">
            <button className="p-2 rounded-xl glass glass-hover"><Share2 size={16} className="text-olu-muted" /></button>
            <button className="p-2 rounded-xl glass glass-hover" onClick={() => navigate('/settings')}><Settings size={16} className="text-olu-muted" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-black text-xl">{user.name}</h1>
          {user.verified && <BadgeCheck size={18} className="text-sky-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-sm mb-2">{user.handle}</p>
        <p className="text-sm text-olu-muted mb-4 leading-relaxed">{user.bio || 'No bio yet.'}</p>

        <div className="flex gap-6 mb-5">
          {[
            { val: formatNumber(user.followers), label: 'Followers' },
            { val: formatNumber(user.following), label: 'Following' },
            { val: formatNumber(user.posts), label: 'Posts' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-bold text-base">{s.val}</p>
              <p className="text-olu-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Posts</p>
        {myPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {myPosts.map((post) => (
              <motion.button
                key={post.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/content/${post.id}`)}
                className="aspect-square rounded-xl overflow-hidden bg-[#1c1c1c] relative"
              >
                {post.cover_img ? <img src={post.cover_img} alt={post.title} className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${post.gradient_bg || 'from-gray-700 to-gray-900'}`} />}
                {post.locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-xs font-semibold">Locked</span></div>}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-olu-muted text-sm">No posts yet</div>
        )}
      </div>

    </div>
  )
}
