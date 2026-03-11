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
import TaskCenter from './pages/TaskCenter'
import ApprovalCenter from './pages/ApprovalCenter'
import { Navigate } from 'react-router-dom'
import EmployeeProfile from './pages/EmployeeProfile'
import AppManagement from './pages/AppManagement'
import Connectors from './pages/Connectors'
import RoleProtected from '../../components/auth/RoleProtected'

export const businessRoutes: RouteObject[] = [
  {
    path: '/business',
    element: <RoleProtected><BusinessLayout /></RoleProtected>,
    children: [
      { index: true, element: <BusinessWorkspace /> },
      { path: 'team', element: <Team /> },
      { path: 'team/:agentId', element: <TeamChat /> },
      { path: 'team/humans', element: <Navigate to="/business/team" replace /> },
      { path: 'team/person/:employeeId', element: <EmployeeProfile /> },
      { path: 'agents', element: <AIAgentConfig /> },
      { path: 'apps', element: <RoleProtected requiredModule="creator_ops"><AppManagement /></RoleProtected> },
      { path: 'connectors', element: <Connectors /> },
      { path: 'tasks', element: <TaskCenter /> },
      { path: 'approvals', element: <ApprovalCenter /> },
      { path: 'account', element: <BusinessAccount /> },
      { path: 'settings', element: <BusinessSettings /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'modules/creator', element: <RoleProtected requiredModule="creator_ops"><CreatorConsole /></RoleProtected> },
      { path: 'modules/marketing', element: <RoleProtected requiredModule="marketing"><AdvertiserConsole /></RoleProtected> },
      { path: 'modules/supply', element: <RoleProtected requiredModule="supply_chain"><SupplierConsole /></RoleProtected> },
    ],
  },
]
