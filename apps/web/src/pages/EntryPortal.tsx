import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, Users } from 'lucide-react'

export default function EntryPortal() {
  return (
    <div className="min-h-screen bg-olu-bg text-olu-text px-4 py-10 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-olu-muted mb-4">OLU</p>
          <h1 className="font-black text-4xl md:text-6xl leading-tight">
            Two entrances, one product stack.
          </h1>
          <p className="text-olu-muted text-base md:text-lg mt-4 leading-relaxed">
            The consumer app remains a native audience surface. The business workspace becomes the modular operating system for merchants, teams, and AI employees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/" className="glass rounded-3xl p-8 group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
              <Users size={22} />
            </div>
            <h2 className="font-black text-2xl">Consumer App</h2>
            <p className="text-olu-muted text-sm mt-3 leading-relaxed">
              Community, content, chat, and storefront surfaces for fans and end users.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold mt-6">
              Open `/`
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link to="/business" className="glass rounded-3xl p-8 group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mb-5">
              <Briefcase size={22} />
            </div>
            <h2 className="font-black text-2xl">Business Workspace</h2>
            <p className="text-olu-muted text-sm mt-3 leading-relaxed">
              Module-first operating surface for creator ops, influencer marketing, supply chain, and AI teamwork.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold mt-6">
              Open `/business`
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
