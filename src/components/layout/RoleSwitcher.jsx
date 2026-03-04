import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const ROLE_OPTIONS = [
  {
    key: 'creator',
    label: 'Creator',
    name: 'Luna Chen',
    handle: '@lunachen',
    initials: 'LC',
    avatarColor: 'from-violet-500 to-purple-700',
    gradient: 'from-violet-600 to-indigo-700',
    description: 'Content creator & digital artist. Manage your community, IP, and revenue.',
    icon: '🎨',
  },
  {
    key: 'fan',
    label: 'Fan',
    name: 'Alex Park',
    handle: '@alexpark',
    initials: 'AP',
    avatarColor: 'from-pink-500 to-rose-600',
    gradient: 'from-pink-600 to-rose-700',
    description: 'Superfan of Luna Chen. Discover content, support creators, create fan works.',
    icon: '⭐',
  },
  {
    key: 'advertiser',
    label: 'Advertiser',
    name: 'GameVerse Studios',
    handle: '@gameverse',
    initials: 'GV',
    avatarColor: 'from-blue-500 to-cyan-600',
    gradient: 'from-blue-600 to-cyan-700',
    description: 'Indie game studio. Run AI-driven influencer marketing campaigns.',
    icon: '📣',
  },
  {
    key: 'supplier',
    label: 'Supplier',
    name: 'ArtisanCraft Co.',
    handle: '@artisancraft',
    initials: 'AC',
    avatarColor: 'from-emerald-500 to-teal-600',
    gradient: 'from-emerald-600 to-teal-700',
    description: 'Custom merch manufacturer. Connect with creators and supply branded products.',
    icon: '🏭',
  },
]

export default function RoleSwitcher() {
  const { showRoleSwitcher, setShowRoleSwitcher, currentRole, switchRole } = useApp()

  return (
    <AnimatePresence>
      {showRoleSwitcher && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-md"
            onClick={() => setShowRoleSwitcher(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
          >
            <div className="bg-olu-surface border border-olu-border rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="p-5 border-b border-olu-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Zap size={16} className="text-violet-400" fill="currentColor" />
                    <span className="font-bold gradient-text">OLU Demo</span>
                  </div>
                  <p className="text-olu-muted text-sm">Switch between user roles to explore the platform</p>
                </div>
                <button
                  onClick={() => setShowRoleSwitcher(false)}
                  className="p-2 rounded-xl hover:bg-white/08 transition-colors"
                >
                  <X size={18} className="text-olu-muted" />
                </button>
              </div>

              {/* Role Cards */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => {
                  const isActive = currentRole === role.key
                  return (
                    <motion.button
                      key={role.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => switchRole(role.key)}
                      className={clsx(
                        'relative p-4 rounded-xl border text-left transition-all',
                        isActive
                          ? 'border-violet-500/60 bg-[#7c3aed]/10'
                          : 'border-olu-border hover:border-white/20 hover:bg-white/03'
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </div>
                      )}

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.avatarColor} flex items-center justify-center mb-3 text-lg`}>
                        {role.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-sm">{role.label}</span>
                        </div>
                        <p className="text-olu-muted text-xs">{role.name}</p>
                        <p className="text-olu-muted text-xs mt-2 leading-relaxed line-clamp-2">{role.description}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="px-5 pb-5">
                <p className="text-center text-olu-muted text-xs">
                  This demo showcases OLU from the perspective of all 4 key user roles
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
