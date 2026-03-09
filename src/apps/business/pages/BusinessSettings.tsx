import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronLeft, CreditCard, KeyRound, Megaphone, PackageCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceSettingsForUser, updateWorkspaceModuleForUser } from '../../../domain/workspace/api'
import type { BusinessModuleKey, WorkspaceSettingsData } from '../../../lib/supabase'

const MODULE_METADATA: Array<{
  key: BusinessModuleKey
  label: string
  description: string
  icon: typeof Sparkles
  accentClass: string
}> = [
  {
    key: 'creator_ops',
    label: 'Creator Ops',
    description: 'Approvals, IP control, customers, and shop operations.',
    icon: Sparkles,
    accentClass: 'bg-cyan-400/12 text-cyan-200 border-cyan-400/20',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Campaign sourcing, offer routing, and performance loops.',
    icon: Megaphone,
    accentClass: 'bg-blue-500/12 text-blue-200 border-blue-400/20',
  },
  {
    key: 'supply_chain',
    label: 'Supply Chain',
    description: 'Supplier partnerships, catalog readiness, and merch operations.',
    icon: PackageCheck,
    accentClass: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/20',
  },
]

export default function BusinessSettings() {
  const navigate = useNavigate()
  const { reloadBusinessModules } = useApp()
  const { user } = useAuth()
  const [settings, setSettings] = useState<WorkspaceSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingModule, setSavingModule] = useState<BusinessModuleKey | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      if (!user) { setLoading(false); return }
      try {
        const data = await getWorkspaceSettingsForUser(user)
        if (!cancelled) setSettings(data)
      } catch (error) {
        console.error('Failed to load workspace settings', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSettings()
    return () => { cancelled = true }
  }, [user?.id])

  const moduleStates = useMemo(() => {
    const enabledMap = new Map((settings?.modules || []).map((m) => [m.module_key, m.enabled]))
    return MODULE_METADATA.map((m) => ({ ...m, enabled: enabledMap.get(m.key) ?? false }))
  }, [settings?.modules])

  async function handleToggleModule(moduleKey: BusinessModuleKey, enabled: boolean) {
    if (!user) return
    setSavingModule(moduleKey)
    try {
      await updateWorkspaceModuleForUser(user, moduleKey, enabled)
      const data = await getWorkspaceSettingsForUser(user)
      setSettings(data)
      await reloadBusinessModules()
    } catch (error) {
      console.error('Failed to update module', error)
    } finally {
      setSavingModule(null)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-cyan-100/60">Loading workspace settings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/business')} className="p-2 rounded-full hover:bg-[#0d1a2d] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Workspace</p>
          <h1 className="font-black text-2xl">Settings</h1>
        </div>
      </div>

      {/* Modules */}
      <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 rounded-2xl bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="font-bold">Modules</p>
            <p className="text-cyan-100/55 text-xs">Enable or disable operator surfaces for this workspace</p>
          </div>
        </div>
        <div className="space-y-3">
          {moduleStates.map((module) => {
            const Icon = module.icon
            const isSaving = savingModule === module.key
            return (
              <div key={module.key} className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
                <div className="flex items-start gap-3">
                  <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${module.accentClass}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{module.label}</p>
                    <p className="text-cyan-100/55 text-xs max-w-md mt-1">{module.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleToggleModule(module.key, !module.enabled)}
                  className={`min-w-[112px] rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    module.enabled
                      ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'
                      : 'bg-white/8 text-cyan-50 border border-cyan-500/10 hover:bg-white/12'
                  }`}
                >
                  {isSaving ? 'Saving...' : module.enabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Billing */}
      <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
            <CreditCard size={18} />
          </span>
          <div>
            <p className="font-bold">Billing</p>
            <p className="text-cyan-100/55 text-xs">Plan, status, and billing contact</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <p className="text-cyan-100/55 text-xs mb-1">Plan</p>
            <p className="font-semibold text-sm capitalize">{settings?.billing?.plan || 'Starter'}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <p className="text-cyan-100/55 text-xs mb-1">Status</p>
            <p className="font-semibold text-sm capitalize">{settings?.billing?.status || 'Trial'}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <p className="text-cyan-100/55 text-xs mb-1">Billing contact</p>
            <p className="font-semibold text-sm truncate">{settings?.billing?.billing_email || user?.email}</p>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
            <Bell size={18} />
          </span>
          <div>
            <p className="font-bold">Notifications</p>
            <p className="text-cyan-100/55 text-xs">How events are routed in the workspace</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <div>
              <p className="font-semibold text-sm">Publish events</p>
              <p className="text-cyan-100/55 text-xs mt-0.5">Route creator approvals, rejected offers, and publish events to workspace</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              settings?.policies?.notification_policy?.route_publish_events_to_workspace
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-white/8 text-cyan-100/60'
            }`}>
              {settings?.policies?.notification_policy?.route_publish_events_to_workspace ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
            <KeyRound size={18} />
          </span>
          <div>
            <p className="font-bold">Security</p>
            <p className="text-cyan-100/55 text-xs">Session and access controls</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <p className="text-cyan-100/55 text-xs mb-1">Operator role</p>
            <p className="font-semibold text-sm capitalize">{settings?.membership.membership_role || 'Owner'}</p>
          </div>
          <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <p className="text-cyan-100/55 text-xs mb-1">Sandbox takeover</p>
            <p className="font-semibold text-sm capitalize">{settings?.policies?.sandbox_policy?.takeover_mode || 'Manual'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
