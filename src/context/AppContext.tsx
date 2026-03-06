import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

type RoleType = 'creator' | 'fan' | 'advertiser' | 'supplier'

interface AppContextType {
  currentRole: RoleType
  currentUser: any
  availableRoles: RoleType[]
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

  // Get available roles from authenticated user or default to all roles
  const availableRoles: RoleType[] = authUser?.roles || ['fan']

  // Set initial role when user logs in
  useEffect(() => {
    if (authUser?.roles && authUser.roles.length > 0) {
      setCurrentRole(authUser.roles[0])
    }
  }, [authUser])

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
    if (availableRoles.includes(role)) {
      setCurrentRole(role)
      setShowRoleSwitcher(false)
    }
  }

  return (
    <AppContext.Provider value={{
      currentRole,
      currentUser,
      availableRoles,
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
