import { useEffect, useState } from 'react'
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { Home, Users, MessageCircle, User, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { resolveConsumerAppBySlug } from '../../../domain/consumer/apps'

export type StandaloneAppContext = {
  creatorId: string
  appType: 'community' | 'academy'
  title: string
  configJson: Record<string, any> | null
}

export default function StandaloneAppLayout() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [appCtx, setAppCtx] = useState<StandaloneAppContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    resolveConsumerAppBySlug(slug)
      .then((result) => {
        if (result) setAppCtx(result)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#04111f] text-white">
        <p className="text-cyan-100/55 text-sm">Loading app...</p>
      </div>
    )
  }

  if (!appCtx) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#04111f] text-white gap-4">
        <p className="text-cyan-100/55 text-sm">App not found</p>
        <button onClick={() => navigate('/')} className="text-cyan-300 text-sm hover:underline">Go home</button>
      </div>
    )
  }

  const basePath = `/app/${slug}`
  const tabs = [
    { to: basePath, icon: Home, label: 'Home', exact: true },
    { to: `${basePath}/topics`, icon: Users, label: 'Topics' },
    { to: `${basePath}/chat`, icon: MessageCircle, label: 'Chat' },
    { to: `${basePath}/me`, icon: User, label: 'Me' },
  ]

  return (
    <div className="h-screen flex flex-col bg-[#04111f] text-white">
      {/* Minimal header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/10 bg-[#08111d]/95 backdrop-blur flex-shrink-0">
        <button onClick={() => navigate('/discover')} className="p-1 hover:bg-[#0d1a2d] rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-cyan-100/55" />
        </button>
        <p className="font-bold text-sm truncate">{appCtx.title}</p>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <Outlet context={appCtx} />
      </main>

      {/* Bottom tab navigation */}
      <nav className="flex items-center border-t border-cyan-500/10 bg-[#08111d]/95 backdrop-blur flex-shrink-0 safe-area-bottom">
        {tabs.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              isActive ? 'text-cyan-300' : 'text-cyan-100/40'
            )}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
