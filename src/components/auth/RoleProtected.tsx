import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

type AppRole = 'creator' | 'fan' | 'advertiser' | 'supplier'

type RoleProtectedProps = {
  children: ReactNode
  requireAuth?: boolean
  requiredRole?: AppRole
  bypassOnboarding?: boolean
  businessOnly?: boolean
}

export default function RoleProtected({
  children,
  requireAuth = true,
  requiredRole,
  bypassOnboarding = false,
  businessOnly = false,
}: RoleProtectedProps) {
  const { user, loading } = useAuth()
  const { availableRoles, enabledBusinessModules } = useApp()
  const location = useLocation()

  if (loading) return null

  if (requireAuth && !user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (requiredRole && !availableRoles.includes(requiredRole)) {
    return <Navigate to={location.pathname.startsWith('/business') ? '/business' : '/settings'} replace />
  }

  if (businessOnly && enabledBusinessModules.length === 0) {
    return <Navigate to="/" replace />
  }

  if (!bypassOnboarding && user && user.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
