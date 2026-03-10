import { useEffect, useState } from 'react'
import { Cable, CheckCircle2, Circle, ExternalLink, Loader2, Plus, Settings2 } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceConnectorSummariesForUser } from '../../../domain/connectors/api'
import type { ConnectorSummary } from '../../../domain/connectors/types'

const PLATFORM_META: Record<string, { description: string; color: string; icon?: string }> = {
  Shopify: { description: 'E-commerce storefront, orders, and inventory management', color: 'from-green-500 to-green-600', icon: '/images/connectors/shopify.svg' },
  Temu: { description: 'Marketplace listings, pricing, and order fulfillment', color: 'from-orange-500 to-red-500', icon: '/images/connectors/temu.svg' },
  SHEIN: { description: 'Product catalog sync and trend-driven merchandising', color: 'from-black to-gray-800', icon: '/images/connectors/shein.svg' },
  'Google Play': { description: 'App distribution, reviews, and store presence', color: 'from-blue-500 to-green-500', icon: '/images/connectors/google-play.svg' },
  'Apple App Store': { description: 'iOS app management, ratings, and submissions', color: 'from-gray-600 to-gray-800', icon: '/images/connectors/app-store.svg' },
  Zendesk: { description: 'Customer support tickets and agent routing', color: 'from-emerald-600 to-teal-600', icon: '/images/connectors/zendesk.svg' },
  Mixpanel: { description: 'Product analytics, funnels, and user behavior data', color: 'from-purple-600 to-violet-600', icon: '/images/connectors/mixpanel.svg' },
}

const PLANNED_PLATFORMS = ['Shopify', 'Temu', 'SHEIN', 'Google Play', 'Apple App Store', 'Zendesk', 'Mixpanel']

const STATUS_CFG = {
  connected: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Connected' },
  planned: { icon: Circle, color: 'text-cyan-100/45', bg: 'bg-cyan-500/10', label: 'Planned' },
  error: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Error' },
  disconnected: { icon: Circle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Disconnected' },
}

export default function Connectors() {
  const { user } = useAuth()
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getWorkspaceConnectorSummariesForUser(user)
      .then(setConnectors)
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  // Merge connected connectors with planned ones
  const connectedProviders = new Set(connectors.map((c) => c.provider))
  const allPlatforms = PLANNED_PLATFORMS.map((name) => {
    const existing = connectors.find((c) => c.provider === name)
    return {
      provider: name,
      status: existing?.status || 'planned' as const,
      label: name,
      ...PLATFORM_META[name],
    }
  })

  const connectedCount = allPlatforms.filter((p) => p.status === 'connected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cyan-100/45" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-cyan-100/45 text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">Connectors</h1>
          <p className="text-cyan-100/55 text-sm mt-1">
            {connectedCount} connected · {allPlatforms.length - connectedCount} planned
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#091422] border border-cyan-500/10 flex items-center justify-center">
          <Cable size={18} className="text-cyan-300" />
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_40%),linear-gradient(180deg,#0b1422_0%,#08111d_100%)] p-5">
        <p className="text-sm text-cyan-100/55 leading-relaxed">
          Connectors are <strong className="text-cyan-100/80">existing platforms</strong> where your AI agents execute tasks on your behalf — managing listings, processing orders, handling support tickets, and tracking analytics. Each connector gives your agents the ability to operate inside these platforms as if they were logged-in employees.
        </p>
      </div>

      <div className="space-y-3">
        {allPlatforms.map((platform) => {
          const cfg = STATUS_CFG[platform.status] || STATUS_CFG.planned
          const Icon = cfg.icon
          const meta = PLATFORM_META[platform.provider]
          return (
            <div key={platform.provider} className="rounded-2xl border border-cyan-500/10 bg-[#091422] p-5 flex items-start gap-4">
              {meta?.icon ? (
                <img src={meta.icon} alt={platform.provider} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0', meta?.color || 'from-gray-600 to-gray-500')}>
                  {platform.provider[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{platform.provider}</p>
                  <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
                </div>
                <p className="text-cyan-100/45 text-xs mt-1">{meta?.description || 'Platform connector'}</p>
                {platform.status === 'connected' && (
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/60 text-xs font-medium hover:bg-[#12213a] transition-colors flex items-center gap-1.5">
                      <Settings2 size={12} />
                      Configure
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-[#0d1726] border border-cyan-500/10 text-cyan-100/60 text-xs font-medium hover:bg-[#12213a] transition-colors flex items-center gap-1.5">
                      <ExternalLink size={12} />
                      Open
                    </button>
                  </div>
                )}
                {platform.status === 'planned' && (
                  <button className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-300/10 text-cyan-300 text-xs font-medium hover:bg-cyan-300/20 transition-colors flex items-center gap-1.5">
                    <Plus size={12} />
                    Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
