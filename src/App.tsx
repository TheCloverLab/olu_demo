import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import BusinessLayout from './components/layout/BusinessLayout'
import Home from './pages/Home'
import BusinessAccount from './pages/BusinessAccount'
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
import WalletPage from './pages/WalletPage'
import AIAgentConfig from './pages/AIAgentConfig'
import CreatorConsole from './pages/CreatorConsole'
import AdvertiserConsole from './pages/AdvertiserConsole'
import SupplierConsole from './pages/SupplierConsole'
import Shop from './pages/Shop'
import BusinessWorkspace from './pages/BusinessWorkspace'
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
      { path: 'account', element: <BusinessAccount /> },
      { path: 'settings', element: <Settings /> },
      { path: 'shop', element: <Shop /> },
    ],
  },
  {
    path: '/business',
    element: <RoleProtected><BusinessLayout /></RoleProtected>,
    children: [
      { index: true, element: <BusinessWorkspace /> },
      { path: 'team', element: <Team /> },
      { path: 'team/:agentId', element: <TeamChat /> },
      { path: 'agents', element: <AIAgentConfig /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'wallet', element: <RoleProtected requiredRole="creator"><WalletPage /></RoleProtected> },
      { path: 'modules/creator', element: <RoleProtected requiredRole="creator"><CreatorConsole /></RoleProtected> },
      { path: 'modules/marketing', element: <RoleProtected requiredRole="advertiser"><AdvertiserConsole /></RoleProtected> },
      { path: 'modules/supply', element: <RoleProtected requiredRole="supplier"><SupplierConsole /></RoleProtected> },
    ],
  },
  { path: '/team', element: <Navigate to="/business/team" replace /> },
  { path: '/team/:agentId', element: <Navigate to="/business/team" replace /> },
  { path: '/ai-config', element: <Navigate to="/business/agents" replace /> },
  { path: '/wallet', element: <Navigate to="/business/wallet" replace /> },
  { path: '/console/creator', element: <Navigate to="/business/modules/creator" replace /> },
  { path: '/console/advertiser', element: <Navigate to="/business/modules/marketing" replace /> },
  { path: '/console/supplier', element: <Navigate to="/business/modules/supply" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
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
