import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  Bot,
  Users,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  User,
  Menu,
  X,
  ChevronRight,
  PanelsTopLeft,
  Wallet,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import RoleSwitcher from './RoleSwitcher'

const BUSINESS_NAV = [
  { to: '/business', icon: PanelsTopLeft, label: 'Overview', exact: true },
  { to: '/business/team', icon: Users, label: 'Team' },
  { to: '/business/agents', icon: Bot, label: 'Agents' },
  { to: '/business/modules/creator', icon: LayoutDashboard, label: 'Creator Ops' },
  { to: '/business/modules/marketing', icon: Megaphone, label: 'Marketing' },
  { to: '/business/modules/supply', icon: Package, label: 'Supply Chain' },
] as const

function Avatar({ user, size = 'sm' }: { user: any; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const avatarSrc = user.avatar_img || user.avatarImg
  const avatarColor = user.avatar_color || user.avatarColor || 'from-gray-600 to-gray-500'
  const initials = user.initials || 'U'

  if (avatarSrc) {
    return <img src={avatarSrc} alt={user.name} className={clsx('rounded-xl object-cover flex-shrink-0', sz)} />
  }

  return (
    <div className={clsx(`bg-gradient-to-br ${avatarColor} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`, sz)}>
      {initials}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#1c1c1c] transition-colors text-left rounded-xl"
    >
      <Icon size={20} className="text-olu-muted" />
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-olu-muted ml-auto" />
    </button>
  )
}

function BusinessMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { currentUser, availableRoles, setShowRoleSwitcher } = useApp()

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-olu-surface z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-olu-border">
              <span className="font-black text-xl tracking-tight">OLU Business</span>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2a2a2a] transition-colors">
                <X size={18} className="text-olu-muted" />
              </button>
            </div>

            <button onClick={() => go('/business/profile')} className="mx-4 mt-4 mb-2 flex items-center gap-3 p-3 bg-[#1c1c1c] rounded-2xl">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-olu-muted text-xs">Business workspace</p>
              </div>
            </button>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              <MenuItem icon={PanelsTopLeft} label="Workspace Overview" onClick={() => go('/business')} />
              <MenuItem icon={Users} label="Team" onClick={() => go('/business/team')} />
              <MenuItem icon={Bot} label="AI Agents" onClick={() => go('/business/agents')} />
              <MenuItem icon={LayoutDashboard} label="Creator Ops" onClick={() => go('/business/modules/creator')} />
              <MenuItem icon={Megaphone} label="Marketing" onClick={() => go('/business/modules/marketing')} />
              <MenuItem icon={Package} label="Supply Chain" onClick={() => go('/business/modules/supply')} />
              {availableRoles.includes('creator') && <MenuItem icon={Wallet} label="Wallet" onClick={() => go('/business/wallet')} />}
              <MenuItem icon={Settings} label="Settings" onClick={() => go('/business/settings')} />
            </div>

            {availableRoles.length > 1 && (
              <div className="p-4 border-t border-olu-border">
                <button
                  onClick={() => {
                    onClose()
                    setShowRoleSwitcher(true)
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#1c1c1c] hover:bg-[#242424] text-olu-muted text-sm font-medium transition-colors"
                >
                  Switch Capability
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function BusinessLayout() {
  const { currentUser, availableRoles, setShowRoleSwitcher } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const activeModuleLabel = BUSINESS_NAV.find(({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)
  )?.label

  return (
    <div className="flex h-screen overflow-hidden bg-olu-bg">
      <aside className="hidden md:flex flex-col w-64 border-r border-olu-border bg-olu-surface flex-shrink-0">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="font-black text-lg leading-none">OLU Business</p>
            <p className="text-olu-muted text-xs mt-1">Modular merchant workspace</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <button onClick={() => navigate('/business/profile')} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#1c1c1c] transition-colors text-left">
            <Avatar user={currentUser} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-olu-muted text-xs truncate">{availableRoles.length} capabilities enabled</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {BUSINESS_NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-sm font-medium cursor-pointer',
                isActive ? 'bg-[#2a2a2a] text-white' : 'text-olu-muted hover:text-white hover:bg-[#1c1c1c]'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-olu-border space-y-2">
          {availableRoles.length > 1 && (
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#1c1c1c] hover:bg-[#242424] text-olu-muted text-sm font-medium transition-colors"
            >
              Switch Capability
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#1c1c1c] hover:bg-[#242424] text-olu-muted text-sm font-medium transition-colors"
          >
            Open Consumer App
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-olu-border bg-olu-bg flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-1.5">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-black text-lg md:text-xl">{activeModuleLabel || 'Business'}</h1>
              <p className="text-olu-muted text-xs md:text-sm">Enterprise workspace and agent operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/business/settings')}
              className="hidden md:inline-flex px-3 py-2 rounded-xl bg-[#1c1c1c] text-sm text-olu-muted hover:text-white transition-colors"
            >
              Settings
            </button>
            <button onClick={() => navigate('/business/profile')}>
              <Avatar user={currentUser} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>
      </main>

      <BusinessMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <RoleSwitcher />
    </div>
  )
}
