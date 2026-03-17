import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { ensureWorkspaceForUser, getEnabledBusinessModulesForUser, getWorkspaceById } from '../domain/workspace/api'
import type { BusinessModuleKey, Workspace } from '../lib/supabase'

const ALL_MODULES: BusinessModuleKey[] = ['creator_ops', 'marketing', 'supply_chain']

interface WorkspaceContextType {
  workspace: Workspace | null
  enabledBusinessModules: BusinessModuleKey[]
  workspaceLoading: boolean
  hasModule: (moduleKey: BusinessModuleKey) => boolean
  reloadBusinessModules: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [enabledBusinessModules, setEnabledBusinessModules] = useState<BusinessModuleKey[]>([])
  const [workspaceLoading, setWorkspaceLoading] = useState(true)

  async function loadWorkspaceModules() {
    if (!authUser) {
      setWorkspace(null)
      setEnabledBusinessModules([])
      setWorkspaceLoading(false)
      return
    }

    try {
      const membership = await ensureWorkspaceForUser(authUser)
      if (membership) {
        const ws = await getWorkspaceById(membership.workspace_id)
        setWorkspace(ws)
      }
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
        setWorkspace(null)
        setEnabledBusinessModules([])
        if (!cancelled) setWorkspaceLoading(false)
        return
      }

      try {
        const membership = await ensureWorkspaceForUser(authUser)
        if (!cancelled && membership) {
          const ws = await getWorkspaceById(membership.workspace_id)
          if (!cancelled) setWorkspace(ws)
        }
        const modules = await getEnabledBusinessModulesForUser(authUser)
        if (!cancelled) setEnabledBusinessModules(modules)
      } catch (error) {
        console.error('Failed to load workspace modules', error)
        if (!cancelled) setEnabledBusinessModules(ALL_MODULES)
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
      workspace,
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
