import { ReactNode } from 'react'
import { SessionProvider, useSession } from './SessionContext'
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext'
import { ConsumerProvider, useConsumer } from './ConsumerContext'
import type { ConsumerTemplateKey } from '../apps/consumer/templateConfig'
import type { ConsumerExperience } from '../domain/consumer/api'
import type { BusinessModuleKey, ConsumerApp, WorkspaceConsumerConfig } from '../lib/supabase'

export interface AppContextType {
  currentUser: any
  enabledBusinessModules: BusinessModuleKey[]
  hasModule: (moduleKey: BusinessModuleKey) => boolean
  consumerTemplate: ConsumerTemplateKey
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
  const { enabledBusinessModules, hasModule, reloadBusinessModules } = useWorkspace()
  const { consumerTemplate, consumerApps, primaryConsumerApp, consumerConfig, consumerExperience, setConsumerTemplate, setConsumerConfig } = useConsumer()

  return {
    currentUser,
    enabledBusinessModules,
    hasModule,
    consumerTemplate,
    consumerApps,
    primaryConsumerApp,
    consumerConfig,
    consumerExperience,
    setConsumerTemplate,
    setConsumerConfig,
    reloadBusinessModules,
  }
}
