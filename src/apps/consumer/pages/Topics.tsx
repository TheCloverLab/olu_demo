import { ChevronRight, Flame, MessageCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'

export default function Topics() {
  const navigate = useNavigate()
  const { consumerExperience } = useApp()
  const { topics } = consumerExperience.community

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-300 flex items-center justify-center">
          <Users size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">Topics</h1>
          <p className="text-olu-muted text-sm">{topics.subtitle}</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={15} className="text-orange-300" />
          <p className="font-semibold">Why this page exists</p>
        </div>
        <p className="text-sm text-olu-muted leading-relaxed">
          {topics.whyItExists}
        </p>
      </div>

      <div className="space-y-3">
        {topics.entries.map((topic) => (
          <button
            key={topic.id}
            onClick={() => navigate('/chat')}
            className="w-full rounded-[24px] border border-white/10 bg-[#111111] p-5 text-left hover:bg-[#151515] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-lg">{topic.name}</p>
                <p className="text-xs text-olu-muted mt-1">{topic.members} members</p>
              </div>
              <ChevronRight size={16} className="text-olu-muted" />
            </div>
            <p className="text-sm text-white/72 mt-3 leading-relaxed">{topic.description}</p>
            <div className="inline-flex items-center gap-2 mt-4 text-sm text-sky-300">
              <MessageCircle size={14} />
              Open discussion
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
