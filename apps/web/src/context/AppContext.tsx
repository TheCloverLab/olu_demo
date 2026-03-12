import { ReactNode } from 'react'
import { SessionProvider, useSession } from './SessionContext'
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext'
import { ConsumerProvider, useConsumer } from './ConsumerContext'
import type { ConsumerTemplateKey } from '../apps/consumer/templateConfig'
import type { ConsumerExperience } from '../domain/consumer/api'
import type { BusinessModuleKey, ConsumerApp, ConsumerAppType, Workspace, WorkspaceConsumerConfig } from '../lib/supabase'

export interface AppContextType {
  currentUser: any
  workspace: Workspace | null
  enabledBusinessModules: BusinessModuleKey[]
  workspaceLoading: boolean
  hasModule: (moduleKey: BusinessModuleKey) => boolean
  consumerTemplate: ConsumerTemplateKey | null
  appType: ConsumerAppType | null
  consumerApps: ConsumerApp[]
  primaryConsumerApp: ConsumerApp | null
  consumerConfig: WorkspaceConsumerConfig['config_json']
  consumerExperience: ConsumerExperience
  setConsumerTemplate: (template: ConsumerTemplateKey) => void
  setConsumerConfig: (config: Partial<WorkspaceConsumerConfig['config_json']>) => void
  reloadBusinessModules: () => Promise<void>
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SessionProvider>
      <WorkspaceProvider>
        <ConsumerProvider>
          {children}
        </ConsumerProvider>
      </WorkspaceProvider>
    </SessionProvider>
  )
}

export function useApp(): AppContextType {
  const { currentUser } = useSession()
  const { workspace, enabledBusinessModules, workspaceLoading, hasModule, reloadBusinessModules } = useWorkspace()
  const { consumerTemplate, appType, consumerApps, primaryConsumerApp, consumerConfig, consumerExperience, setConsumerTemplate, setConsumerConfig } = useConsumer()

  return {
    currentUser,
    workspace,
    enabledBusinessModules,
    workspaceLoading,
    hasModule,
    consumerTemplate,
    appType,
    consumerApps,
    primaryConsumerApp,
    consumerConfig,
    consumerExperience,
    setConsumerTemplate,
    setConsumerConfig,
    reloadBusinessModules,
  }
}
