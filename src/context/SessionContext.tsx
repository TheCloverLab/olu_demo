import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface SessionUser {
  id: string
  name: string
  handle: string
  role: string
  roles: string[]
  initials: string
  avatar_color: string
  followers: number
  following: number
  posts: number
  verified: boolean
  [key: string]: any
}

const GUEST_USER: SessionUser = {
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

interface SessionContextType {
  currentUser: SessionUser
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const currentUser = authUser || GUEST_USER

  return (
    <SessionContext.Provider value={{ currentUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
