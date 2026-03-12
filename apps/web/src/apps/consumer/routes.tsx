import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Discover from './pages/Discover'
import WorkspaceHome from './pages/WorkspaceHome'
import ForumView from './pages/ForumView'
import CourseView from './pages/CourseView'
import GroupChatView from './pages/GroupChatView'
import ProductDetail from './pages/ProductDetail'
import PublicProfile from './pages/PublicProfile'
import Wallet from './pages/Wallet'
import Settings from '../../pages/Settings'
import RoleProtected from '../../components/auth/RoleProtected'

export const consumerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Navigate to="/discover" replace /> },
      { path: 'discover', element: <Discover /> },
      { path: 'w/:workspaceSlug', element: <WorkspaceHome /> },
      { path: 'forum/:experienceId', element: <ForumView /> },
      { path: 'course/:experienceId', element: <CourseView /> },
      { path: 'group-chat/:experienceId', element: <GroupChatView /> },
      { path: 'w/:workspaceSlug/product/:productId', element: <ProductDetail /> },
      { path: 'people/:id', element: <PublicProfile /> },
      { path: 'profile', element: <PublicProfile /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]
