import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Cable, CheckCircle2, Circle, ExternalLink, Globe, Key, Loader2, Monitor, Plus, Settings2, X as XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import { getWorkspaceConnectorSummariesForUser } from '../../../domain/connectors/api'
import { getWorkspaceIntegrationSummariesForUser } from '../../../domain/integrations/api'
import { updateWorkspaceIntegrationConfig } from '../../../domain/workspace/api'
import type { ConnectorSummary } from '../../../domain/connectors/types'

function BrandIcon({ provider, size = 22 }: { provider: string; size?: number }) {
  const s = size
  const icons: Record<string, JSX.Element> = {
    Shopify: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M15.34 3.81c-.07 0-.13.05-.14.12-.01.05-.29 1.79-.29 1.79s-.58-.56-1.6-.56c-1.32 0-2.77 1.32-3.1 3.24-.42-.13-1.02-.32-1.04-.33-.31-.1-.32-.1-.36.2C8.71 9 7.2 14.12 7.2 14.12l5.73 1.07L17 14.01s-1.6-10.12-1.62-10.17a.13.13 0 00-.04-.03zm-1.72 2.5l-.44 1.36a4.4 4.4 0 00-1.53-.56c.23-.95.67-1.42 1.06-1.42.37 0 .7.23.91.62zm-.96-1.3c-.7 0-1.4.66-1.82 1.69-.48-.15-.94-.3-.94-.3s.64-2.46 1.93-2.46c.34 0 .61.15.83.43v.64zm1.73-.1l.04.26c0 .02-1.02-.26-1.02-.26l.13-.4c.29-.03.56.1.85.4z"/>
        <path d="M15.47 4c.02.12 1.62 10.17 1.62 10.17l-4.07 1.18-5.73-1.07S8.71 9 8.81 8.27c.04-.3.05-.3.36-.2.02.01.62.2 1.04.33.33-1.92 1.78-3.24 3.1-3.24 1.02 0 1.53.56 1.6.56 0 0 .28-1.74.29-1.79.01-.07.07-.12.14-.12.01 0 .02.01.04.03L15.47 4z" fill="white" opacity=".4"/>
      </svg>
    ),
    Temu: (
      <svg viewBox="0 0 24 24" width={s} height={s}>
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif">T</text>
      </svg>
    ),
    SHEIN: (
      <svg viewBox="0 0 24 24" width={s} height={s}>
        <text x="12" y="15.5" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">SHEIN</text>
      </svg>
    ),
    'Google Play': (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <path d="M4 3.54V20.46c0 .38.4.62.72.43l14.56-8.46a.5.5 0 000-.86L4.72 3.11A.5.5 0 004 3.54z" fill="url(#gp)"/>
        <defs><linearGradient id="gp" x1="4" y1="3" x2="20" y2="12"><stop stopColor="#00C3FF"/><stop offset=".25" stopColor="#00E88F"/><stop offset=".5" stopColor="#FFDE00"/><stop offset="1" stopColor="#FF3A44"/></linearGradient></defs>
      </svg>
    ),
    'Apple App Store': (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.81-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    X: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    Slack: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.522 2.521 2.528 2.528 0 01-2.522-2.521V2.522A2.528 2.528 0 0115.164 0a2.528 2.528 0 012.522 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.164 18.956a2.528 2.528 0 012.522 2.522A2.528 2.528 0 0115.164 24a2.528 2.528 0 01-2.522-2.522v-2.522h2.522zm0-1.27a2.528 2.528 0 01-2.522-2.522 2.528 2.528 0 012.522-2.522h6.314A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.522 2.522h-6.314z" fill="#ECB22E"/>
      </svg>
    ),
    Telegram: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    WhatsApp: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
      </svg>
    ),
    Zendesk: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M11.087 0v17.629L0 24V6.371A6.371 6.371 0 016.371 0h4.716zM12.913 24V6.371L24 0v17.629A6.371 6.371 0 0117.629 24h-4.716zM11.087 6.371a5.556 5.556 0 01-5.544 5.543A5.556 5.556 0 010 6.371h11.087zM24 17.629a5.556 5.556 0 01-5.543 5.543 5.556 5.556 0 01-5.544-5.543H24z"/>
      </svg>
    ),
    Mixpanel: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="white">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-2.5 14a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm5 0a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
      </svg>
    ),
  }
  return icons[provider] || <span className="text-white font-bold text-sm">{provider[0]}</span>
}

const AGENT_RUNTIME_URL = import.meta.env.VITE_AGENT_RUNTIME_URL || '/api/agent-runtime'

type ConnectionMethod = 'oauth' | 'api_key' | 'browser_session'

type PlatformConnectionMeta = {
  description: string
  color: string
  section?: 'connector' | 'integration'
  methods: ConnectionMethod[]
  fields?: { key: string; label: string; placeholder: string; secret?: boolean }[]
}

const PLATFORM_META: Record<string, PlatformConnectionMeta> = {
  Shopify: {
    description: 'E-commerce storefront, orders, and inventory management',
    color: 'from-green-500 to-green-600',
    methods: ['api_key'],
    fields: [
      { key: 'store_url', label: 'connectors.storeUrl', placeholder: 'your-store.myshopify.com' },
      { key: 'api_key', label: 'connectors.apiKey', placeholder: 'shpat_...', secret: true },
      { key: 'api_secret', label: 'connectors.apiSecret', placeholder: 'shpss_...', secret: true },
    ],
  },
  Temu: {
    description: 'Marketplace listings, pricing, and order fulfillment',
    color: 'from-orange-500 to-red-500',
    methods: ['browser_session'],
  },
  SHEIN: {
    description: 'Product catalog sync and trend-driven merchandising',
    color: 'from-gray-700 to-gray-900',
    methods: ['browser_session'],
  },
  'Google Play': {
    description: 'App distribution, reviews, and store presence',
    color: 'from-blue-500 to-green-500',
    methods: ['api_key'],
    fields: [
      { key: 'service_account_email', label: 'connectors.serviceAccountEmail', placeholder: 'bot@project.iam.gserviceaccount.com' },
      { key: 'service_account_key', label: 'connectors.serviceAccountKey', placeholder: 'connectors.pasteJsonKey', secret: true },
    ],
  },
  'Apple App Store': {
    description: 'iOS app management, ratings, and submissions',
    color: 'from-gray-600 to-gray-800',
    methods: ['api_key'],
    fields: [
      { key: 'issuer_id', label: 'connectors.issuerId', placeholder: '57246542-96fe-1a63-e053-0824d011072a' },
      { key: 'key_id', label: 'connectors.keyId', placeholder: '2X9R4HXF34' },
      { key: 'private_key', label: 'connectors.privateKey', placeholder: 'connectors.pasteP8Key', secret: true },
    ],
  },
  Zendesk: {
    description: 'Customer support tickets and agent routing',
    color: 'from-emerald-600 to-teal-600',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'subdomain', label: 'connectors.subdomain', placeholder: 'your-company' },
      { key: 'email', label: 'common.email', placeholder: 'admin@company.com' },
      { key: 'api_token', label: 'connectors.apiToken', placeholder: 'connectors.pasteApiToken', secret: true },
    ],
  },
  Mixpanel: {
    description: 'Product analytics, funnels, and user behavior data',
    color: 'from-purple-600 to-violet-600',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'project_token', label: 'connectors.projectToken', placeholder: 'connectors.pasteProjectToken' },
      { key: 'api_secret', label: 'connectors.apiSecret', placeholder: 'connectors.pasteApiSecret', secret: true },
    ],
  },
  X: {
    description: 'Post tweets, reply to mentions, and manage your X presence via OAuth',
    color: 'from-gray-800 to-black',
    section: 'integration',
    methods: ['oauth'],
  },
  Slack: {
    description: 'Team messaging, notifications, and workflow automation',
    color: 'from-purple-500 to-fuchsia-600',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'bot_token', label: 'connectors.botToken', placeholder: 'xoxb-...', secret: true },
      { key: 'channel_id', label: 'connectors.channelId', placeholder: 'C01ABCDEF' },
    ],
  },
  Telegram: {
    description: 'Bot messaging and community management',
    color: 'from-blue-400 to-blue-600',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'bot_token', label: 'connectors.botToken', placeholder: '123456:ABC-DEF...', secret: true },
      { key: 'chat_id', label: 'connectors.chatId', placeholder: '-1001234567890' },
    ],
  },
  WhatsApp: {
    description: 'Customer messaging and support via WhatsApp Business',
    color: 'from-green-400 to-green-600',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'phone_number_id', label: 'connectors.phoneNumberId', placeholder: '1234567890' },
      { key: 'access_token', label: 'connectors.accessToken', placeholder: 'connectors.pasteAccessToken', secret: true },
    ],
  },
  Instagram: {
    description: 'Content posting, story management, and DM automation',
    color: 'from-pink-500 to-orange-500',
    section: 'integration',
    methods: ['api_key'],
    fields: [
      { key: 'access_token', label: 'connectors.accessToken', placeholder: 'connectors.pasteAccessToken', secret: true },
      { key: 'business_account_id', label: 'connectors.businessAccountId', placeholder: '17841400...' },
    ],
  },
}

const CONNECTOR_PLATFORMS = ['Shopify', 'Temu', 'SHEIN', 'Google Play', 'Apple App Store']
const INTEGRATION_PLATFORMS = ['X', 'Slack', 'Telegram', 'WhatsApp', 'Instagram', 'Zendesk', 'Mixpanel']
const ALL_PLATFORMS = [...CONNECTOR_PLATFORMS, ...INTEGRATION_PLATFORMS]

/** Platforms that support OAuth connect via agent-runtime */
const OAUTH_PROVIDERS = new Set(['X'])

const STATUS_CFG = {
  connected: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-400/10', label: 'Connected' },
  planned: { icon: Circle, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-[var(--olu-accent-bg)]', label: 'Planned' },
  error: { icon: Circle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Error' },
  disconnected: { icon: Circle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-400/10', label: 'Disconnected' },
}

export default function Connectors() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([])
  const [integrations, setIntegrations] = useState<ConnectorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [configModal, setConfigModal] = useState<string | null>(null)

  // Check for OAuth callback success
  const twitterConnected = searchParams.get('twitter')
  const twitterUsername = searchParams.get('username')

  useEffect(() => {
    if (twitterConnected === 'connected') {
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
    loadData()
  }, [user?.id])

  function loadData() {
    if (!user) return
    setLoading(true)
    Promise.all([
      getWorkspaceConnectorSummariesForUser(user).catch(() => []),
      getWorkspaceIntegrationSummariesForUser(user).catch(() => []),
    ]).then(([c, i]) => {
      setConnectors(c)
      setIntegrations(i as ConnectorSummary[])
    }).finally(() => setLoading(false))
  }

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
    const params = new URLSearchParams({
      workspace_id: user.id,
      origin: `${AGENT_RUNTIME_URL}`,
    })
    window.location.href = `${AGENT_RUNTIME_URL}/oauth/${provider.toLowerCase()}?${params}`
  }

  function handleConnect(provider: string) {
    const meta = PLATFORM_META[provider]
    if (!meta) return

    if (meta.methods.includes('oauth') && OAUTH_PROVIDERS.has(provider)) {
      handleOAuthConnect(provider)
    } else {
      setConfigModal(provider)
    }
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
          <Cable size={18} className="text-cyan-700 dark:text-cyan-300" />
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/15 bg-[var(--olu-section-bg)] p-5">
        <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: t('connectors.description') }} />
      </div>

      {twitterConnected === 'connected' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          X/Twitter connected{twitterUsername ? ` as @${twitterUsername}` : ''}!
        </div>
      )}

      {/* Connectors — task execution platforms */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--olu-text-secondary)] uppercase tracking-wider mb-3">Connectors</h2>
        <div className="space-y-3">
          {connectorPlatforms.map((platform) => (
            <PlatformCard key={platform.provider} platform={platform} t={t} onConnect={handleConnect} connecting={connectingProvider} />
          ))}
        </div>
      </div>

      {/* Integrations — communication bridges */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--olu-text-secondary)] uppercase tracking-wider mb-3">Integrations</h2>
        <div className="space-y-3">
          {integrationPlatforms.map((platform) => (
            <PlatformCard key={platform.provider} platform={platform} t={t} onConnect={handleConnect} connecting={connectingProvider} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {configModal && (
          <ConnectorConfigModal
            provider={configModal}
            meta={PLATFORM_META[configModal]}
            user={user}
            t={t}
            onClose={() => setConfigModal(null)}
            onConnected={() => { setConfigModal(null); loadData() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PlatformCard({ platform, t, onConnect, connecting }: {
  platform: { provider: string; status: string; label: string; description?: string; color?: string }
  t: (key: string) => string
  onConnect: (provider: string) => void
  connecting: string | null
}) {
  const cfg = STATUS_CFG[platform.status as keyof typeof STATUS_CFG] || STATUS_CFG.planned
  const meta = PLATFORM_META[platform.provider]
  const methodLabel = meta?.methods[0] === 'oauth' ? 'OAuth' : meta?.methods[0] === 'browser_session' ? t('connectors.browserSession') : t('connectors.apiKey')

  return (
    <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', meta?.color || 'from-gray-600 to-gray-500')}>
        <BrandIcon provider={platform.provider} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{platform.provider}</p>
          <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', cfg.bg, cfg.color)}>{cfg.label}</span>
          {platform.status !== 'connected' && meta && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] border border-[var(--olu-card-border)]">
              {meta.methods[0] === 'oauth' && <Globe size={10} className="inline mr-1 -mt-0.5" />}
              {meta.methods[0] === 'api_key' && <Key size={10} className="inline mr-1 -mt-0.5" />}
              {meta.methods[0] === 'browser_session' && <Monitor size={10} className="inline mr-1 -mt-0.5" />}
              {methodLabel}
            </span>
          )}
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
        {platform.status !== 'connected' && (
          <button
            onClick={() => onConnect(platform.provider)}
            disabled={connecting === platform.provider}
            className="mt-3 px-3 py-1.5 rounded-xl bg-[var(--olu-accent-bg)] text-cyan-700 dark:text-cyan-300 text-xs font-medium hover:bg-[var(--olu-accent-bg-strong)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {connecting === platform.provider ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {t('common.connect')}
          </button>
        )}
      </div>
    </div>
  )
}

function ConnectorConfigModal({ provider, meta, user, t, onClose, onConnected }: {
  provider: string
  meta: PlatformConnectionMeta
  user: any
  t: (key: string, opts?: any) => string
  onClose: () => void
  onConnected: () => void
}) {
  const method = meta.methods[0]
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!user) return
    setError(null)

    // Validate required fields
    const emptyField = meta.fields?.find((f) => !formData[f.key]?.trim())
    if (emptyField) {
      setError(t('connectors.fieldRequired', { field: t(emptyField.label) }))
      return
    }

    setSaving(true)
    try {
      await updateWorkspaceIntegrationConfig(user, provider, {
        method: 'api_key',
        ...formData,
      })
      onConnected()
    } catch (err: any) {
      setError(err.message || t('connectors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'tween', duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-lg rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--olu-card-border)]">
            <div className="flex items-center gap-3">
              <div className={clsx('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', meta.color)}>
                <BrandIcon provider={provider} size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-sm">{t('connectors.connectProvider', { provider })}</h2>
                <p className="text-[var(--olu-text-secondary)] text-xs">
                  {method === 'api_key' && t('connectors.apiKeyMethod')}
                  {method === 'browser_session' && t('connectors.browserSessionMethod')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--olu-card-bg)] transition-colors">
              <XIcon size={16} className="text-[var(--olu-text-secondary)]" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {method === 'api_key' && meta.fields && (
              <div className="space-y-4">
                <p className="text-xs text-[var(--olu-text-secondary)] leading-relaxed">
                  {t('connectors.apiKeyDesc', { provider })}
                </p>
                {meta.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[var(--olu-text-secondary)] mb-1.5">{t(field.label)}</label>
                    {field.key === 'service_account_key' || field.key === 'private_key' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={t(field.placeholder)}
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm placeholder:text-[var(--olu-text-secondary)]/50 focus:outline-none focus:border-cyan-400/40 font-mono text-xs resize-none"
                      />
                    ) : (
                      <input
                        type={field.secret ? 'password' : 'text'}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={t(field.placeholder)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm placeholder:text-[var(--olu-text-secondary)]/50 focus:outline-none focus:border-cyan-400/40"
                      />
                    )}
                  </div>
                ))}
                <div className="rounded-xl bg-cyan-400/5 border border-cyan-400/15 p-3">
                  <p className="text-[11px] text-[var(--olu-text-secondary)] leading-relaxed">
                    {t('connectors.encryptionNote')}
                  </p>
                </div>
              </div>
            )}

            {method === 'browser_session' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] p-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--olu-accent-bg)] flex items-center justify-center mx-auto mb-3">
                    <Monitor size={24} className="text-cyan-700 dark:text-cyan-300" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{t('connectors.sandboxBrowserTitle')}</h3>
                  <p className="text-xs text-[var(--olu-text-secondary)] leading-relaxed mb-4">
                    {t('connectors.sandboxBrowserDesc', { provider })}
                  </p>
                  <div className="space-y-2 text-left">
                    {[t('connectors.sandboxStep1'), t('connectors.sandboxStep2', { provider }), t('connectors.sandboxStep3')].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--olu-accent-bg)] text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-[var(--olu-text-secondary)]">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-amber-400/5 border border-amber-400/15 p-3">
                  <p className="text-[11px] text-[var(--olu-text-secondary)] leading-relaxed">
                    {t('connectors.sandboxNote')}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--olu-card-border)]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-bg)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            {method === 'api_key' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300 text-sm font-medium hover:bg-[var(--olu-accent-bg-strong)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {t('connectors.saveAndConnect')}
              </button>
            )}
            {method === 'browser_session' && (
              <button
                className="px-4 py-2 rounded-xl bg-[var(--olu-accent-bg-strong)] text-cyan-700 dark:text-cyan-300 text-sm font-medium hover:bg-[var(--olu-accent-bg-strong)] transition-colors flex items-center gap-1.5"
              >
                <Monitor size={14} />
                {t('connectors.launchBrowser')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
