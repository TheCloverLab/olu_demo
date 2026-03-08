import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  getConsumerTemplateForUser,
  getEnabledBusinessModulesForUser,
  getWorkspaceConsumerConfigForUser,
  updateWorkspaceConsumerConfigForUser,
  updateWorkspaceConsumerTemplateForUser,
} from '../domain/workspace/api'
import type { ConsumerTemplateKey } from '../apps/consumer/templateConfig'
import { getConsumerExperience, type ConsumerExperience } from '../domain/consumer/api'
import type { WorkspaceConsumerConfig } from '../lib/supabase'

type RoleType = 'creator' | 'fan' | 'advertiser' | 'supplier'
type BusinessModule = 'creator_ops' | 'marketing' | 'supply_chain'

const MODULE_TO_ROLE: Record<BusinessModule, Exclude<RoleType, 'fan'>> = {
  creator_ops: 'creator',
  marketing: 'advertiser',
  supply_chain: 'supplier',
}

interface AppContextType {
  currentRole: RoleType
  currentUser: any
  availableRoles: RoleType[]
  enabledBusinessModules: BusinessModule[]
  consumerTemplate: ConsumerTemplateKey
  consumerConfig: WorkspaceConsumerConfig['config_json']
  consumerExperience: ConsumerExperience
  setConsumerTemplate: (template: ConsumerTemplateKey) => void
  setConsumerConfig: (config: Partial<WorkspaceConsumerConfig['config_json']>) => void
  reloadBusinessModules: () => Promise<void>
  switchRole: (role: RoleType) => void
  showRoleSwitcher: boolean
  setShowRoleSwitcher: (show: boolean) => void
}

const AppContext = createContext<AppContextType | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const { user: authUser } = useAuth()
  const [currentRole, setCurrentRole] = useState<RoleType>('fan')
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const [enabledBusinessModules, setEnabledBusinessModules] = useState<BusinessModule[]>([])
  const [consumerConfig, setConsumerConfigState] = useState<WorkspaceConsumerConfig['config_json']>({})
  const [consumerTemplate, setConsumerTemplateState] = useState<ConsumerTemplateKey>(() => {
    if (typeof window === 'undefined') return 'fan_community'
    const saved = window.localStorage.getItem('olu.consumerTemplate')
    return saved === 'sell_courses' ? 'sell_courses' : 'fan_community'
  })

  // Get available roles from authenticated user or default to all roles
  const availableRoles: RoleType[] = authUser?.roles || ['fan']
  // Set initial role when user logs in
  useEffect(() => {
    if (authUser?.roles && authUser.roles.length > 0) {
      setCurrentRole(authUser.roles[0])
    }
  }, [authUser])

  useEffect(() => {
    const enabledCapabilityRoles = enabledBusinessModules.map((module) => MODULE_TO_ROLE[module])
    if (enabledCapabilityRoles.length === 0) return

    if (currentRole === 'fan' || !enabledCapabilityRoles.includes(currentRole as Exclude<RoleType, 'fan'>)) {
      setCurrentRole(enabledCapabilityRoles[0])
    }
  }, [enabledBusinessModules, currentRole])

  async function loadWorkspaceModules() {
    if (!authUser) {
      setEnabledBusinessModules([])
      return
    }

    try {
      const modules = await getEnabledBusinessModulesForUser(authUser)
      setEnabledBusinessModules(modules)
    } catch (error) {
      console.error('Failed to load workspace modules', error)
      setEnabledBusinessModules(['creator_ops', 'marketing', 'supply_chain'])
    }
  }

  useEffect(() => {
    let cancelled = false

    async function syncWorkspaceState() {
      if (!authUser) {
        setEnabledBusinessModules([])
        return
      }

      try {
        const [modules, persistedTemplate] = await Promise.all([
          getEnabledBusinessModulesForUser(authUser),
          getConsumerTemplateForUser(authUser),
        ])
        const persistedConfig = await getWorkspaceConsumerConfigForUser(authUser)
        if (!cancelled) {
          setEnabledBusinessModules(modules)
          setConsumerTemplateState(persistedTemplate)
          setConsumerConfigState(persistedConfig?.config_json || {})
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('olu.consumerTemplate', persistedTemplate)
          }
        }
      } catch (error) {
        console.error('Failed to load workspace modules', error)
        if (!cancelled) {
          setEnabledBusinessModules(['creator_ops', 'marketing', 'supply_chain'])
          setConsumerConfigState({})
        }
      }
    }

    syncWorkspaceState()

    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  const currentUser = authUser || {
    id: 'guest',
    name: 'Guest',
    handle: '@guest',
    role: 'fan',
    roles: ['fan'],
    initials: 'G',
    avatar_color: 'from-gray-600 to-gray-500',
    followers: 0,
    following: 0,
    posts: 0,
    verified: false,
  }

  const switchRole = (role: RoleType) => {
    const enabledCapabilityRoles = enabledBusinessModules.map((module) => MODULE_TO_ROLE[module])
    if (role === 'fan' ? availableRoles.includes(role) : enabledCapabilityRoles.includes(role as Exclude<RoleType, 'fan'>) || availableRoles.includes(role)) {
      setCurrentRole(role)
      setShowRoleSwitcher(false)
    }
  }

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

  const consumerExperience = getConsumerExperience(consumerTemplate, currentUser.name, consumerConfig)

  return (
    <AppContext.Provider value={{
      currentRole,
      currentUser,
      availableRoles,
      enabledBusinessModules,
      consumerTemplate,
      consumerConfig,
      consumerExperience,
      setConsumerTemplate,
      setConsumerConfig,
      reloadBusinessModules: loadWorkspaceModules,
      switchRole,
      showRoleSwitcher,
      setShowRoleSwitcher,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
