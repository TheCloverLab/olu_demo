import type { RouteObject } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Home from './pages/Home'
import CreatorProfile from './pages/CreatorProfile'
import ContentDetail from './pages/ContentDetail'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Shop from './pages/Shop'
import Settings from '../../pages/Settings'
import RoleProtected from '../../components/auth/RoleProtected'

export const consumerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Home /> },
      { path: 'creator/:id', element: <CreatorProfile /> },
      { path: 'content/:id', element: <ContentDetail /> },
      { path: 'chat', element: <Chat /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'shop', element: <Shop /> },
    ],
  },
]
