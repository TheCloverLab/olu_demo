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
  planned: { icon: Circle, color: 'text-[var(--olu-text-secondary)]', bg: 'bg-cyan-500/10', label: 'Planned' },
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
      <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0', meta?.color || 'from-gray-600 to-gray-500')}>
        {platform.provider === 'X' ? '𝕏' : platform.provider[0]}
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
            className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-300/10 text-cyan-700 dark:text-cyan-300 text-xs font-medium hover:bg-cyan-300/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
              <div className={clsx('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs', meta.color)}>
                {provider === 'X' ? '𝕏' : provider[0]}
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
                  <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center mx-auto mb-3">
                    <Monitor size={24} className="text-cyan-700 dark:text-cyan-300" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{t('connectors.sandboxBrowserTitle')}</h3>
                  <p className="text-xs text-[var(--olu-text-secondary)] leading-relaxed mb-4">
                    {t('connectors.sandboxBrowserDesc', { provider })}
                  </p>
                  <div className="space-y-2 text-left">
                    {[t('connectors.sandboxStep1'), t('connectors.sandboxStep2', { provider }), t('connectors.sandboxStep3')].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
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
                className="px-4 py-2 rounded-xl bg-cyan-400/15 text-cyan-700 dark:text-cyan-300 text-sm font-medium hover:bg-cyan-400/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {t('connectors.saveAndConnect')}
              </button>
            )}
            {method === 'browser_session' && (
              <button
                className="px-4 py-2 rounded-xl bg-cyan-400/15 text-cyan-700 dark:text-cyan-300 text-sm font-medium hover:bg-cyan-400/25 transition-colors flex items-center gap-1.5"
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
