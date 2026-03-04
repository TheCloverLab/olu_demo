import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Settings, Share2, LayoutDashboard } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { POSTS, formatNumber } from '../data/mock'
import { motion } from 'framer-motion'

export default function Profile() {
  const { currentUser, currentRole, setShowRoleSwitcher } = useApp()
  const navigate = useNavigate()
  const myPosts = POSTS.filter(p => p.creatorId === currentUser.id)

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-6">
      {/* Cover */}
      <div className={`h-36 bg-gradient-to-br ${currentUser.avatarColor} relative mx-4 mt-4 rounded-2xl overflow-hidden opacity-60`}>
        <div className="absolute inset-0 bg-gradient-to-t from-olu-bg/80 to-transparent" />
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between mb-4">
          <div className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center font-black text-2xl text-white border-4 border-olu-bg`}>
            {currentUser.initials}
          </div>
          <div className="flex gap-2 mb-1">
            <button className="p-2 rounded-xl glass glass-hover"><Share2 size={16} className="text-olu-muted" /></button>
            <button className="p-2 rounded-xl glass glass-hover"><Settings size={16} className="text-olu-muted" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-black text-xl">{currentUser.name}</h1>
          {currentUser.verified && <BadgeCheck size={18} className="text-violet-400" fill="currentColor" />}
        </div>
        <p className="text-olu-muted text-sm mb-2">{currentUser.handle}</p>
        <p className="text-sm text-olu-muted mb-4 leading-relaxed">{currentUser.bio}</p>

        <div className="flex gap-6 mb-5">
          {[
            { val: formatNumber(currentUser.followers), label: 'Followers' },
            { val: formatNumber(currentUser.following), label: 'Following' },
            { val: formatNumber(currentUser.posts), label: 'Posts' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-bold text-base">{s.val}</p>
              <p className="text-olu-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Role badge */}
        <button onClick={() => setShowRoleSwitcher(true)}
          className="mb-5 flex items-center gap-2 px-4 py-2 glass rounded-full border border-violet-500/30 text-sm font-medium text-violet-300 hover:border-violet-500/60 transition-all">
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
            {currentUser.initials[0]}
          </div>
          <span className="capitalize">{currentRole}</span>
          <span className="text-olu-muted text-xs ml-1">· Switch Role</span>
        </button>

        {/* Console shortcut */}
        {currentRole === 'creator' && (
          <button onClick={() => navigate('/console/creator')} className="w-full mb-5 flex items-center gap-3 p-3 glass glass-hover rounded-xl border border-violet-500/20">
            <div className="w-9 h-9 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Creator Console</p>
              <p className="text-olu-muted text-xs">View analytics, fans, IP & shop</p>
            </div>
          </button>
        )}

        {/* Posts grid */}
        <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Posts</p>
        {myPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {myPosts.map(post => (
              <motion.button key={post.id} whileHover={{ scale: 1.02 }} onClick={() => navigate(`/content/${post.id}`)}
                className={`aspect-square rounded-xl bg-gradient-to-br ${post.gradientBg} flex items-center justify-center text-3xl relative overflow-hidden`}>
                <div className="opacity-30">{post.emoji}</div>
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
