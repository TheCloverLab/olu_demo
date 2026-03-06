import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import CreatorProfile from './pages/CreatorProfile'
import ContentDetail from './pages/ContentDetail'
import Chat from './pages/Chat'
import Team from './pages/Team'
import TeamChat from './pages/TeamChat'
import Profile from './pages/Profile'
import AIAgentConfig from './pages/AIAgentConfig'
import CreatorConsole from './pages/CreatorConsole'
import AdvertiserConsole from './pages/AdvertiserConsole'
import SupplierConsole from './pages/SupplierConsole'
import Shop from './pages/Shop'
import RoleProtected from './components/auth/RoleProtected'

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
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Home /> },
      { path: 'creator/:id', element: <CreatorProfile /> },
      { path: 'content/:id', element: <ContentDetail /> },
      { path: 'chat', element: <Chat /> },
      { path: 'team', element: <Team /> },
      { path: 'team/:agentId', element: <TeamChat /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <RoleProtected><Settings /></RoleProtected> },
      { path: 'ai-config', element: <AIAgentConfig /> },
      { path: 'shop', element: <Shop /> },
      { path: 'console/creator', element: <RoleProtected requiredRole="creator"><CreatorConsole /></RoleProtected> },
      { path: 'console/advertiser', element: <RoleProtected requiredRole="advertiser"><AdvertiserConsole /></RoleProtected> },
      { path: 'console/supplier', element: <RoleProtected requiredRole="supplier"><SupplierConsole /></RoleProtected> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AuthProvider>
  )
}
