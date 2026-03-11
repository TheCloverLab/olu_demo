import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getEnabledBusinessModulesForUser } from '../domain/workspace/api'
import type { BusinessModuleKey } from '../lib/supabase'

interface WorkspaceContextType {
  enabledBusinessModules: BusinessModuleKey[]
  workspaceLoading: boolean
  hasModule: (moduleKey: BusinessModuleKey) => boolean
  reloadBusinessModules: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [enabledBusinessModules, setEnabledBusinessModules] = useState<BusinessModuleKey[]>([])
  const [workspaceLoading, setWorkspaceLoading] = useState(true)

  async function loadWorkspaceModules() {
    if (!authUser) {
      setEnabledBusinessModules([])
      setWorkspaceLoading(false)
      return
    }

    try {
      const modules = await getEnabledBusinessModulesForUser(authUser)
      setEnabledBusinessModules(modules)
    } catch (error) {
      console.error('Failed to load workspace modules', error)
      setEnabledBusinessModules(['creator_ops', 'marketing', 'supply_chain'])
    } finally {
      setWorkspaceLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setWorkspaceLoading(true)

    async function sync() {
      if (!authUser) {
        setEnabledBusinessModules([])
        if (!cancelled) setWorkspaceLoading(false)
        return
      }

      try {
        const modules = await getEnabledBusinessModulesForUser(authUser)
        if (!cancelled) setEnabledBusinessModules(modules)
      } catch (error) {
        console.error('Failed to load workspace modules', error)
        if (!cancelled) setEnabledBusinessModules(['creator_ops', 'marketing', 'supply_chain'])
      } finally {
        if (!cancelled) setWorkspaceLoading(false)
      }
    }

    sync()
    return () => { cancelled = true }
  }, [authUser?.id])

  const hasModule = (moduleKey: BusinessModuleKey) => enabledBusinessModules.includes(moduleKey)

  return (
    <WorkspaceContext.Provider value={{
      enabledBusinessModules,
      workspaceLoading,
      hasModule,
      reloadBusinessModules: loadWorkspaceModules,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
