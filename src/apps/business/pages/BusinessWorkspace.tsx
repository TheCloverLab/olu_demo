import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Briefcase, Cable, LayoutDashboard, Megaphone, Package, ShieldCheck, Sparkles, Users } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '../../../context/AppContext'

const PLATFORM_CONNECTORS = ['Shopify', 'Temu', 'SHEIN', 'Zendesk', 'Mixpanel', 'Google Play', 'App Store']

export default function BusinessWorkspace() {
  const { availableRoles, currentUser } = useApp()

  const modules = useMemo(() => {
    return [
      {
        title: 'Creator Ops',
        description: 'IP licensing, CRM, merch, and creator-side monetization workflows.',
        to: '/business/modules/creator',
        icon: LayoutDashboard,
        enabled: availableRoles.includes('creator'),
      },
      {
        title: 'Marketing',
        description: 'Influencer campaign planning, negotiation progress, and budget control.',
        to: '/business/modules/marketing',
        icon: Megaphone,
        enabled: availableRoles.includes('advertiser'),
      },
      {
        title: 'Supply Chain',
        description: 'Creator partnerships, SKU readiness, and supplier-side merchandising.',
        to: '/business/modules/supply',
        icon: Package,
        enabled: availableRoles.includes('supplier'),
      },
    ]
  }, [availableRoles])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <section className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 md:p-7 border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 text-xs text-cyan-100/70 mb-4">
            <Briefcase size={14} />
            Business entrypoint
          </div>
          <h2 className="font-black text-3xl leading-tight max-w-2xl">
            One merchant workspace for human employees, AI agents, and connected platforms.
          </h2>
          <p className="text-olu-muted text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
            This shell replaces role-first navigation. Each merchant enables the modules they need and runs workflows from one operational surface.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-2xl font-black">{modules.filter((item) => item.enabled).length}</p>
              <p className="text-xs text-olu-muted mt-1">Active modules</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-2xl font-black">{availableRoles.length}</p>
              <p className="text-xs text-olu-muted mt-1">Capabilities</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="text-2xl font-black">7</p>
              <p className="text-xs text-olu-muted mt-1">Planned connectors</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#0a1525]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-300">
              <Bot size={18} />
            </div>
            <div>
              <p className="font-bold">Agent control plane</p>
              <p className="text-olu-muted text-xs">Human + AI mixed workforce</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="font-semibold mb-1">{currentUser.name}</p>
              <p className="text-olu-muted text-xs">Workspace owner with unified visibility across modules and approvals.</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="font-semibold mb-1">AI employees</p>
              <p className="text-olu-muted text-xs">Operate in platform-native views first, with future Slack / TG / WhatsApp bridge support.</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <p className="font-semibold mb-1">Sandbox mode</p>
              <p className="text-olu-muted text-xs">Remote monitoring and remote takeover are designed as first-class controls.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        {modules.map(({ title, description, to, icon: Icon, enabled }) => {
          const className = clsx(
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
                  {enabled ? 'Enabled' : 'Not enabled'}
                </span>
              </div>
              <p className="text-olu-muted text-sm leading-relaxed mt-2">{description}</p>
            </>
          )

          return enabled
            ? <Link key={title} to={to} className={className}>{content}</Link>
            : <div key={title} className={className}>{content}</div>
        })}
      </section>

      <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-300" />
            <p className="font-bold">Priority demo journey</p>
          </div>
          <div className="space-y-3">
            {[
              'Advertiser briefs Marketing Manager with budget and target KOL profile.',
              'Agent sources creators, negotiates terms, and tracks each creator stage in parallel.',
              'KOL-side business agent receives a promotion request and requests approval.',
              'Once approved, content is scheduled and campaign progress returns to the marketer.',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#0d1726] p-4 text-sm text-olu-muted border border-cyan-500/10">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-cyan-500/10 bg-[#091422]">
          <div className="flex items-center gap-2 mb-4">
            <Cable size={16} className="text-cyan-300" />
            <p className="font-bold">Connectors roadmap</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {PLATFORM_CONNECTORS.map((connector) => (
              <span key={connector} className="px-3 py-1.5 rounded-full bg-[#0d1726] text-sm text-cyan-100/70 border border-cyan-500/10">
                {connector}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <Users size={16} className="text-white mb-2" />
              <p className="font-semibold text-sm">Existing team tools</p>
              <p className="text-olu-muted text-xs mt-1">Bridge AI employees into the merchant's existing workflows.</p>
            </div>
            <div className="rounded-2xl bg-[#0d1726] p-4 border border-cyan-500/10">
              <ShieldCheck size={16} className="text-white mb-2" />
              <p className="font-semibold text-sm">Controlled delivery</p>
              <p className="text-olu-muted text-xs mt-1">Approval, payment, and sandbox visibility remain first-class constraints.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
