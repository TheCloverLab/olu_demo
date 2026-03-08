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
  Menu,
  X,
  ChevronRight,
  PanelsTopLeft,
  Wallet,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { APP_VERSION } from '../../../lib/version'

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
  const { currentUser, availableRoles } = useApp()

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

            <button onClick={() => go('/business/account')} className="mx-4 mt-4 mb-2 flex items-center gap-3 p-3 bg-[#111827] rounded-2xl border border-cyan-500/20">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-cyan-200/70 text-xs">Workspace operator</p>
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

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function BusinessLayout() {
  const { currentUser, availableRoles, enabledBusinessModules } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const activeModuleLabel = BUSINESS_NAV.find(({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)
  )?.label

  return (
    <div className="business-shell flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 border-r border-cyan-500/10 bg-[#07111f] flex-shrink-0">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-300 text-[#04111f] flex items-center justify-center shadow-[0_0_24px_rgba(103,232,249,0.25)]">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="font-black text-lg leading-none">OLU Business</p>
            <p className="text-cyan-100/60 text-xs mt-1">Merchant operations cockpit</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <button onClick={() => navigate('/business/account')} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-[#0d1a2d] transition-colors text-left border border-cyan-500/10 bg-[#0a1525]">
            <Avatar user={currentUser} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-cyan-100/60 text-xs truncate">{enabledBusinessModules.length} capabilities enabled</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {BUSINESS_NAV.map(({ to, icon: Icon, label, exact }) => {
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-sm font-medium cursor-pointer',
                  isActive ? 'bg-cyan-300 text-[#04111f]' : 'text-cyan-50/72 hover:text-white hover:bg-[#0d1a2d]'
                )}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-cyan-500/10 space-y-2">
          <button
            onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#0d1a2d] hover:bg-[#12213a] text-cyan-50/72 text-sm font-medium transition-colors"
          >
            Open Consumer App
          </button>
          <div className="px-3 py-2 rounded-2xl border border-cyan-500/10 bg-[#0a1525] text-[11px] text-cyan-100/55 text-center tracking-[0.16em] uppercase">
            {APP_VERSION}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-cyan-500/10 bg-[#08111d]/95 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-1.5">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="md:hidden font-black text-lg">{activeModuleLabel || 'Business'}</p>
              <p className="hidden md:block text-cyan-100/45 text-xs tracking-[0.16em] uppercase">
                Workspace / {activeModuleLabel || 'Business'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/business/settings')}
              className="hidden md:inline-flex px-3 py-2 rounded-xl bg-[#0d1a2d] text-sm text-cyan-50/72 hover:text-white transition-colors"
            >
              Settings
            </button>
            <button onClick={() => navigate('/business/account')}>
              <Avatar user={currentUser} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>
      </main>

      <BusinessMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
