// Integrations = Third-Party Bridges (purple layer)
// Communication bridges and data platforms — bi-directional channels
// Examples: Slack, Telegram, WhatsApp, X, Instagram, Zendesk, Mixpanel

export type IntegrationProvider =
  | 'Slack'
  | 'Telegram'
  | 'WhatsApp'
  | 'X'
  | 'Instagram'
  | 'Zendesk'
  | 'Mixpanel'

export type IntegrationDirection = 'inbound' | 'outbound' | 'bidirectional'

export type IntegrationCategory = 'communication' | 'analytics' | 'support'

export type IntegrationStatus = 'connected' | 'planned' | 'error' | 'disconnected'

export type IntegrationSummary = {
  provider: IntegrationProvider | string
  status: IntegrationStatus
  category: IntegrationCategory
  direction: IntegrationDirection
  label: string
}
