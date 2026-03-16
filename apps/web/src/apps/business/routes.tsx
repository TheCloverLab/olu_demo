import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import BusinessLayout from './layout/BusinessLayout'
import BusinessWorkspace from './pages/BusinessWorkspace'
import RoleProtected from '../../components/auth/RoleProtected'

// Lazy-loaded pages
const Team = lazy(() => import('./pages/Team'))
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'))
const ProjectList = lazy(() => import('./pages/ProjectList'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const QuickChat = lazy(() => import('./pages/QuickChat'))
const BusinessAccount = lazy(() => import('./pages/BusinessAccount'))
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const CreatorConsole = lazy(() => import('./pages/CreatorConsole'))
const AdvertiserConsole = lazy(() => import('./pages/AdvertiserConsole'))
const SupplierConsole = lazy(() => import('./pages/SupplierConsole'))
const TaskCenter = lazy(() => import('./pages/TaskCenter'))
const ApprovalCenter = lazy(() => import('./pages/ApprovalCenter'))
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'))
const AppManagement = lazy(() => import('./pages/AppManagement'))
const ExperienceManager = lazy(() => import('./pages/ExperienceManager'))
const ForumEditor = lazy(() => import('./pages/ForumEditor'))
const CourseExperienceEditor = lazy(() => import('./pages/CourseExperienceEditor'))
const ExperienceEditor = lazy(() => import('./pages/ExperienceEditor'))
const ProductManager = lazy(() => import('./pages/ProductManager'))
const SpecialistMarketplace = lazy(() => import('./pages/SpecialistMarketplace'))
const SupportCenter = lazy(() => import('./pages/SupportCenter'))
const HomeEditor = lazy(() => import('./pages/HomeEditor'))
const MembersPage = lazy(() => import('./pages/MembersPage'))
const Connectors = lazy(() => import('./pages/Connectors'))
const Analytics = lazy(() => import('./pages/Analytics'))
const CreatorStudio = lazy(() => import('./pages/CreatorStudio'))
const CourseEditor = lazy(() => import('./pages/CourseEditor'))

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
}

export const businessRoutes: RouteObject[] = [
  {
    path: '/business',
    element: <RoleProtected><BusinessLayout /></RoleProtected>,
    children: [
      { index: true, element: <Navigate to="/business/chat" replace /> },
      { path: 'analytics', element: <L><Analytics /></L> },
      { path: 'projects', element: <L><ProjectList /></L> },
      { path: 'projects/:id', element: <L><ProjectDetail /></L> },
      { path: 'chat', element: <L><QuickChat /></L> },
      { path: 'chat/:convId', element: <L><QuickChat /></L> },
      { path: 'team', element: <L><Team /></L> },
      { path: 'team/group-chat/:chatId', element: <L><GroupChatPage /></L> },
      { path: 'team/:agentId', element: <Navigate to="/business/team" replace /> },
      { path: 'team/humans', element: <Navigate to="/business/team" replace /> },
      { path: 'team/person/:employeeId', element: <L><EmployeeProfile /></L> },
      { path: 'agents', element: <Navigate to="/business/specialists" replace /> },
      { path: 'apps', element: <RoleProtected requiredModule="creator_ops"><L><AppManagement /></L></RoleProtected> },
      { path: 'experiences', element: <L><ExperienceManager /></L> },
      { path: 'experiences/forum', element: <L><ForumEditor /></L> },
      { path: 'experiences/courses', element: <L><CourseExperienceEditor /></L> },
      { path: 'experiences/edit', element: <L><ExperienceEditor /></L> },
      { path: 'products', element: <L><ProductManager /></L> },
      { path: 'specialists', element: <L><SpecialistMarketplace /></L> },
      { path: 'support', element: <L><SupportCenter /></L> },
      { path: 'home-editor', element: <L><HomeEditor /></L> },
      { path: 'members', element: <L><MembersPage /></L> },
      { path: 'connectors', element: <L><Connectors /></L> },
      { path: 'tasks', element: <L><TaskCenter /></L> },
      { path: 'approvals', element: <L><ApprovalCenter /></L> },
      { path: 'account', element: <L><BusinessAccount /></L> },
      { path: 'settings', element: <L><BusinessSettings /></L> },
      { path: 'wallet', element: <L><WalletPage /></L> },
      { path: 'creator-studio', element: <RoleProtected requiredModule="creator_ops"><L><CreatorStudio /></L></RoleProtected> },
      { path: 'course-editor', element: <RoleProtected requiredModule="creator_ops"><L><CourseEditor /></L></RoleProtected> },
      { path: 'modules/creator', element: <RoleProtected requiredModule="creator_ops"><L><CreatorConsole /></L></RoleProtected> },
      { path: 'modules/marketing', element: <RoleProtected requiredModule="marketing"><L><AdvertiserConsole /></L></RoleProtected> },
      { path: 'modules/supply', element: <RoleProtected requiredModule="supply_chain"><L><SupplierConsole /></L></RoleProtected> },
    ],
  },
]
