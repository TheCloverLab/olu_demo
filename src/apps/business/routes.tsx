import type { RouteObject } from 'react-router-dom'
import BusinessLayout from './layout/BusinessLayout'
import BusinessWorkspace from './pages/BusinessWorkspace'
import Team from './pages/Team'
import TeamChat from './pages/TeamChat'
import AIAgentConfig from './pages/AIAgentConfig'
import BusinessAccount from './pages/BusinessAccount'
import BusinessSettings from './pages/BusinessSettings'
import WalletPage from './pages/WalletPage'
import CreatorConsole from './pages/CreatorConsole'
import AdvertiserConsole from './pages/AdvertiserConsole'
import SupplierConsole from './pages/SupplierConsole'
import ConsumerExperience from './pages/ConsumerExperience'
import RoleProtected from '../../components/auth/RoleProtected'

export const businessRoutes: RouteObject[] = [
  {
    path: '/business',
    element: <RoleProtected businessOnly><BusinessLayout /></RoleProtected>,
    children: [
      { index: true, element: <BusinessWorkspace /> },
      { path: 'team', element: <Team /> },
      { path: 'team/:agentId', element: <TeamChat /> },
      { path: 'agents', element: <AIAgentConfig /> },
      { path: 'consumer', element: <ConsumerExperience /> },
      { path: 'account', element: <BusinessAccount /> },
      { path: 'settings', element: <BusinessSettings /> },
      { path: 'wallet', element: <RoleProtected requiredRole="creator"><WalletPage /></RoleProtected> },
      { path: 'modules/creator', element: <CreatorConsole /> },
      { path: 'modules/marketing', element: <AdvertiserConsole /> },
      { path: 'modules/supply', element: <SupplierConsole /> },
    ],
  },
]
