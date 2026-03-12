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
import ExperienceManager from './pages/ExperienceManager'
import ForumEditor from './pages/ForumEditor'
import CourseExperienceEditor from './pages/CourseExperienceEditor'
import ExperienceEditor from './pages/ExperienceEditor'
import ProductManager from './pages/ProductManager'
import SupportCenter from './pages/SupportCenter'
import HomeEditor from './pages/HomeEditor'
import MembersPage from './pages/MembersPage'
import Connectors from './pages/Connectors'
import CreatorStudio from './pages/CreatorStudio'
import CourseEditor from './pages/CourseEditor'
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
      { path: 'experiences', element: <ExperienceManager /> },
      { path: 'experiences/forum', element: <ForumEditor /> },
      { path: 'experiences/courses', element: <CourseExperienceEditor /> },
      { path: 'experiences/edit', element: <ExperienceEditor /> },
      { path: 'products', element: <ProductManager /> },
      { path: 'support', element: <SupportCenter /> },
      { path: 'home-editor', element: <HomeEditor /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'connectors', element: <Connectors /> },
      { path: 'tasks', element: <TaskCenter /> },
      { path: 'approvals', element: <ApprovalCenter /> },
      { path: 'account', element: <BusinessAccount /> },
      { path: 'settings', element: <BusinessSettings /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'creator-studio', element: <RoleProtected requiredModule="creator_ops"><CreatorStudio /></RoleProtected> },
      { path: 'course-editor', element: <RoleProtected requiredModule="creator_ops"><CourseEditor /></RoleProtected> },
      { path: 'modules/creator', element: <RoleProtected requiredModule="creator_ops"><CreatorConsole /></RoleProtected> },
      { path: 'modules/marketing', element: <RoleProtected requiredModule="marketing"><AdvertiserConsole /></RoleProtected> },
      { path: 'modules/supply', element: <RoleProtected requiredModule="supply_chain"><SupplierConsole /></RoleProtected> },
    ],
  },
]
