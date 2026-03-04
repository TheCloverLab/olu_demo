import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import CreatorProfile from './pages/CreatorProfile'
import ContentDetail from './pages/ContentDetail'
import Chat from './pages/Chat'
import Team from './pages/Team'
import TeamChat from './pages/TeamChat'
import Profile from './pages/Profile'
import AIAgentConfig from './pages/AIAgentConfig'
import CreatorConsole from './pages/CreatorConsole'
import AdvertiserConsole from './pages/AdvertiserConsole'
import SupplierConsole from './pages/SupplierConsole'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'creator/:id', element: <CreatorProfile /> },
      { path: 'content/:id', element: <ContentDetail /> },
      { path: 'chat', element: <Chat /> },
      { path: 'team', element: <Team /> },
      { path: 'team/:agentId', element: <TeamChat /> },
      { path: 'profile', element: <Profile /> },
      { path: 'ai-config', element: <AIAgentConfig /> },
      { path: 'console/creator', element: <CreatorConsole /> },
      { path: 'console/advertiser', element: <AdvertiserConsole /> },
      { path: 'console/supplier', element: <SupplierConsole /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}
