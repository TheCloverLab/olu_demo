import type { RouteObject } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Home from './pages/Home'
import AppLanding from './pages/AppLanding'
import PublicProfile from './pages/PublicProfile'
import ContentDetail from './pages/ContentDetail'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Shop from './pages/Shop'
import Topics from './pages/Topics'
import Membership from './pages/Membership'
import Courses from './pages/Courses'
import Discover from './pages/Discover'
import CourseCatalog from './pages/CourseCatalog'
import Learn from './pages/Learn'
import Checkout from './pages/Checkout'
import LearningHub from './pages/LearningHub'
import Settings from '../../pages/Settings'
import RoleProtected from '../../components/auth/RoleProtected'

export const consumerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Home /> },
      { path: 'discover', element: <Discover /> },
      { path: 'communities/:id', element: <AppLanding /> },
      { path: 'creator/:id', element: <PublicProfile /> },
      { path: 'people/:id', element: <PublicProfile /> },
      { path: 'content/:id', element: <ContentDetail /> },
      { path: 'chat', element: <Chat /> },
      { path: 'topics', element: <Topics /> },
      { path: 'topics/:topicId', element: <Topics /> },
      { path: 'membership', element: <Membership /> },
      { path: 'courses', element: <Courses /> },
      { path: 'courses/:courseSlug', element: <Courses /> },
      { path: 'courses/:courseSlug/catalog', element: <CourseCatalog /> },
      { path: 'learn/:courseSlug/:sectionId', element: <Learn /> },
      { path: 'checkout/:courseSlug', element: <Checkout /> },
      { path: 'learning', element: <LearningHub /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'shop', element: <Shop /> },
    ],
  },
]
