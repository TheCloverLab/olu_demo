import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, ArrowLeft, Play } from 'lucide-react'
import clsx from 'clsx'
import type { WorkspaceExperience, ExperienceVideoItem } from '../../../lib/supabase'
import { getExperience, getVideoItems, extractYouTubeId } from '../../../domain/experience/api'

export default function VideoView() {
  const { experienceId } = useParams()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [items, setItems] = useState<ExperienceVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    if (!experienceId) return
    Promise.all([getExperience(experienceId), getVideoItems(experienceId)])
      .then(([exp, v]) => {
        setExperience(exp)
        setItems(v)
        if (v.length > 0) {
          const id = extractYouTubeId(v[0].video_url)
          if (id) setActiveVideo(id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [experienceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-black text-xl">{experience?.name || 'Videos'}</h1>
          <p className="text-[var(--olu-muted)] text-xs">{items.length} video{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Cover */}
      {experience?.cover && (
        <div className="h-32 rounded-2xl overflow-hidden">
          <img src={experience.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
          <Play size={24} className="text-[var(--olu-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--olu-muted)]">No videos yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Player */}
          {activeVideo && (
            <div className="rounded-2xl overflow-hidden border border-[var(--olu-card-border)] aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Active video info */}
          {items.map((item) => {
            const ytId = extractYouTubeId(item.video_url)
            if (ytId !== activeVideo) return null
            return (
              <div key={item.id} className="space-y-1">
                <h2 className="font-bold text-lg">{item.title}</h2>
                {item.description && <p className="text-sm text-[var(--olu-text-secondary)]">{item.description}</p>}
              </div>
            )
          })}

          {/* Video list */}
          <div className="space-y-2">
            {items.map((item) => {
              const ytId = extractYouTubeId(item.video_url)
              const isActive = ytId === activeVideo
              return (
                <button
                  key={item.id}
                  onClick={() => ytId && setActiveVideo(ytId)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors',
                    isActive
                      ? 'bg-[var(--olu-accent-bg)] border border-[var(--olu-card-border)]'
                      : 'hover:bg-[var(--olu-card-hover)]'
                  )}
                >
                  <div className="w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 relative bg-black">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/5">
                        <Play size={16} className="text-[var(--olu-muted)]" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                        <Play size={16} className="text-cyan-300" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-medium line-clamp-2', isActive && 'text-cyan-700 dark:text-cyan-300')}>{item.title}</p>
                    {item.description && <p className="text-xs text-[var(--olu-muted)] truncate mt-0.5">{item.description}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
