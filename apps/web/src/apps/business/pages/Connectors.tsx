import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Cable, CheckCircle2, Circle, ExternalLink, Loader2, Plus, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceConnectorSummariesForUser } from '../../../domain/connectors/api'
import { getWorkspaceIntegrationSummariesForUser } from '../../../domain/integrations/api'
import type { ConnectorSummary } from '../../../domain/connectors/types'

const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'

const PLATFORM_META: Record<string, { description: string; color: string; section?: 'connector' | 'integration' }> = {
  Shopify: { description: 'E-commerce storefront, orders, and inventory management', color: 'from-green-500 to-green-600' },
  Temu: { description: 'Marketplace listings, pricing, and order fulfillment', color: 'from-orange-500 to-red-500' },
  SHEIN: { description: 'Product catalog sync and trend-driven merchandising', color: 'from-gray-700 to-gray-900' },
  'Google Play': { description: 'App distribution, reviews, and store presence', color: 'from-blue-500 to-green-500' },
  'Apple App Store': { description: 'iOS app management, ratings, and submissions', color: 'from-gray-600 to-gray-800' },
  Zendesk: { description: 'Customer support tickets and agent routing', color: 'from-emerald-600 to-teal-600', section: 'integration' },
  Mixpanel: { description: 'Product analytics, funnels, and user behavior data', color: 'from-purple-600 to-violet-600', section: 'integration' },
  X: { description: 'Post tweets, reply to mentions, and manage your X presence via OAuth', color: 'from-gray-800 to-black', section: 'integration' },
  Slack: { description: 'Team messaging, notifications, and workflow automation', color: 'from-purple-500 to-fuchsia-600', section: 'integration' },
  Telegram: { description: 'Bot messaging and community management', color: 'from-blue-400 to-blue-600', section: 'integration' },
  WhatsApp: { description: 'Customer messaging and support via WhatsApp Business', color: 'from-green-400 to-green-600', section: 'integration' },
  Instagram: { description: 'Content posting, story management, and DM automation', color: 'from-pink-500 to-orange-500', section: 'integration' },
}

const CONNECTOR_PLATFORMS = ['Shopify', 'Temu', 'SHEIN', 'Google Play', 'Apple App Store']
const INTEGRATION_PLATFORMS = ['X', 'Slack', 'Telegram', 'WhatsApp', 'Instagram', 'Zendesk', 'Mixpanel']
const ALL_PLATFORMS = [...CONNECTOR_PLATFORMS, ...INTEGRATION_PLATFORMS]

/** Platforms that support OAuth connect via agent-runtime */
const OAUTH_PROVIDERS = new Set(['X'])

const STATUS_CFG = {
  connected: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Connected' },
  planned: { icon: Circle, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-cyan-500/10', label: 'Planned' },
  error: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Error' },
  disconnected: { icon: Circle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Disconnected' },
}

export default function Connectors() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([])
  const [integrations, setIntegrations] = useState<ConnectorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  // Check for OAuth callback success
  const twitterConnected = searchParams.get('twitter')
  const twitterUsername = searchParams.get('username')

  useEffect(() => {
    if (twitterConnected === 'connected') {
      // Clear the URL params after showing success
      const timeout = setTimeout(() => {
        searchParams.delete('twitter')
        searchParams.delete('username')
        setSearchParams(searchParams, { replace: true })
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [twitterConnected])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      getWorkspaceConnectorSummariesForUser(user).catch(() => []),
      getWorkspaceIntegrationSummariesForUser(user).catch(() => []),
    ]).then(([c, i]) => {
      setConnectors(c)
      setIntegrations(i as ConnectorSummary[])
    }).finally(() => setLoading(false))
  }, [user?.id])

  // Merge connected items with planned ones
  const allItems = [...connectors, ...integrations]
  const allPlatforms = ALL_PLATFORMS.map((name) => {
    const existing = allItems.find((c) => c.provider === name)
    return {
      provider: name,
      status: existing?.status || 'planned' as const,
      label: name,
      ...PLATFORM_META[name],
    }
  })

  const connectorPlatforms = allPlatforms.filter((p) => CONNECTOR_PLATFORMS.includes(p.provider))
  const integrationPlatforms = allPlatforms.filter((p) => INTEGRATION_PLATFORMS.includes(p.provider))
  const connectedCount = allPlatforms.filter((p) => p.status === 'connected').length

  function handleOAuthConnect(provider: string) {
    if (!user) return
    setConnectingProvider(provider)
    // Redirect to agent-runtime OAuth endpoint
    const origin = window.location.origin
    // We need the workspace_id — fetch it from the user's workspace
    const params = new URLSearchParams({
      workspace_id: user.id, // will be resolved server-side
      origin: `${AGENT_RUNTIME_URL}`,
    })
    window.location.href = `${AGENT_RUNTIME_URL}/oauth/${provider.toLowerCase()}?${params}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[var(--olu-text-secondary)] text-xs uppercase tracking-wider mb-2">Workspace</p>
          <h1 className="font-black text-2xl">{t('connectors.title')}</h1>
          <p className="text-[var(--olu-text-secondary)] text-sm mt-1">
            {t('connectors.subtitle', { connected: connectedCount, planned: allPlatforms.length - connectedCount })}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
          <Cable size={18} className="text-cyan-300" />
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/15 bg-[var(--olu-section-bg)] p-5">
        <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: t('connectors.description') }} />
      </div>

      {twitterConnected === 'connected' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          X/Twitter connected{twitterUsername ? ` as @${twitterUsername}` : ''}!
        </div>
      )}

      {/* Connectors — task execution platforms */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--olu-text-secondary)] uppercase tracking-wider mb-3">Connectors</h2>
        <div className="space-y-3">
          {connectorPlatforms.map((platform) => (
            <PlatformCard key={platform.provider} platform={platform} t={t} onOAuthConnect={handleOAuthConnect} connecting={connectingProvider} />
          ))}
        </div>
      </div>

      {/* Integrations — communication bridges */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--olu-text-secondary)] uppercase tracking-wider mb-3">Integrations</h2>
        <div className="space-y-3">
          {integrationPlatforms.map((platform) => (
            <PlatformCard key={platform.provider} platform={platform} t={t} onOAuthConnect={handleOAuthConnect} connecting={connectingProvider} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PlatformCard({ platform, t, onOAuthConnect, connecting }: {
  platform: { provider: string; status: string; label: string; description?: string; color?: string }
  t: (key: string) => string
  onOAuthConnect: (provider: string) => void
  connecting: string | null
}) {
  const cfg = STATUS_CFG[platform.status as keyof typeof STATUS_CFG] || STATUS_CFG.planned
  const Icon = cfg.icon
  const meta = PLATFORM_META[platform.provider]
  const hasOAuth = OAUTH_PROVIDERS.has(platform.provider)

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0', meta?.color || 'from-gray-600 to-gray-500')}>
        {platform.provider === 'X' ? '𝕏' : platform.provider[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{platform.provider}</p>
          <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
        </div>
        <p className="text-[var(--olu-text-secondary)] text-xs mt-1">{meta?.description || 'Platform connector'}</p>
        {platform.status === 'connected' && (
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors flex items-center gap-1.5">
              <Settings2 size={12} />
              {t('common.configure')}
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-[var(--olu-text-secondary)] text-xs font-medium hover:bg-[var(--olu-card-hover)] transition-colors flex items-center gap-1.5">
              <ExternalLink size={12} />
              {t('common.open')}
            </button>
          </div>
        )}
        {platform.status !== 'connected' && hasOAuth && (
          <button
            onClick={() => onOAuthConnect(platform.provider)}
            disabled={connecting === platform.provider}
            className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-300/10 text-cyan-300 text-xs font-medium hover:bg-cyan-300/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {connecting === platform.provider ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Connect with OAuth
          </button>
        )}
        {platform.status !== 'connected' && !hasOAuth && (
          <button className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-300/10 text-cyan-300 text-xs font-medium hover:bg-cyan-300/20 transition-colors flex items-center gap-1.5">
            <Plus size={12} />
            {t('common.connect')}
          </button>
        )}
      </div>
    </div>
  )
}
