import { Briefcase, Cable, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'

export default function BusinessAccount() {
  const navigate = useNavigate()
  const { currentUser, availableRoles, enabledBusinessModules } = useApp()
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-cyan-100/45 text-xs uppercase tracking-wider mb-2">Workspace Account</p>
          <h1 className="font-black text-2xl">Account</h1>
          <p className="text-cyan-100/55 text-sm mt-2 max-w-2xl">
            Workspace identity, enabled modules, and connected platforms.
          </p>
        </div>
        <button
          onClick={() => navigate('/business/settings')}
          className="px-4 py-2.5 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Open Settings
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
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
              <p className="text-cyan-100/45 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/45 text-xs mb-1">Workspace modules</p>
              <p className="font-black text-2xl">{enabledBusinessModules.length}</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-cyan-100/45 text-xs mb-1">Current operator mode</p>
              <p className="font-semibold text-sm capitalize">{currentUser.role}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0d1726] p-4 mt-4 border border-cyan-500/10">
            <p className="text-cyan-100/45 text-xs mb-2">Enabled workspace modules</p>
            <div className="flex flex-wrap gap-2">
              {enabledBusinessModules.map((moduleKey) => (
                <span key={moduleKey} className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-sm capitalize text-cyan-100/80 border border-cyan-500/10">
                  {moduleKey.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                <Briefcase size={18} />
              </span>
              <div>
                <p className="font-bold">Workspace boundary</p>
                <p className="text-cyan-100/45 text-xs">Separate from consumer profile</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100/55 leading-relaxed">
              Business account pages should never drop users into content profile/feed pages. Consumer surfaces are only reachable via the explicit consumer app entry.
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <Users size={18} />
              </span>
              <div>
                <p className="font-bold">Operator controls</p>
                <p className="text-cyan-100/45 text-xs">People and permissions</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100/55 leading-relaxed">
              Human employees, AI employees, and module switching all belong to the workspace layer.
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Cable size={18} />
              </span>
              <div>
                <p className="font-bold">Connected systems</p>
                <p className="text-cyan-100/45 text-xs">Shopify, Temu, Zendesk, Mixpanel</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100/55 leading-relaxed">
              Future connectors and sandbox permissions should also be managed from business account and settings surfaces.
            </p>
          </div>

          <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="font-bold">Approval safety</p>
                <p className="text-cyan-100/45 text-xs">Operational trust model</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100/55 leading-relaxed">
              High-stakes actions such as publishing, payments, and sandbox takeover should remain visible and reviewable from the workspace layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
