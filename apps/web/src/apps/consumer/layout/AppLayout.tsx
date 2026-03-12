import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ChevronRight, Menu, X, Zap, LogIn, Briefcase, Wallet, Sun, Moon, Monitor, Globe, Hash } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { getUserWallet, getJoinedWorkspaces } from '../../../domain/workspace/api'
import type { Workspace, WorkspaceJoin } from '../../../lib/supabase'
import clsx from 'clsx'
import { APP_VERSION } from '../../../lib/version'
import { CONSUMER_NAV, getTemplateKeyForAppType } from '../templateConfig'

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
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-olu-card transition-colors text-left rounded-xl"
    >
      <Icon size={20} className="text-olu-muted" />
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-olu-muted ml-auto" />
    </button>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
    { value: 'system' as const, icon: Monitor },
  ]

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-olu-border bg-olu-surface p-0.5">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={clsx(
            'p-1.5 rounded-md transition-colors',
            theme === value
              ? 'bg-olu-primary text-white'
              : 'text-olu-muted hover:text-olu-text'
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

function LanguageToggle() {
  const { i18n } = useTranslation()
  const isZh = i18n.language?.startsWith('zh')

  return (
    <button
      onClick={() => i18n.changeLanguage(isZh ? 'en' : 'zh')}
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-olu-border bg-olu-surface text-xs font-medium text-olu-muted hover:text-olu-text transition-colors"
    >
      <Globe size={14} />
      {isZh ? 'EN' : '中文'}
    </button>
  )
}

function MoreMenu({ open, onClose, showBusiness, walletBalance, joinedWorkspaces }: { open: boolean; onClose: () => void; showBusiness?: boolean; walletBalance: number | null; joinedWorkspaces: (WorkspaceJoin & { workspace: Workspace })[] }) {
  const { currentUser } = useApp()
  const { user: authUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const go = (path) => { onClose(); navigate(path) }
  const publicProfilePath = currentUser?.id ? `/people/${currentUser.id}` : '/profile'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--olu-overlay-bg)] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-olu-surface z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-olu-border">
              <span className="font-black text-xl tracking-tight">OLU</span>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-olu-card transition-colors">
                <X size={18} className="text-olu-muted" />
              </button>
            </div>

            {authUser ? (
              <button onClick={() => go(publicProfilePath)} className="mx-4 mt-4 mb-2 flex items-center gap-3 p-3 bg-olu-card rounded-2xl">
                <Avatar user={currentUser} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{currentUser.name}</p>
                  <p className="text-olu-muted text-xs">{currentUser.handle}</p>
                </div>
              </button>
            ) : (
              <div className="mx-4 mt-4 mb-2 space-y-2">
                <button onClick={() => go('/login')} className="w-full bg-olu-primary text-white rounded-xl px-4 py-2.5 font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                  <LogIn size={16} />
                  {t('common.signIn')}
                </button>
                <button onClick={() => go('/signup')} className="w-full bg-olu-card text-olu-text rounded-xl px-4 py-2.5 font-semibold hover:opacity-80 transition-colors">
                  {t('common.signUp')}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              <MenuItem icon={Wallet} label={t('common.wallet')} onClick={() => go('/wallet')} />
              {showBusiness && (
                <MenuItem icon={Briefcase} label={t('nav.businessOS')} onClick={() => { onClose(); window.open('/business', '_blank') }} />
              )}
              <MenuItem icon={Settings} label={t('common.settings')} onClick={() => go('/settings')} />

              {joinedWorkspaces.length > 0 && (
                <div className="pt-3 mt-2 border-t border-olu-border">
                  <p className="px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-olu-muted">{t('nav.apps', 'Apps')}</p>
                  {joinedWorkspaces.map((jw) => (
                    <button
                      key={jw.workspace_id}
                      onClick={() => go(`/w/${jw.workspace.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-olu-card transition-colors text-left rounded-xl"
                    >
                      {jw.workspace.icon ? (
                        <img src={jw.workspace.icon} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-bold text-white">{jw.workspace.name[0]}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium truncate">{jw.workspace.name}</span>
                      <ChevronRight size={14} className="text-olu-muted ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-olu-border flex items-center justify-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AppLayout() {
  const { currentUser, appType, enabledBusinessModules } = useApp()
  const { user: authUser } = useAuth()
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [joinedWorkspaces, setJoinedWorkspaces] = useState<(WorkspaceJoin & { workspace: Workspace })[]>([])
  const navigate = useNavigate()
  const navItems = CONSUMER_NAV[getTemplateKeyForAppType(appType)]
  const publicProfilePath = currentUser?.id ? `/people/${currentUser.id}` : '/profile'

  useEffect(() => {
    if (authUser?.id) {
      getUserWallet(authUser.id).then((w) => {
        if (w) setWalletBalance(Number(w.usdc_balance))
      }).catch(() => {})
      getJoinedWorkspaces(authUser.id).then(setJoinedWorkspaces).catch(() => {})
    }
  }, [authUser?.id])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-olu-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-olu-border bg-olu-surface flex-shrink-0">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-olu-text flex items-center justify-center">
            <Zap size={14} className="text-olu-bg" fill="currentColor" />
          </div>
          <span className="font-black text-lg block leading-none">OLU</span>
        </div>

        {authUser ? (
          <div className="px-3 pb-3">
            <button onClick={() => navigate(publicProfilePath)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-olu-card transition-colors group">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                <p className="text-olu-muted text-xs">{currentUser.handle}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="px-3 pb-3 space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-olu-primary text-white rounded-xl px-4 py-2.5 font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {t('common.signIn')}
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-olu-card text-olu-text rounded-xl px-4 py-2.5 font-semibold hover:opacity-80 transition-colors text-sm"
            >
              {t('common.signUp')}
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-sm font-medium cursor-pointer',
                isActive ? 'bg-olu-card text-olu-text' : 'text-olu-muted hover:text-olu-text hover:bg-olu-card'
              )}
            >
              <Icon size={18} />
              {t(label)}
            </NavLink>
          ))}

          {/* Joined Apps */}
          {joinedWorkspaces.length > 0 && (
            <div className="pt-3 mt-2 border-t border-olu-border">
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-olu-muted">{t('nav.apps', 'Apps')}</p>
              {joinedWorkspaces.map((jw) => (
                <NavLink
                  key={jw.workspace_id}
                  to={`/w/${jw.workspace.slug}`}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-2xl transition-colors text-sm font-medium cursor-pointer',
                    isActive ? 'bg-olu-card text-olu-text' : 'text-olu-muted hover:text-olu-text hover:bg-olu-card'
                  )}
                >
                  {jw.workspace.icon ? (
                    <img src={jw.workspace.icon} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-white">{jw.workspace.name[0]}</span>
                    </div>
                  )}
                  <span className="truncate">{jw.workspace.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-olu-border space-y-2">
          <div className="flex items-center justify-center gap-2 py-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          {enabledBusinessModules.length > 0 && (
            <button
              onClick={() => window.open('/business', '_blank')}
              className="w-full py-2.5 px-3 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/20"
            >
              <Briefcase size={14} />
              {t('nav.businessOS')}
            </button>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              'w-full py-2 px-3 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
              isActive ? 'bg-olu-card text-olu-text' : 'bg-olu-surface hover:bg-olu-card text-olu-muted'
            )}
          >
            <Settings size={14} />
            {t('common.settings')}
          </NavLink>
          <div className="px-3 py-2 rounded-2xl bg-olu-surface text-[11px] text-olu-muted text-center tracking-wide">
            {APP_VERSION}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-olu-bg flex-shrink-0">
          <button onClick={() => setMoreOpen(true)} className="p-1.5">
            <Menu size={22} />
          </button>
          <div className="text-center">
            <span className="font-black text-lg block leading-none">OLU</span>
            <span className="text-[10px] text-olu-muted tracking-wide">{APP_VERSION}</span>
          </div>
          <button onClick={() => navigate(publicProfilePath)} className="relative">
            <Avatar user={currentUser} />
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav — icon-only like Patreon */}
        <nav className="md:hidden flex items-center bg-olu-bg border-t border-olu-border flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(({ to, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex-1 flex items-center justify-center py-3.5 no-tap-highlight transition-colors',
                isActive ? 'text-olu-text' : 'text-olu-muted'
              )}
            >
              {({ isActive }) => (
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
              )}
            </NavLink>
          ))}
        </nav>
      </main>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} showBusiness={enabledBusinessModules.length > 0} walletBalance={walletBalance} joinedWorkspaces={joinedWorkspaces} />
    </div>
  )
}
