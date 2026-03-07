import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { ensureWorkspaceForUser } from '../domain/workspace/api'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(authId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (error) throw error
      setUser(data as User)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signUp(email: string, password: string, userData?: Partial<User>) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError) throw authError

    if (authData.user) {
      const localPart = email.split('@')[0] || 'user'
      const safeBase = localPart.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'
      const suffix = authData.user.id.slice(0, 8)
      const generatedUsername = `${safeBase}_${suffix}`
      const generatedHandle = `@${generatedUsername}`
      const generatedName = userData?.name || localPart
      const generatedInitials = generatedName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'

      // Create user profile
      const { data: createdProfile, error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email,
        username: userData?.username || generatedUsername,
        handle: userData?.handle || generatedHandle,
        name: generatedName,
        role: userData?.role || 'fan',
        roles: userData?.roles || ['fan'],
        initials: userData?.initials || generatedInitials,
        avatar_color: userData?.avatar_color || 'from-blue-500 to-purple-600',
        followers: userData?.followers ?? 0,
        following: userData?.following ?? 0,
        posts: userData?.posts ?? 0,
        verified: userData?.verified ?? false,
        ...userData,
      }).select('*').single()
      if (profileError) throw profileError

      await ensureWorkspaceForUser(createdProfile as User)
    }

    return { needsEmailConfirmation: !authData.session }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
