import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  ListTodo,
  ShieldCheck,
  AppWindow,
  Cable,
  Wallet,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Globe,
  Layers,
  Tag,
  Headphones,
  Home,
  BarChart3,
  FolderKanban,
  MessageSquare,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { getWorkspaceWalletForUser } from '../../../domain/workspace/api'
import { APP_VERSION } from '../../../lib/version'
import type { BusinessModuleKey, WorkspaceWallet } from '../../../lib/supabase'

type NavItem = { to: string; icon: typeof PanelsTopLeft; labelKey: string; exact?: boolean; moduleKey?: BusinessModuleKey }
type NavGroup = { groupLabelKey: string; items: NavItem[] }

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    groupLabelKey: 'nav.groupDashboard',
    items: [
      { to: '/business', icon: PanelsTopLeft, labelKey: 'nav.overview', exact: true },
      { to: '/business/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
    ],
  },
  {
    groupLabelKey: 'nav.groupApp',
    items: [
      { to: '/business/experiences', icon: Layers, labelKey: 'nav.experiences' },
      { to: '/business/products', icon: Tag, labelKey: 'nav.products' },
      { to: '/business/members', icon: Users, labelKey: 'nav.members' },
      { to: '/business/home-editor', icon: Home, labelKey: 'nav.homeEditor' },
      { to: '/business/support', icon: Headphones, labelKey: 'nav.support' },
    ],
  },
  {
    groupLabelKey: 'nav.groupOperations',
    items: [
      { to: '/business/chat', icon: MessageSquare, labelKey: 'nav.chat' },
      { to: '/business/projects', icon: FolderKanban, labelKey: 'nav.projects' },
      { to: '/business/team', icon: Users, labelKey: 'nav.team', exact: true },
      { to: '/business/tasks', icon: ListTodo, labelKey: 'nav.tasks' },
      { to: '/business/approvals', icon: ShieldCheck, labelKey: 'nav.approvals' },
    ],
  },
  {
    groupLabelKey: 'nav.groupModules',
    items: [
      { to: '/business/modules/creator', icon: LayoutDashboard, labelKey: 'nav.creatorOps', moduleKey: 'creator_ops' },
      { to: '/business/modules/marketing', icon: Megaphone, labelKey: 'nav.marketing', moduleKey: 'marketing' },
      { to: '/business/modules/supply', icon: Package, labelKey: 'nav.supplyChain', moduleKey: 'supply_chain' },
      { to: '/business/connectors', icon: Cable, labelKey: 'nav.connectors' },
    ],
  },
  {
    groupLabelKey: 'nav.groupSystem',
    items: [
      { to: '/business/agents', icon: Bot, labelKey: 'nav.aiAgentMarketplace' },
    ],
  },
]

// Flat list for breadcrumb/label resolution
const ALL_NAV_ITEMS: NavItem[] = SIDEBAR_GROUPS.flatMap((g) => g.items)

function Avatar({ user, size = 'sm' }: { user: any; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const avatarSrc = user.avatar_img || user.avatarImg
  const avatarColor = user.avatar_color || user.avatarColor || 'from-gray-600 to-gray-500'
  const initials = user.initials || 'U'

  if (avatarSrc) {
    return <img src={avatarSrc} alt={user.name} className={clsx('rounded-full object-cover flex-shrink-0', sz)} />
  }

  return (
    <div className={clsx(`bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`, sz)}>
      {initials}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[var(--olu-sidebar-hover)] transition-colors text-left rounded-xl"
    >
      <Icon size={20} className="text-[var(--olu-sidebar-muted)]" />
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-[var(--olu-sidebar-muted)] ml-auto" />
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
    <div className="flex items-center gap-0.5 rounded-lg border border-[var(--olu-input-border)] bg-[var(--olu-input-bg)] p-0.5">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={clsx(
            'p-1.5 rounded-md transition-colors',
            theme === value
              ? 'bg-[var(--olu-sidebar-active-bg)] text-[var(--olu-sidebar-active-text)]'
              : 'text-[var(--olu-muted)] hover:text-[var(--olu-text)]'
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
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--olu-input-border)] bg-[var(--olu-input-bg)] text-xs font-medium text-[var(--olu-muted)] hover:text-[var(--olu-text)] transition-colors"
    >
      <Globe size={14} />
      {isZh ? 'EN' : '中文'}
    </button>
  )
}

function WorkspaceIconBadge({ workspace }: { workspace: any }) {
  const [imgError, setImgError] = useState(false)
  if (workspace?.icon && !imgError) {
    return <img src={workspace.icon} alt={workspace.name} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" onError={() => setImgError(true)} />
  }
  return (
    <div className="w-8 h-8 rounded-xl bg-[var(--olu-sidebar-active-bg)] text-[var(--olu-sidebar-active-text)] flex items-center justify-center font-bold text-sm shadow-[0_0_24px_rgba(103,232,249,0.25)]">
      {(workspace?.name || 'O')[0]}
    </div>
  )
}

function WorkspaceSwitcher() {
  const { workspace } = useApp()
  const { t } = useTranslation()

  return (
    <div className="px-5 py-5 flex items-center gap-3">
      <WorkspaceIconBadge workspace={workspace} />
      <div className="min-w-0 flex-1">
        <p className="font-black text-lg leading-none truncate">{workspace?.name || 'OLU Business'}</p>
        <p className="text-[var(--olu-sidebar-muted)] text-xs mt-1 truncate">{workspace?.headline || t('nav.defaultHeadline', 'Merchant operations cockpit')}</p>
      </div>
      {workspace?.slug && (
        <a
          href={`/w/${workspace.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-[var(--olu-sidebar-hover)] transition-colors text-[var(--olu-sidebar-muted)] hover:text-[var(--olu-sidebar-active-bg)] flex-shrink-0"
          title="View as consumer"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}

function BusinessMenu({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: WorkspaceWallet | null }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentUser, hasModule } = useApp()

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
            className="fixed inset-0 bg-[var(--olu-overlay-bg)] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-[var(--olu-sidebar-bg)] z-50 flex flex-col border-r border-[var(--olu-border)]"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--olu-border)]">
              <WorkspaceSwitcher />
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--olu-sidebar-hover)] transition-colors">
                <X size={18} className="text-[var(--olu-sidebar-muted)]" />
              </button>
            </div>

            <button onClick={() => go('/business/wallet')} className="mx-4 mb-2 block rounded-2xl bg-[var(--olu-input-bg)] border border-[var(--olu-input-border)] hover:bg-[var(--olu-sidebar-hover)] transition-colors text-left">
              <div className="px-3 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-[var(--olu-sidebar-muted)] font-medium">{t('common.wallet')}</span>
                </div>
                <p className="font-black text-lg leading-none">${wallet ? Number(wallet.usdc_balance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">{t('common.balance')}</p>
              </div>
            </button>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {SIDEBAR_GROUPS.map((group) => {
                const visibleItems = group.items.filter((item) => !item.moduleKey || hasModule(item.moduleKey))
                if (visibleItems.length === 0) return null
                return (
                  <div key={group.groupLabelKey}>
                    <p className="text-[10px] text-[var(--olu-muted)] uppercase tracking-wider px-4 pt-3 pb-1">{t(group.groupLabelKey)}</p>
                    {visibleItems.map((item) => (
                      <MenuItem key={item.to} icon={item.icon} label={t(item.labelKey)} onClick={() => go(item.to)} />
                    ))}
                  </div>
                )
              })}
              <div className="border-t border-[var(--olu-border)] my-2 mx-2" />
              <MenuItem icon={Settings} label={t('common.settings')} onClick={() => go('/business/settings')} />
              <MenuItem icon={ExternalLink} label={t('nav.openOlu')} onClick={() => window.open('/', '_blank', 'noopener,noreferrer')} />
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function BusinessLayout() {
  const { currentUser, enabledBusinessModules } = useApp()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [wallet, setWallet] = useState<WorkspaceWallet | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      getWorkspaceWalletForUser(user).then(setWallet).catch(() => {})
    }
  }, [user?.id])

  const allNav = [
    ...ALL_NAV_ITEMS,
    { to: '/business/wallet', icon: Wallet, labelKey: 'common.wallet' },
    { to: '/business/agents', icon: Bot, labelKey: 'nav.aiAgentMarketplace' },
  ]
  const activeModuleLabel = (() => {
    const item = allNav.find((item) =>
      ('exact' in item && item.exact) ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )
    return item ? t(item.labelKey) : undefined
  })()

  return (
    <div className="business-shell flex h-[100dvh] overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--olu-border)] bg-[var(--olu-sidebar-bg)] flex-shrink-0">
        <WorkspaceSwitcher />

        <div className="px-3 pb-3 space-y-2">
          <NavLink
            to="/business/wallet"
            className={({ isActive }) => clsx(
              'block rounded-2xl transition-colors cursor-pointer border',
              isActive ? 'bg-[var(--olu-sidebar-active-bg)]/10 border-[var(--olu-sidebar-active-bg)]/20' : 'bg-[var(--olu-input-bg)] border-[var(--olu-input-border)] hover:bg-[var(--olu-sidebar-hover)]'
            )}
          >
            <div className="px-3 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-[var(--olu-sidebar-muted)] font-medium">{t('common.wallet')}</span>
              </div>
              <p className="font-black text-lg leading-none">${wallet ? Number(wallet.usdc_balance).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">{t('common.balance')}</p>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.moduleKey || enabledBusinessModules.includes(item.moduleKey))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.groupLabelKey}>
                <p className="text-[10px] text-[var(--olu-muted)] uppercase tracking-wider px-3 pt-4 pb-1">{t(group.groupLabelKey)}</p>
                {visibleItems.map(({ to, icon: Icon, labelKey, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-sm font-medium cursor-pointer',
                      isActive ? 'bg-[var(--olu-sidebar-active-bg)] text-[var(--olu-sidebar-active-text)]' : 'text-[var(--olu-sidebar-text)] hover:text-[var(--olu-text)] hover:bg-[var(--olu-sidebar-hover)]'
                    )}
                  >
                    <Icon size={18} />
                    {t(labelKey)}
                  </NavLink>
                ))}
              </div>
            )
          })}

        </nav>

        <div className="p-3 border-t border-[var(--olu-border)] space-y-2">
          <button
            onClick={() => navigate('/business/settings')}
            className="w-full py-2.5 px-3 rounded-2xl bg-[var(--olu-sidebar-hover)] hover:opacity-80 text-[var(--olu-sidebar-text)] text-sm font-medium transition-colors"
          >
            {t('common.settings')}
          </button>
          <button
            onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
            className="w-full py-2.5 px-3 rounded-2xl bg-[var(--olu-sidebar-hover)] hover:opacity-80 text-[var(--olu-sidebar-text)] text-sm font-medium transition-colors"
          >
            {t('nav.openOlu')}
          </button>
          <p className="text-[10px] text-[var(--olu-muted)] text-center tracking-wide">
            {APP_VERSION}
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[var(--olu-border)] bg-[var(--olu-header-bg)] backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden p-1.5">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="md:hidden font-black text-lg">{activeModuleLabel || 'Business'}</p>
              <p className="hidden md:block text-[var(--olu-muted)] text-xs tracking-wide">
                {t('nav.workspace')} / {activeModuleLabel || 'Business'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button onClick={() => navigate('/business/account')} className="flex-shrink-0">
              <Avatar user={currentUser} size="sm" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </div>
      </main>

      <BusinessMenu open={menuOpen} onClose={() => setMenuOpen(false)} wallet={wallet} />
    </div>
  )
}
