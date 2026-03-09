import { getWorkspaceSettingsForUser } from '../workspace/api'
import type { User } from '../../lib/supabase'
import type { IntegrationCategory, IntegrationDirection, IntegrationSummary } from './types'

const INTEGRATION_PROVIDERS = new Set(['Slack', 'Telegram', 'WhatsApp', 'X', 'Instagram', 'Zendesk', 'Mixpanel'])

const INTEGRATION_META: Record<string, { category: IntegrationCategory; direction: IntegrationDirection }> = {
  Slack: { category: 'communication', direction: 'bidirectional' },
  Telegram: { category: 'communication', direction: 'bidirectional' },
  WhatsApp: { category: 'communication', direction: 'bidirectional' },
  X: { category: 'communication', direction: 'outbound' },
  Instagram: { category: 'communication', direction: 'outbound' },
  Zendesk: { category: 'support', direction: 'bidirectional' },
  Mixpanel: { category: 'analytics', direction: 'inbound' },
}

export function isIntegrationProvider(provider: string): boolean {
  return INTEGRATION_PROVIDERS.has(provider)
}

export async function getWorkspaceIntegrationSummariesForUser(
  user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>
): Promise<IntegrationSummary[]> {
  const settings = await getWorkspaceSettingsForUser(user)
  return (settings.integrations || [])
    .filter((item) => isIntegrationProvider(item.provider))
    .map((item) => {
      const meta = INTEGRATION_META[item.provider] || { category: 'communication' as const, direction: 'bidirectional' as const }
      return {
        provider: item.provider,
        status: item.status,
        category: meta.category,
        direction: meta.direction,
        label: item.provider,
      }
    })
}
