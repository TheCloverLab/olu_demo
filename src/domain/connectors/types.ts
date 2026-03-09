// Connectors = Existing Apps (orange layer)
// Platforms where AI agents execute tasks on behalf of the business
// Examples: Shopify, Temu, Shein, Google Play, Apple App Store

export type ConnectorProvider =
  | 'Shopify'
  | 'Temu'
  | 'Shein'
  | 'Google Play'
  | 'Apple App Store'

export type ConnectorStatus = 'connected' | 'planned' | 'error' | 'disconnected'

export type ConnectorSummary = {
  provider: ConnectorProvider | string
  status: ConnectorStatus
  label: string
}

export type ConnectorActionStatus = 'pending' | 'running' | 'done' | 'failed'

export type ConnectorAction = {
  id: string
  provider: ConnectorProvider | string
  title: string
  status: ConnectorActionStatus
  created_at?: string
}
