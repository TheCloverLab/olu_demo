import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MessageCircle, Users, User, Settings, ChevronRight, LayoutDashboard, Bot, Menu, X, Megaphone, Package, Zap } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import RoleSwitcher from './RoleSwitcher'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/profile', icon: User, label: 'Me' },
]

function Avatar({ user, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={clsx(`bg-gradient-to-br ${user.avatarColor} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`, sz)}>
      {user.initials}
    </div>
  )
}

function MoreMenu({ open, onClose }) {
  const { currentRole, currentUser } = useApp()
  const navigate = useNavigate()

  const go = (path) => { onClose(); navigate(path) }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-olu-surface border-r border-olu-border z-50 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-lg gradient-text">OLU</span>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} className="text-olu-muted" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 glass rounded-xl mb-6">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                <p className="text-olu-muted text-xs truncate">{currentUser.handle}</p>
              </div>
            </div>

            <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Tools</p>
            <div className="space-y-1 mb-6">
              <button onClick={() => go('/ai-config')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/05 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Agents</p>
                  <p className="text-olu-muted text-xs">Manage your team</p>
                </div>
                <ChevronRight size={14} className="text-olu-muted ml-auto" />
              </button>
            </div>

            <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider mb-3">Consoles</p>
            <div className="space-y-1">
              {(currentRole === 'creator') && (
                <button onClick={() => go('/console/creator')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/05 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                    <LayoutDashboard size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Creator Console</p>
                    <p className="text-olu-muted text-xs">Dashboard & analytics</p>
                  </div>
                  <ChevronRight size={14} className="text-olu-muted ml-auto" />
                </button>
              )}
              {(currentRole === 'advertiser') && (
                <button onClick={() => go('/console/advertiser')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/05 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <Megaphone size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Advertiser Console</p>
                    <p className="text-olu-muted text-xs">Campaigns & analytics</p>
                  </div>
                  <ChevronRight size={14} className="text-olu-muted ml-auto" />
                </button>
              )}
              {(currentRole === 'supplier') && (
                <button onClick={() => go('/console/supplier')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/05 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                    <Package size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Supplier Console</p>
                    <p className="text-olu-muted text-xs">Partnerships & sales</p>
                  </div>
                  <ChevronRight size={14} className="text-olu-muted ml-auto" />
                </button>
              )}
              {currentRole === 'fan' && (
                <div className="p-3 glass rounded-xl text-center">
                  <p className="text-olu-muted text-xs">No consoles available for your role.</p>
                  <p className="text-olu-muted text-xs mt-1">Switch to Creator, Advertiser, or Supplier.</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-olu-border">
              <button onClick={() => go('/ai-config')} className="w-full flex items-center gap-2 text-olu-muted text-sm hover:text-olu-text transition-colors">
                <Settings size={14} />
                Settings & Preferences
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const { currentUser, setShowRoleSwitcher } = useApp()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const isConsole = location.pathname.startsWith('/console/')

  return (
    <div className="flex h-screen overflow-hidden bg-olu-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-olu-border bg-olu-surface flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-olu-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="font-black text-lg tracking-tight gradient-text">OLU</span>
          </div>
          {isConsole && (
            <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">Console</span>
          )}
        </div>

        {/* User */}
        <div className="p-4 border-b border-olu-border">
          <button onClick={() => setShowRoleSwitcher(true)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/05 transition-all group">
            <Avatar user={currentUser} size="md" />
            <div className="min-w-0 text-left">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-olu-muted text-xs capitalize">{currentUser.role}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-xs text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded font-medium">Switch</div>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-olu-muted hover:text-olu-text hover:bg-white/05'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-olu-border mt-3">
            <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider px-3 mb-2">Tools</p>
            <NavLink
              to="/ai-config"
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                isActive ? 'bg-violet-600/20 text-violet-400' : 'text-olu-muted hover:text-olu-text hover:bg-white/05'
              )}
            >
              <Bot size={18} />
              AI Agents
            </NavLink>
          </div>

          <div className="pt-3 border-t border-olu-border mt-3">
            <p className="text-olu-muted text-xs font-semibold uppercase tracking-wider px-3 mb-2">Console</p>
            {currentUser.role === 'creator' && (
              <NavLink to="/console/creator" className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium', isActive ? 'bg-violet-600/20 text-violet-400' : 'text-olu-muted hover:text-olu-text hover:bg-white/05')}>
                <LayoutDashboard size={18} />Creator Console
              </NavLink>
            )}
            {currentUser.role === 'advertiser' && (
              <NavLink to="/console/advertiser" className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium', isActive ? 'bg-blue-500/20 text-blue-400' : 'text-olu-muted hover:text-olu-text hover:bg-white/05')}>
                <Megaphone size={18} />Advertiser Console
              </NavLink>
            )}
            {currentUser.role === 'supplier' && (
              <NavLink to="/console/supplier" className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium', isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-olu-muted hover:text-olu-text hover:bg-white/05')}>
                <Package size={18} />Supplier Console
              </NavLink>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-olu-border">
          <button
            onClick={() => setShowRoleSwitcher(true)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-600/30 text-violet-300 text-sm font-medium hover:from-violet-600/30 hover:to-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Users size={14} />
            Switch Role (Demo)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-olu-border bg-olu-surface flex-shrink-0">
          <button onClick={() => setMoreOpen(true)} className="p-2 rounded-xl hover:bg-white/08 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap size={12} className="text-white" fill="white" />
            </div>
            <span className="font-black text-base tracking-tight gradient-text">OLU</span>
          </div>
          <button onClick={() => setShowRoleSwitcher(true)}>
            <Avatar user={currentUser} />
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center border-t border-olu-border bg-olu-surface flex-shrink-0 pb-safe">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors no-tap-highlight',
                isActive ? 'text-violet-400' : 'text-olu-muted'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </main>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
      <RoleSwitcher />
    </div>
  )
}
