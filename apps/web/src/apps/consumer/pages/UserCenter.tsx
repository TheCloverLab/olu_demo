import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, ChevronRight, CreditCard, ExternalLink, Settings, User as UserIcon, Wallet } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

export default function UserCenter() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const MENU_ITEMS = [
    {
      icon: ExternalLink,
      label: t('userCenter.profile'),
      description: 'See how others see you',
      pathFn: (userId: string) => `/people/${userId}`,
    },
    {
      icon: CreditCard,
      label: t('userCenter.subscriptions'),
      description: 'Manage active memberships and renewals',
      path: '/subscriptions',
    },
    {
      icon: Wallet,
      label: t('userCenter.wallet'),
      description: 'Purchase history and payment methods',
      path: '/wallet',
    },
    {
      icon: Settings,
      label: t('userCenter.settings'),
      description: 'Profile, sign-in, and preferences',
      path: '/settings',
    },
  ] as const

  if (!user) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading profile...</div>
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4">
        <div className="rounded-[28px] border border-olu-border bg-olu-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {user.avatar_img ? (
                <img src={user.avatar_img} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${user.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-xl text-white`}>
                  {user.initials || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-xl">{user.name}</h1>
                  {user.verified && <BadgeCheck size={18} className="text-sky-600 dark:text-sky-400" fill="currentColor" />}
                </div>
                <p className="text-olu-muted text-sm mt-1">{user.handle}</p>
                {user.bio && <p className="text-sm text-olu-muted mt-2 line-clamp-2">{user.bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <section className="rounded-[24px] border border-olu-border bg-olu-surface overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted">Account</p>
            <p className="font-semibold text-base mt-1">Manage your account</p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const href = 'pathFn' in item ? item.pathFn(user.id) : item.path
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(href)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="rounded-xl bg-white/[0.06] p-2.5 flex-shrink-0">
                    <Icon size={18} className="text-olu-muted" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-olu-muted mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-olu-muted flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
