import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppWindow, Bot, Briefcase, Cable, CheckCircle2, Clock, LayoutDashboard,
  Loader2, Megaphone, Package, ShieldCheck, UserRound, Users, Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { getTeamEmployeesForUser } from '../../../domain/team/api'
import { getOwnedConsumerApps } from '../../../domain/consumer/apps'
import { getWorkspaceConnectorSummariesForUser } from '../../../domain/connectors/api'
import type { EmployeeWithTasks } from '../../../domain/team/types'
import type { ConsumerApp } from '../../../lib/supabase'
import type { ConnectorSummary } from '../../../domain/connectors/types'

export default function BusinessWorkspace() {
  const { t } = useTranslation()
  const { currentUser, enabledBusinessModules } = useApp()
  const { user } = useAuth()

  const [employees, setEmployees] = useState<EmployeeWithTasks[]>([])
  const [apps, setApps] = useState<ConsumerApp[]>([])
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      getTeamEmployeesForUser(user).catch(() => []),
      getOwnedConsumerApps(user).catch(() => []),
      getWorkspaceConnectorSummariesForUser(user).catch(() => []),
    ]).then(([emps, ownedApps, conns]) => {
      setEmployees(emps)
      setApps(ownedApps)
      setConnectors(conns)
    }).finally(() => setLoading(false))
  }, [user?.id])

  const allTasks = useMemo(() => employees.flatMap((e) => e.tasks || []), [employees])
  const pendingTasks = allTasks.filter((t) => t.status === 'pending').length
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length
  const doneTasks = allTasks.filter((t) => t.status === 'done').length
  const highPriorityApprovals = allTasks.filter((t) => t.priority === 'high' && t.status !== 'done').length
  const onlineAgents = employees.filter((e) => e.status === 'online').length
  const publishedApps = apps.filter((a) => a.status === 'published').length
  const connectedPlatforms = connectors.filter((c) => c.status === 'connected').length

  const modules = useMemo(() => [
    { title: 'Creator Ops', description: 'IP licensing, CRM, merch, and creator monetization.', to: '/business/modules/creator', icon: LayoutDashboard, enabled: enabledBusinessModules.includes('creator_ops') },
    { title: 'Marketing', description: 'Campaign planning, influencer negotiation, and budget control.', to: '/business/modules/marketing', icon: Megaphone, enabled: enabledBusinessModules.includes('marketing') },
    { title: 'Supply Chain', description: 'Creator partnerships, SKU readiness, and supplier ops.', to: '/business/modules/supply', icon: Package, enabled: enabledBusinessModules.includes('supply_chain') },
  ], [enabledBusinessModules])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 overflow-x-hidden">
      {/* Hero + live stats */}
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--olu-sidebar-active-bg)]/10 text-xs text-[var(--olu-text-secondary)] mb-4">
          <Briefcase size={14} />
          {t('workspace.overview')}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Link to="/business/tasks" className="rounded-2xl bg-[var(--olu-section-bg)] p-4 border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)] transition-colors">
            <p className="text-2xl font-black">{inProgressTasks}</p>
            <p className="text-xs text-[var(--olu-text-secondary)] mt-1">{t('workspace.tasksInProgress')}</p>
          </Link>
          <Link to="/business/approvals" className="rounded-2xl bg-[var(--olu-section-bg)] p-4 border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)] transition-colors">
            <p className="text-2xl font-black">{highPriorityApprovals}</p>
            <p className="text-xs text-[var(--olu-text-secondary)] mt-1">{t('workspace.pendingApprovals')}</p>
          </Link>
          <Link to="/business/team" className="rounded-2xl bg-[var(--olu-section-bg)] p-4 border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)] transition-colors">
            <p className="text-2xl font-black">{employees.length}</p>
            <p className="text-xs text-[var(--olu-text-secondary)] mt-1">{t('workspace.teamMembers')}</p>
          </Link>
          <Link to="/business/apps" className="rounded-2xl bg-[var(--olu-section-bg)] p-4 border border-[var(--olu-card-border)] hover:bg-[var(--olu-card-hover)] transition-colors">
            <p className="text-2xl font-black">{publishedApps}</p>
            <p className="text-xs text-[var(--olu-text-secondary)] mt-1">{t('workspace.publishedApps')}</p>
          </Link>
        </div>
      </section>

      {/* Activity feed + team status */}
      <section className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 border border-[var(--olu-section-border)] bg-[var(--olu-section-bg)] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-600 dark:text-amber-300" />
            <p className="font-bold">{t('workspace.taskPipeline')}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('common.pending'), value: pendingTasks, icon: Clock, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-[var(--olu-accent-bg)]' },
              { label: t('common.inProgress'), value: inProgressTasks, icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-400/10' },
              { label: t('common.done'), value: doneTasks, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] text-center">
                <div className="flex justify-center mb-2">
                  <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', item.bg)}>
                    <item.icon size={15} className={item.color} />
                  </span>
                </div>
                <p className="font-black text-xl">{item.value}</p>
                <p className="text-xs text-[var(--olu-text-secondary)]">{item.label}</p>
              </div>
            ))}
          </div>
          {/* Recent activity */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-[var(--olu-text-secondary)] uppercase tracking-wider">{t('workspace.recentActivity')}</p>
            {employees.slice(0, 4).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 rounded-2xl bg-[var(--olu-card-bg)] p-3 border border-[var(--olu-card-border)]">
                {emp.avatar_img ? (
                  <img src={emp.avatar_img} alt={emp.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className={clsx('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0', emp.color || 'from-gray-600 to-gray-500')}>
                    {emp.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-[var(--olu-text-secondary)] truncate">{emp.last_message || emp.position}</p>
                </div>
                <span className="text-xs text-[var(--olu-muted)] flex-shrink-0">{emp.last_time || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-[var(--olu-section-border)] bg-[var(--olu-section-bg)] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bot size={18} />
            </div>
            <div>
              <p className="font-bold">{t('workspace.workforce')}</p>
              <p className="text-[var(--olu-text-secondary)] text-xs">{t('workspace.onlineTotal', { online: onlineAgents, total: employees.length })}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/business/team" className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-center gap-3 hover:bg-[var(--olu-card-hover)] transition-colors">
              <Bot size={16} className="text-cyan-500" />
              <div>
                <p className="font-semibold text-sm">{t('workspace.aiAgents', { count: employees.length })}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('workspace.onlineActiveTasks', { online: onlineAgents, tasks: allTasks.filter((t) => t.status !== 'done').length })}</p>
              </div>
            </Link>
            <Link to="/business/team/humans" className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-center gap-3 hover:bg-[var(--olu-card-hover)] transition-colors">
              <UserRound size={16} className="text-purple-600 dark:text-purple-400" />
              <div>
                <p className="font-semibold text-sm">{t('workspace.humanTeam')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('workspace.humanTeamDesc')}</p>
              </div>
            </Link>
            <Link to="/business/approvals" className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)] flex items-center gap-3 hover:bg-[var(--olu-card-hover)] transition-colors">
              <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-sm">{t('workspace.approvalCenter')}</p>
                <p className="text-[var(--olu-text-secondary)] text-xs">{t('workspace.approvalCenterDesc', { count: highPriorityApprovals })}</p>
              </div>
            </Link>
          </div>
          <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
            <p className="font-semibold text-sm mb-1">{t('workspace.sandboxMode')}</p>
            <p className="text-[var(--olu-text-secondary)] text-xs">{t('workspace.sandboxModeDesc')}</p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="grid lg:grid-cols-3 gap-4">
        {modules.map(({ title, description, to, icon: Icon, enabled }) => {
          const cn = clsx(
            'rounded-3xl p-6 border border-[var(--olu-section-border)] bg-[var(--olu-section-bg)]',
            enabled ? 'hover:bg-[var(--olu-card-hover)] transition-colors cursor-pointer' : 'opacity-70'
          )
          const content = (
            <>
              <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center mb-4', enabled ? 'bg-[var(--olu-accent-bg)] text-cyan-500' : 'bg-gray-500/10 text-[var(--olu-muted)]')}>
                <Icon size={20} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-lg">{title}</h3>
                <span className={enabled
                  ? 'text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 font-medium'
                  : 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400 font-medium'
                }>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-[var(--olu-text-secondary)] text-sm leading-relaxed mt-2">{description}</p>
            </>
          )
          return enabled
            ? <Link key={title} to={to} className={cn}>{content}</Link>
            : <div key={title} className={cn}>{content}</div>
        })}
      </section>

      {/* Consumer apps + Connectors */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Link to="/business/apps" className="rounded-3xl p-6 border border-[var(--olu-section-border)] bg-[var(--olu-section-bg)] hover:bg-[var(--olu-card-hover)] transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <AppWindow size={16} className="text-purple-600 dark:text-purple-400" />
            <p className="font-bold">Consumer apps</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <p className="text-2xl font-black">{apps.length}</p>
              <p className="text-xs text-[var(--olu-text-secondary)]">Total apps</p>
            </div>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <p className="text-2xl font-black">{publishedApps}</p>
              <p className="text-xs text-[var(--olu-text-secondary)]">Published</p>
            </div>
          </div>
          <div className="space-y-2">
            {apps.slice(0, 3).map((app) => (
              <div key={app.id} className="rounded-2xl bg-[var(--olu-card-bg)] p-3 border border-[var(--olu-card-border)] flex items-center gap-3">
                <span className={clsx('text-xs px-2 py-1 rounded-full font-medium',
                  app.app_type === 'community' ? 'bg-purple-400/10 text-purple-600 dark:text-purple-400' : 'bg-blue-400/10 text-blue-600 dark:text-blue-400'
                )}>
                  {app.app_type}
                </span>
                <p className="text-sm truncate flex-1">{app.title}</p>
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  app.status === 'published'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
                )}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </Link>

        <div className="rounded-3xl p-6 border border-[var(--olu-section-border)] bg-[var(--olu-section-bg)]">
          <div className="flex items-center gap-2 mb-4">
            <Cable size={16} className="text-cyan-500" />
            <p className="font-bold">Connectors</p>
            <span className="text-xs text-[var(--olu-text-secondary)] ml-auto">{connectedPlatforms} connected</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Shopify', 'Temu', 'SHEIN', 'Zendesk', 'Mixpanel', 'Google Play', 'App Store'].map((name) => {
              const isConnected = connectors.some((c) => c.provider === name && c.status === 'connected')
              return (
                <span key={name} className={clsx(
                  'px-3 py-1.5 rounded-full text-sm border',
                  isConnected
                    ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-500'
                    : 'bg-[var(--olu-card-bg)] border-[var(--olu-card-border)] text-[var(--olu-text-secondary)]'
                )}>
                  {name}
                </span>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <Users size={16} className="mb-2" />
              <p className="font-semibold text-sm">Team tools</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Bridge AI employees into existing workflows.</p>
            </div>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] p-4 border border-[var(--olu-card-border)]">
              <ShieldCheck size={16} className="mb-2" />
              <p className="font-semibold text-sm">Controlled delivery</p>
              <p className="text-[var(--olu-text-secondary)] text-xs mt-1">Approval and sandbox remain first-class.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
