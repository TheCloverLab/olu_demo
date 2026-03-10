import { getWorkspaceSettingsForUser } from '../workspace/api'
import { isIntegrationProvider } from '../integrations/api'
import type { User } from '../../lib/supabase'
import type { ConnectorAction, ConnectorSummary } from './types'

export async function getWorkspaceConnectorSummariesForUser(user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<ConnectorSummary[]> {
  const settings = await getWorkspaceSettingsForUser(user)
  return (settings.integrations || [])
    .filter((item) => !isIntegrationProvider(item.provider))
    .map((integration) => ({
      provider: integration.provider,
      status: integration.status,
      label: integration.provider,
    }))
}

export async function listWorkspaceConnectorActionsForUser(_user: Pick<User, 'id' | 'username' | 'handle' | 'name' | 'email'>): Promise<ConnectorAction[]> {
  return []
}
