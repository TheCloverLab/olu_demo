import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import type { BusinessModuleKey } from '../../lib/supabase'

type RoleProtectedProps = {
  children: ReactNode
  requireAuth?: boolean
  requiredModule?: BusinessModuleKey
  bypassOnboarding?: boolean
  businessOnly?: boolean
}

export default function RoleProtected({
  children,
  requireAuth = true,
  requiredModule,
  bypassOnboarding = false,
  businessOnly = false,
}: RoleProtectedProps) {
  const { user, loading } = useAuth()
  const { enabledBusinessModules, workspaceLoading } = useApp()
  const location = useLocation()

  if (loading) return null

  if (requireAuth && !user) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace state={{ from: returnTo }} />
  }

  // Wait for workspace modules to load before checking business access
  if (workspaceLoading && (businessOnly || requiredModule)) return null

  if (requiredModule && !enabledBusinessModules.includes(requiredModule)) {
    return <Navigate to={location.pathname.startsWith('/business') ? '/business' : '/'} replace />
  }

  if (businessOnly && enabledBusinessModules.length === 0) {
    return <Navigate to="/" replace />
  }

  if (!bypassOnboarding && user && user.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
