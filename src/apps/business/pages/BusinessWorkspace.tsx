import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AppWindow, Bot, Briefcase, Cable, CheckCircle2, Clock, LayoutDashboard,
  Loader2, Megaphone, Package, ShieldCheck, Sparkles, UserRound, Users, Zap,
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
        <Loader2 className="animate-spin text-cyan-100/45" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Hero + live stats */}
      <section className="rounded-3xl p-6 md:p-7 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 text-xs text-cyan-100/70 mb-4">
          <Briefcase size={14} />
          Workspace overview
        </div>
        <h2 className="font-black text-3xl leading-tight">
          {currentUser.name}'s Workspace
        </h2>
        <p className="text-cyan-100/55 text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
          Real-time snapshot of your modules, team, apps, and connected platforms.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Link to="/business/tasks" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 hover:bg-[#12213a] transition-colors">
            <p className="text-2xl font-black">{inProgressTasks}</p>
            <p className="text-xs text-cyan-100/45 mt-1">Tasks in progress</p>
          </Link>
          <Link to="/business/approvals" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 hover:bg-[#12213a] transition-colors">
            <p className="text-2xl font-black">{highPriorityApprovals}</p>
            <p className="text-xs text-cyan-100/45 mt-1">Pending approvals</p>
          </Link>
          <Link to="/business/team" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 hover:bg-[#12213a] transition-colors">
            <p className="text-2xl font-black">{employees.length}</p>
            <p className="text-xs text-cyan-100/45 mt-1">Team members</p>
          </Link>
          <Link to="/business/apps" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 hover:bg-[#12213a] transition-colors">
            <p className="text-2xl font-black">{publishedApps}</p>
            <p className="text-xs text-cyan-100/45 mt-1">Published apps</p>
          </Link>
        </div>
      </section>

      {/* Activity feed + team status */}
      <section className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-300" />
            <p className="font-bold">Task pipeline</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending', value: pendingTasks, icon: Clock, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10' },
              { label: 'In Progress', value: inProgressTasks, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Done', value: doneTasks, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 text-center">
                <div className="flex justify-center mb-2">
                  <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', item.bg)}>
                    <item.icon size={15} className={item.color} />
                  </span>
                </div>
                <p className="font-black text-xl">{item.value}</p>
                <p className="text-xs text-cyan-100/45">{item.label}</p>
              </div>
            ))}
          </div>
          {/* Recent activity */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-cyan-100/45 uppercase tracking-wider">Recent activity</p>
            {employees.slice(0, 4).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 rounded-2xl bg-[#0d1726] p-3 border border-cyan-500/10">
                <div className={clsx('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white', emp.color || 'from-gray-600 to-gray-500')}>
                  {emp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-cyan-100/45 truncate">{emp.last_message || emp.position}</p>
                </div>
                <span className="text-xs text-cyan-100/35 flex-shrink-0">{emp.last_time || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#0a1525] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-300">
              <Bot size={18} />
            </div>
            <div>
              <p className="font-bold">Workforce</p>
              <p className="text-cyan-100/45 text-xs">{onlineAgents} online · {employees.length} total</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link to="/business/team" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 flex items-center gap-3 hover:bg-[#12213a] transition-colors">
              <Bot size={16} className="text-cyan-200" />
              <div>
                <p className="font-semibold text-sm">{employees.length} AI Agents</p>
                <p className="text-cyan-100/45 text-xs">{onlineAgents} online, {allTasks.filter((t) => t.status !== 'done').length} active tasks</p>
              </div>
            </Link>
            <Link to="/business/team/humans" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 flex items-center gap-3 hover:bg-[#12213a] transition-colors">
              <UserRound size={16} className="text-purple-300" />
              <div>
                <p className="font-semibold text-sm">Human team</p>
                <p className="text-cyan-100/45 text-xs">Manage people alongside AI employees</p>
              </div>
            </Link>
            <Link to="/business/approvals" className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10 flex items-center gap-3 hover:bg-[#12213a] transition-colors">
              <ShieldCheck size={16} className="text-amber-300" />
              <div>
                <p className="font-semibold text-sm">Approval center</p>
                <p className="text-cyan-100/45 text-xs">{highPriorityApprovals} items need your review</p>
              </div>
            </Link>
          </div>
          <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
            <p className="font-semibold text-sm mb-1">Sandbox mode</p>
            <p className="text-cyan-100/45 text-xs">Remote monitoring and takeover are first-class controls.</p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="grid lg:grid-cols-3 gap-4">
        {modules.map(({ title, description, to, icon: Icon, enabled }) => {
          const cn = clsx(
            'rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]',
            enabled ? 'hover:bg-[#0d1a2d] transition-colors cursor-pointer' : 'opacity-70'
          )
          const content = (
            <>
              <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center mb-4', enabled ? 'bg-cyan-400/10 text-cyan-200' : 'bg-white/5 text-white/50')}>
                <Icon size={20} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-lg">{title}</h3>
                <span className={enabled ? 'text-emerald-300 text-xs' : 'text-amber-300 text-xs'}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-cyan-100/55 text-sm leading-relaxed mt-2">{description}</p>
            </>
          )
          return enabled
            ? <Link key={title} to={to} className={cn}>{content}</Link>
            : <div key={title} className={cn}>{content}</div>
        })}
      </section>

      {/* Consumer apps + Connectors */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Link to="/business/apps" className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422] hover:bg-[#0d1a2d] transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <AppWindow size={16} className="text-purple-300" />
            <p className="font-bold">Consumer apps</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-2xl font-black">{apps.length}</p>
              <p className="text-xs text-cyan-100/45">Total apps</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-2xl font-black">{publishedApps}</p>
              <p className="text-xs text-cyan-100/45">Published</p>
            </div>
          </div>
          <div className="space-y-2">
            {apps.slice(0, 3).map((app) => (
              <div key={app.id} className="rounded-2xl bg-[#0d1726] p-3 border border-cyan-500/10 flex items-center gap-3">
                <span className={clsx('text-xs px-2 py-1 rounded-full font-medium',
                  app.app_type === 'community' ? 'bg-purple-400/10 text-purple-400' : 'bg-blue-400/10 text-blue-400'
                )}>
                  {app.app_type}
                </span>
                <p className="text-sm truncate flex-1">{app.title}</p>
                <span className={clsx('text-xs', app.status === 'published' ? 'text-emerald-400' : 'text-amber-400')}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </Link>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <Cable size={16} className="text-cyan-300" />
            <p className="font-bold">Connectors</p>
            <span className="text-xs text-cyan-100/45 ml-auto">{connectedPlatforms} connected</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Shopify', 'Temu', 'SHEIN', 'Zendesk', 'Mixpanel', 'Google Play', 'App Store'].map((name) => {
              const isConnected = connectors.some((c) => c.provider === name && c.status === 'connected')
              return (
                <span key={name} className={clsx(
                  'px-3 py-1.5 rounded-full text-sm border',
                  isConnected
                    ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300'
                    : 'bg-[#0d1726] border-cyan-500/10 text-cyan-100/50'
                )}>
                  {name}
                </span>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <Users size={16} className="text-white mb-2" />
              <p className="font-semibold text-sm">Team tools</p>
              <p className="text-cyan-100/45 text-xs mt-1">Bridge AI employees into existing workflows.</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <ShieldCheck size={16} className="text-white mb-2" />
              <p className="font-semibold text-sm">Controlled delivery</p>
              <p className="text-cyan-100/45 text-xs mt-1">Approval and sandbox remain first-class.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apps + demo journey */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Link to="/business/apps" className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422] hover:bg-[#0d1a2d] transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <AppWindow size={16} className="text-amber-300" />
            <p className="font-bold">Apps</p>
          </div>
          <div className="space-y-3">
            {[
              `${apps.length} consumer app${apps.length === 1 ? '' : 's'} configured`,
              'Manage communities, academies, and other consumer-facing products.',
              'Open Apps to configure and publish your consumer storefront.',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#0d1726] p-4 text-sm text-cyan-100/55 border border-cyan-500/10">
                {item}
              </div>
            ))}
          </div>
        </Link>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-300" />
            <p className="font-bold">Priority demo journey</p>
          </div>
          <div className="space-y-3">
            {[
              'Advertiser briefs Marketing Manager with budget and target KOL profile.',
              'Agent sources creators, negotiates terms, and tracks each creator stage.',
              'KOL-side business agent receives a promotion request and requests approval.',
              'Once approved, content is scheduled and campaign progress returns.',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#0d1726] p-4 text-sm text-cyan-100/55 border border-cyan-500/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
