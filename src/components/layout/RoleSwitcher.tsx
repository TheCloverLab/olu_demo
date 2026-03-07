import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap, Briefcase } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const ROLE_OPTIONS = [
  {
    key: 'creator',
    label: 'Creator Ops',
    name: 'Creator operator mode',
    accent: 'from-violet-500 to-indigo-600',
    icon: '🎨',
    description: 'Focus on approvals, community, IP, and creator-side revenue operations.',
  },
  {
    key: 'advertiser',
    label: 'Marketing',
    name: 'Advertiser operator mode',
    accent: 'from-blue-500 to-cyan-600',
    icon: '📣',
    description: 'Focus on campaign sourcing, creator approvals, spend, and reporting workflows.',
  },
  {
    key: 'supplier',
    label: 'Supply Chain',
    name: 'Supplier operator mode',
    accent: 'from-emerald-500 to-teal-600',
    icon: '🏭',
    description: 'Focus on product readiness, creator partnerships, and fulfillment coordination.',
  },
] as const

export default function RoleSwitcher() {
  const { showRoleSwitcher, setShowRoleSwitcher, currentRole, switchRole, availableRoles } = useApp()
  const userRoleOptions = ROLE_OPTIONS.filter((role) => availableRoles.includes(role.key as any))

  return (
    <AnimatePresence>
      {showRoleSwitcher && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 backdrop-blur-md"
            onClick={() => setShowRoleSwitcher(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="w-full max-w-3xl"
            >
              <div className="rounded-[32px] overflow-hidden border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(9,21,35,0.98),rgba(6,14,24,0.98))] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className="text-cyan-300" />
                      <span className="font-black text-cyan-200">Switch Capability</span>
                    </div>
                    <p className="text-cyan-100/60 text-sm">
                      Choose the operator context you want to use in this workspace.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRoleSwitcher(false)}
                    className="p-2 rounded-xl hover:bg-cyan-500/10 transition-colors"
                  >
                    <X size={18} className="text-cyan-100/60" />
                  </button>
                </div>

                <div className={clsx('p-5 grid gap-4', userRoleOptions.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2')}>
                  {userRoleOptions.map((role) => {
                    const isActive = currentRole === role.key
                    return (
                      <motion.button
                        key={role.key}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => switchRole(role.key as any)}
                        className={clsx(
                          'relative p-5 rounded-[28px] border text-left transition-all',
                          isActive
                            ? 'border-cyan-300/40 bg-[#0d1a2d]'
                            : 'border-cyan-500/10 bg-[#091523] hover:border-cyan-300/20 hover:bg-[#0d1a2d]'
                        )}
                      >
                        {isActive && (
                          <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-cyan-300 text-[#04111f] flex items-center justify-center">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <div className={clsx('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-[0_12px_30px_rgba(0,0,0,0.18)]', role.accent)}>
                            {role.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-xl">{role.label}</span>
                              {isActive && (
                                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-cyan-300/15 text-cyan-200">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-cyan-100/60 text-sm">{role.name}</p>
                            <p className="text-cyan-100/68 text-sm mt-3 leading-relaxed max-w-md">{role.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                <div className="px-6 pb-6 flex items-center justify-between text-xs text-cyan-100/50">
                  <span>{userRoleOptions.length} capabilities available in this account</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase size={12} />
                    Modules stay visible at workspace level
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
