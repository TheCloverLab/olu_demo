import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Discover from './pages/Discover'
import RoleProtected from '../../components/auth/RoleProtected'

// Lazy-loaded pages
const WorkspaceHome = lazy(() => import('./pages/WorkspaceHome'))
const ForumView = lazy(() => import('./pages/ForumView'))
const CourseView = lazy(() => import('./pages/CourseView'))
const GroupChatView = lazy(() => import('./pages/GroupChatView'))
const VideoView = lazy(() => import('./pages/VideoView'))
const SupportChat = lazy(() => import('./pages/SupportChat'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Settings = lazy(() => import('../../pages/Settings'))

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>
}

export const consumerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Navigate to="/discover" replace /> },
      { path: 'discover', element: <Discover /> },
      { path: 'w/:workspaceSlug', element: <L><WorkspaceHome /></L> },
      { path: 'forum/:experienceId', element: <L><ForumView /></L> },
      { path: 'course/:experienceId', element: <L><CourseView /></L> },
      { path: 'group-chat/:experienceId', element: <L><GroupChatView /></L> },
      { path: 'video/:experienceId', element: <L><VideoView /></L> },
      { path: 'w/:workspaceSlug/support', element: <L><SupportChat /></L> },
      { path: 'w/:workspaceSlug/product/:productId', element: <L><ProductDetail /></L> },
      { path: 'people/:id', element: <L><PublicProfile /></L> },
      { path: 'profile', element: <L><PublicProfile /></L> },
      { path: 'wallet', element: <L><Wallet /></L> },
      { path: 'settings', element: <L><Settings /></L> },
    ],
  },
]
