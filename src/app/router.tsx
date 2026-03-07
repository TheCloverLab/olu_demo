import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Onboarding from '../pages/Onboarding'
import RoleProtected from '../components/auth/RoleProtected'
import { consumerRoutes } from '../apps/consumer/routes'
import { businessRoutes } from '../apps/business/routes'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/onboarding',
    element: <RoleProtected bypassOnboarding><Onboarding /></RoleProtected>,
  },
  ...consumerRoutes,
  ...businessRoutes,
  { path: '/team', element: <Navigate to="/business/team" replace /> },
  { path: '/team/:agentId', element: <Navigate to="/business/team" replace /> },
  { path: '/ai-config', element: <Navigate to="/business/agents" replace /> },
  { path: '/wallet', element: <Navigate to="/business/wallet" replace /> },
  { path: '/console/creator', element: <Navigate to="/business/modules/creator" replace /> },
  { path: '/console/advertiser', element: <Navigate to="/business/modules/marketing" replace /> },
  { path: '/console/supplier', element: <Navigate to="/business/modules/supply" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
