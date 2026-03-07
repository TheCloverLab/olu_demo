import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MessageCircle, User, Settings, ChevronRight, Menu, X, Zap, ShoppingBag, LogIn, Briefcase } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import RoleSwitcher from './RoleSwitcher'
import clsx from 'clsx'

// Consumer app navigation
const MOBILE_NAV = [
  { to: '/', icon: Home, exact: true },
  { to: '/chat', icon: MessageCircle },
  { to: '/shop', icon: ShoppingBag },
  { to: '/profile', icon: User },
]

const SIDEBAR_NAV = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/profile', icon: User, label: 'Me' },
]

function Avatar({ user, size = 'sm' }) {
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

function MenuItem({ icon: Icon, label, onClick }) {
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

function MoreMenu({ open, onClose }) {
  const { currentUser } = useApp()
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const go = (path) => { onClose(); navigate(path) }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-olu-surface z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-olu-border">
              <span className="font-black text-xl tracking-tight">OLU</span>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2a2a2a] transition-colors">
                <X size={18} className="text-olu-muted" />
              </button>
            </div>

            {authUser ? (
              <button onClick={() => go('/profile')} className="mx-4 mt-4 mb-2 flex items-center gap-3 p-3 bg-[#1c1c1c] rounded-2xl">
                <Avatar user={currentUser} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{currentUser.name}</p>
                  <p className="text-olu-muted text-xs capitalize">{currentUser.role}</p>
                </div>
              </button>
            ) : (
              <div className="mx-4 mt-4 mb-2 space-y-2">
                <button onClick={() => go('/login')} className="w-full bg-white text-black rounded-xl px-4 py-2.5 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <LogIn size={16} />
                  Sign in
                </button>
                <button onClick={() => go('/signup')} className="w-full bg-[#1c1c1c] text-white rounded-xl px-4 py-2.5 font-semibold hover:bg-[#242424] transition-colors">
                  Sign up
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              <MenuItem icon={Briefcase} label="Business Workspace" onClick={() => go('/business')} />
              <MenuItem icon={Settings} label="Settings" onClick={() => go('/settings')} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const { currentUser } = useApp()
  const { user: authUser } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-olu-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-olu-border bg-olu-surface flex-shrink-0">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <Zap size={14} className="text-black" fill="black" />
          </div>
          <span className="font-black text-lg">OLU</span>
        </div>

        {authUser ? (
          <div className="px-3 pb-3">
            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[#1c1c1c] transition-colors group">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                <p className="text-olu-muted text-xs capitalize">{currentUser.role}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="px-3 pb-3 space-y-2">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-white text-black rounded-xl px-4 py-2.5 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Sign in
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="w-full bg-[#1c1c1c] text-white rounded-xl px-4 py-2.5 font-semibold hover:bg-[#242424] transition-colors text-sm"
            >
              Sign up
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_NAV.map(({ to, icon: Icon, label, exact }) => (
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

          <div className="pt-4">
            <p className="text-olu-muted text-[11px] font-semibold uppercase tracking-wider px-3 mb-1">Workspace</p>
            <NavLink to="/business" className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-sm font-medium cursor-pointer', isActive ? 'bg-[#2a2a2a] text-white' : 'text-olu-muted hover:text-white hover:bg-[#1c1c1c]')}>
              <Briefcase size={18} />Business Workspace
            </NavLink>
          </div>
        </nav>

        <div className="p-3 border-t border-olu-border space-y-2">
          <NavLink 
            to="/settings"
            className={({ isActive }) => clsx(
              'w-full py-2 px-3 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
              isActive ? 'bg-[#2a2a2a] text-white' : 'bg-[#1c1c1c] hover:bg-[#242424] text-olu-muted'
            )}
          >
            <Settings size={14} />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-olu-bg flex-shrink-0">
          <button onClick={() => setMoreOpen(true)} className="p-1.5">
            <Menu size={22} />
          </button>
          <span className="font-black text-lg">OLU</span>
          <button onClick={() => navigate('/profile')}>
            <Avatar user={currentUser} />
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav — icon-only like Patreon */}
        <nav className="md:hidden flex items-center bg-olu-bg border-t border-olu-border flex-shrink-0">
          {MOBILE_NAV.map(({ to, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex-1 flex items-center justify-center py-3.5 no-tap-highlight transition-colors',
                isActive ? 'text-white' : 'text-[#555555]'
              )}
            >
              {({ isActive }) => (
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
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
