import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useSession } from './SessionContext'
import {
  getConsumerTemplateForUser,
  getWorkspaceConsumerConfigForUser,
  updateWorkspaceConsumerConfigForUser,
  updateWorkspaceConsumerTemplateForUser,
} from '../domain/workspace/api'
import type { ConsumerTemplateKey } from '../apps/consumer/templateConfig'
import { isValidTemplateKey, DEFAULT_TEMPLATE } from '../apps/consumer/templateConfig'
import { getConsumerExperience, type ConsumerExperience } from '../domain/consumer/api'
import { getOwnedConsumerApps, getPrimaryConsumerApp } from '../domain/consumer/apps'
import type { ConsumerApp, WorkspaceConsumerConfig } from '../lib/supabase'

interface ConsumerContextType {
  consumerTemplate: ConsumerTemplateKey
  consumerApps: ConsumerApp[]
  primaryConsumerApp: ConsumerApp | null
  consumerConfig: WorkspaceConsumerConfig['config_json']
  consumerExperience: ConsumerExperience
  setConsumerTemplate: (template: ConsumerTemplateKey) => void
  setConsumerConfig: (config: Partial<WorkspaceConsumerConfig['config_json']>) => void
}

const ConsumerCtx = createContext<ConsumerContextType | null>(null)

export function ConsumerProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const { currentUser } = useSession()
  const [consumerApps, setConsumerApps] = useState<ConsumerApp[]>([])
  const [consumerConfig, setConsumerConfigState] = useState<WorkspaceConsumerConfig['config_json']>({})
  const [consumerTemplate, setConsumerTemplateState] = useState<ConsumerTemplateKey>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATE
    const saved = window.localStorage.getItem('olu.consumerTemplate')
    return saved && isValidTemplateKey(saved) ? saved : DEFAULT_TEMPLATE
  })

  useEffect(() => {
    let cancelled = false

    async function sync() {
      if (!authUser) {
        setConsumerApps([])
        setConsumerConfigState({})
        return
      }

      try {
        const [persistedTemplate, apps] = await Promise.all([
          getConsumerTemplateForUser(authUser),
          getOwnedConsumerApps(authUser),
        ])
        const persistedConfig = await getWorkspaceConsumerConfigForUser(authUser)
        if (!cancelled) {
          setConsumerApps(apps)
          setConsumerTemplateState(persistedTemplate)
          setConsumerConfigState(persistedConfig?.config_json || {})
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('olu.consumerTemplate', persistedTemplate)
          }
        }
      } catch (error) {
        console.error('Failed to load consumer state', error)
        if (!cancelled) {
          setConsumerApps([])
          setConsumerConfigState({})
        }
      }
    }

    sync()
    return () => { cancelled = true }
  }, [authUser?.id])

  const setConsumerTemplate = (template: ConsumerTemplateKey) => {
    setConsumerTemplateState(template)
    setConsumerConfigState((current) => ({
      ...current,
      featured_template: template,
    }))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('olu.consumerTemplate', template)
    }
    if (authUser) {
      updateWorkspaceConsumerTemplateForUser(authUser, template).catch((error) => {
        console.error('Failed to persist consumer template', error)
      })
    }
  }

  const setConsumerConfig = (config: Partial<WorkspaceConsumerConfig['config_json']>) => {
    setConsumerConfigState((current) => {
      const next = { ...current, ...config }
      if (authUser) {
        updateWorkspaceConsumerConfigForUser(authUser, {
          config_json: next,
          template_key: consumerTemplate,
        }).catch((error) => {
          console.error('Failed to persist consumer config', error)
        })
      }
      return next
    })
  }

  const primaryConsumerApp = getPrimaryConsumerApp(consumerApps, consumerTemplate)
  const consumerExperience = getConsumerExperience(consumerTemplate, currentUser.name, consumerConfig)

  return (
    <ConsumerCtx.Provider value={{
      consumerTemplate,
      consumerApps,
      primaryConsumerApp,
      consumerConfig,
      consumerExperience,
      setConsumerTemplate,
      setConsumerConfig,
    }}>
      {children}
    </ConsumerCtx.Provider>
  )
}

export function useConsumer() {
  const ctx = useContext(ConsumerCtx)
  if (!ctx) throw new Error('useConsumer must be used within ConsumerProvider')
  return ctx
}
