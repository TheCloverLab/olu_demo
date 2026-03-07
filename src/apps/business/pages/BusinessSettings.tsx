import { Bell, Cable, ChevronLeft, CreditCard, KeyRound, ShieldCheck, Users, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'

const CONNECTORS = [
  { name: 'Shopify', status: 'Connected', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  { name: 'Zendesk', status: 'Planned', tone: 'bg-white/8 text-cyan-100/60 border-cyan-500/10' },
  { name: 'Mixpanel', status: 'Planned', tone: 'bg-white/8 text-cyan-100/60 border-cyan-500/10' },
]

const APPROVAL_RULES = [
  'Publishing requires marketer approval after creator acceptance.',
  'Budget changes above $500 need workspace owner review.',
  'Sandbox takeover remains manual for high-risk automations.',
]

export default function BusinessSettings() {
  const navigate = useNavigate()
  const { availableRoles, currentUser } = useApp()
  const { user } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/business')}
          className="p-2 rounded-full hover:bg-[#0d1a2d] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-cyan-100/55 text-xs uppercase tracking-[0.18em] mb-2">Workspace Settings</p>
          <h1 className="font-black text-2xl md:text-3xl">Business operating rules and system controls</h1>
          <p className="text-cyan-100/60 text-sm md:text-base mt-2 max-w-3xl">
            This page controls how the workspace runs. It is intentionally separate from account identity, which lives in business account.
          </p>
        </div>
      </div>

      <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-4">
        <div className="rounded-3xl p-6 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-11 h-11 rounded-2xl bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
              <Wrench size={18} />
            </span>
            <div>
              <p className="font-bold">Workspace control plane</p>
              <p className="text-cyan-100/60 text-xs">Rules, integrations, and operator policy</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Operator</p>
              <p className="font-semibold text-sm">{currentUser.name}</p>
              <p className="text-cyan-100/50 text-xs mt-1">{user?.email}</p>
            </div>
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Capabilities</p>
              <p className="font-black text-2xl">{availableRoles.length}</p>
              <p className="text-cyan-100/50 text-xs mt-1">Modules enabled</p>
            </div>
            <div className="rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
              <p className="text-cyan-100/55 text-xs mb-1">Publishing mode</p>
              <p className="font-semibold text-sm">Human review</p>
              <p className="text-cyan-100/50 text-xs mt-1">Safe for MVP</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl p-4 bg-[#0d1726] border border-cyan-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-cyan-200" />
              <p className="font-semibold text-sm">Members and permissions</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Workspace owner</p>
                  <p className="text-cyan-100/55 text-xs">Can manage billing, policies, and connectors</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-200 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Marketing operators</p>
                  <p className="text-cyan-100/55 text-xs">Can create briefs and advance approved workflows</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/8 text-cyan-100/70 text-xs">Next</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Creator-side agents</p>
                  <p className="text-cyan-100/55 text-xs">Receive offers but stay inside review boundaries</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/8 text-cyan-100/70 text-xs">Configured</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                <Cable size={18} />
              </span>
              <div>
                <p className="font-bold">Connected platforms</p>
                <p className="text-cyan-100/55 text-xs">Commerce, support, analytics</p>
              </div>
            </div>
            <div className="space-y-3">
              {CONNECTORS.map((connector) => (
                <div key={connector.name} className="flex items-center justify-between gap-3 rounded-2xl p-3 bg-[#0d1726] border border-cyan-500/10">
                  <div>
                    <p className="font-medium text-sm">{connector.name}</p>
                    <p className="text-cyan-100/50 text-xs">Available to workspace operators</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-xs ${connector.tone}`}>
                    {connector.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="font-bold">Approval policy</p>
                <p className="text-cyan-100/55 text-xs">Operational safeguards</p>
              </div>
            </div>
            <div className="space-y-2">
              {APPROVAL_RULES.map((rule) => (
                <div key={rule} className="rounded-2xl p-3 bg-[#0d1726] border border-cyan-500/10 text-sm text-cyan-50/80">
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                  <KeyRound size={18} />
                </span>
                <div>
                  <p className="font-bold">Security</p>
                  <p className="text-cyan-100/55 text-xs">Session and access</p>
                </div>
              </div>
              <p className="text-sm text-cyan-50/75">Single operator login, manual review for sensitive flows, and sandbox takeover disabled by default.</p>
            </div>

            <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="font-bold">Notifications</p>
                  <p className="text-cyan-100/55 text-xs">Team routing</p>
                </div>
              </div>
              <p className="text-sm text-cyan-50/75">Creator approvals, rejected offers, and publish events route into the business workspace instead of consumer inboxes.</p>
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="font-bold">Billing state</p>
                <p className="text-cyan-100/55 text-xs">MVP placeholder</p>
              </div>
            </div>
            <p className="text-sm text-cyan-50/75">Keep billing lightweight for now: one workspace owner, one active plan, and spend visibility on campaign workflows.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
