import { createContext, useContext, useState } from 'react'
import { ROLES } from '../data/mock'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('creator')
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  const currentUser = ROLES[currentRole]

  const switchRole = (role) => {
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
