import type { RouteObject } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Home from './pages/Home'
import AppLanding from './pages/AppLanding'
import PublicProfile from './pages/PublicProfile'
import ContentDetail from './pages/ContentDetail'
import Chat from './pages/Chat'
import UserCenter from './pages/UserCenter'
import Shop from './pages/Shop'
import Topics from './pages/Topics'
import Membership from './pages/Membership'
import Courses from './pages/Courses'
import Discover from './pages/Discover'
import CourseCatalog from './pages/CourseCatalog'
import Learn from './pages/Learn'
import Checkout from './pages/Checkout'
import LearningHub from './pages/LearningHub'
import Subscriptions from './pages/Subscriptions'
import Wallet from './pages/Wallet'
import Gallery from './pages/Gallery'
import Feed from './pages/Feed'
import WorkspaceHome from './pages/WorkspaceHome'
import ForumView from './pages/ForumView'
import CourseView from './pages/CourseView'
import GroupChatView from './pages/GroupChatView'
import ProductDetail from './pages/ProductDetail'
import Settings from '../../pages/Settings'
import RoleProtected from '../../components/auth/RoleProtected'

export const consumerRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RoleProtected><AppLayout /></RoleProtected>,
    children: [
      { index: true, element: <Home /> },
      { path: 'discover', element: <Discover /> },
      { path: 'w/:workspaceSlug', element: <WorkspaceHome /> },
      { path: 'forum/:experienceId', element: <ForumView /> },
      { path: 'course/:experienceId', element: <CourseView /> },
      { path: 'group-chat/:experienceId', element: <GroupChatView /> },
      { path: 'w/:workspaceSlug/product/:productId', element: <ProductDetail /> },
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
      { path: 'checkout/:productSlug', element: <Checkout /> },
      { path: 'learning', element: <LearningHub /> },
      { path: 'profile', element: <UserCenter /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'settings', element: <Settings /> },
      { path: 'shop', element: <Shop /> },
      { path: 'gallery', element: <Gallery /> },
      { path: 'feed', element: <Feed /> },
    ],
  },
]
