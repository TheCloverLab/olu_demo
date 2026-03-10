import { describe, it, expect } from 'vitest'
import { isIntegrationProvider } from '../api'

describe('integrations api', () => {
  it('identifies integration providers', () => {
    expect(isIntegrationProvider('Slack')).toBe(true)
    expect(isIntegrationProvider('Zendesk')).toBe(true)
    expect(isIntegrationProvider('Mixpanel')).toBe(true)
    expect(isIntegrationProvider('Telegram')).toBe(true)
  })

  it('rejects connector providers', () => {
    expect(isIntegrationProvider('Shopify')).toBe(false)
    expect(isIntegrationProvider('Temu')).toBe(false)
    expect(isIntegrationProvider('Shein')).toBe(false)
    expect(isIntegrationProvider('Google Play')).toBe(false)
  })
})
