import { createContext, useContext, useState, ReactNode } from 'react'
import { ROLES } from '../data/mock'

type RoleType = keyof typeof ROLES

interface AppContextType {
  currentRole: RoleType
  currentUser: typeof ROLES[RoleType]
  switchRole: (role: RoleType) => void
  showRoleSwitcher: boolean
  setShowRoleSwitcher: (show: boolean) => void
}

const AppContext = createContext<AppContextType | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentRole, setCurrentRole] = useState<RoleType>('creator')
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  const currentUser = ROLES[currentRole]

  const switchRole = (role: RoleType) => {
    setCurrentRole(role)
    setShowRoleSwitcher(false)
  }

  return (
    <AppContext.Provider value={{
      currentRole,
      currentUser,
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
