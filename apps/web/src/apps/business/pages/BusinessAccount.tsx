import { Briefcase, Cable, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'

export default function BusinessAccount() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentUser, enabledBusinessModules } = useApp()
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">{t('account.workspaceAccount')}</p>
          <h1 className="font-black text-2xl">{t('account.title')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-2 max-w-2xl">
            {t('account.subtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate('/business/settings')}
          className="px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('account.openSettings')}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
          <div className="flex items-center gap-4 mb-5">
            {currentUser.avatar_img ? (
              <img src={currentUser.avatar_img} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentUser.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-xl text-white`}>
                {currentUser.initials || 'U'}
              </div>
            )}
            <div>
              <p className="font-black text-xl">{currentUser.name}</p>
              <p className="text-[var(--olu-text-secondary)] text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <p className="text-[var(--olu-text-secondary)] text-xs mb-1">{t('account.workspaceModules')}</p>
              <p className="font-black text-2xl">{enabledBusinessModules.length}</p>
            </div>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <p className="text-[var(--olu-text-secondary)] text-xs mb-1">{t('account.accountStatus')}</p>
              <p className="font-semibold text-sm">{t('common.active')}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 mt-4 border border-[var(--olu-card-border)]">
            <p className="text-[var(--olu-text-secondary)] text-xs mb-2">{t('account.enabledModules')}</p>
            <div className="flex flex-wrap gap-2">
              {enabledBusinessModules.map((moduleKey) => (
                <span key={moduleKey} className="px-3 py-1.5 rounded-full bg-[var(--olu-accent-bg)] text-sm capitalize text-olu-text border border-[var(--olu-card-border)]">
                  {moduleKey.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Briefcase size={18} />
              </span>
              <div>
                <p className="font-bold">{t('account.workspaceBoundary')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('account.workspaceBoundaryShort')}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
              {t('account.workspaceBoundaryDesc')}
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <Users size={18} />
              </span>
              <div>
                <p className="font-bold">{t('account.operatorControls')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('account.operatorControlsShort')}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
              {t('account.operatorControlsDesc')}
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <Cable size={18} />
              </span>
              <div>
                <p className="font-bold">{t('account.connectedSystems')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('account.connectedSystemsShort')}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
              {t('account.connectedSystemsDesc')}
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-[var(--olu-card-bg)] text-olu-muted flex items-center justify-center">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="font-bold">{t('account.approvalSafety')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('account.approvalSafetyShort')}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
              {t('account.approvalSafetyDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
