import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, ChevronLeft, Grid3X3, Heart, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import type { GalleryAlbum, GalleryImage } from '@olu/shared/types/consumer'

const MOCK_ALBUMS: GalleryAlbum[] = [
  { id: 'album-1', creator_id: '1', title: 'Neon City Collection', description: 'Cyberpunk-inspired digital art series', cover_img: '', image_count: 12, created_at: '2025-12-01' },
  { id: 'album-2', creator_id: '1', title: 'Behind the Scenes', description: 'Studio shots and process videos', cover_img: '', image_count: 8, created_at: '2025-11-15' },
  { id: 'album-3', creator_id: '1', title: 'Fan Submissions', description: 'Community-submitted artwork', cover_img: '', image_count: 24, created_at: '2025-10-20' },
]

const GRADIENTS = [
  'from-rose-600 via-fuchsia-600 to-orange-500',
  'from-violet-600 via-purple-600 to-indigo-500',
  'from-cyan-600 via-teal-500 to-emerald-400',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-blue-600 via-sky-500 to-cyan-400',
  'from-pink-600 via-fuchsia-500 to-purple-500',
  'from-emerald-600 via-teal-500 to-cyan-400',
  'from-indigo-600 via-violet-500 to-purple-400',
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

const MOCK_IMAGES: GalleryImage[] = Array.from({ length: 16 }, (_, i) => ({
  id: `img-${i + 1}`,
  creator_id: '1',
  album_id: MOCK_ALBUMS[i % 3].id,
  url: '',
  caption: [
    'Neon alley at midnight',
    'Rooftop rain vibes',
    'Studio session with the crew',
    'Work in progress — new drop soon',
    'Fan art spotlight',
    'Color study #42',
    'Behind the brush',
    'Weekend sketch dump',
  ][i % 8],
  tags: ['art', 'digital', 'neon'].slice(0, (i % 3) + 1),
  likes: Math.floor(Math.random() * 200) + 10,
  created_at: '2025-12-01',
}))

type ViewMode = 'all' | 'albums'

export default function Gallery() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  const displayImages = selectedAlbum
    ? MOCK_IMAGES.filter((img) => img.album_id === selectedAlbum.id)
    : MOCK_IMAGES

  function toggleLike(imageId: string) {
    setLikedImages((prev) => {
      const next = new Set(prev)
      if (next.has(imageId)) next.delete(imageId)
      else next.add(imageId)
      return next
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center">
          <Camera size={18} />
        </div>
        <div className="flex-1">
          <h1 className="font-black text-2xl">{t('consumer.gallery')}</h1>
          <p className="text-olu-muted text-sm">{t('consumer.gallerySubtitle')}</p>
        </div>
      </div>

      {selectedAlbum ? (
        <>
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-olu-muted hover:text-olu-text text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            {t('consumer.albums')}
          </button>
          <div className="rounded-2xl border border-olu-border bg-olu-surface p-5 mb-6">
            <h2 className="font-bold text-lg">{selectedAlbum.title}</h2>
            {selectedAlbum.description && (
              <p className="text-olu-muted text-sm mt-1">{selectedAlbum.description}</p>
            )}
            <p className="text-olu-muted text-xs mt-2">
              {t('consumer.photoCount', { count: displayImages.length })}
            </p>
          </div>
        </>
      ) : (
        <div className="flex gap-1 p-1 bg-olu-card rounded-xl mb-6">
          {([['all', t('consumer.allPhotos')], ['albums', t('consumer.albums')]] as [ViewMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                viewMode === key ? 'bg-olu-surface text-olu-text' : 'text-olu-muted hover:text-olu-text',
              )}
            >
              {key === 'albums' ? <Grid3X3 size={13} /> : <Camera size={13} />}
              {label}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'albums' && !selectedAlbum ? (
        <div className="grid md:grid-cols-3 gap-4">
          {MOCK_ALBUMS.map((album) => (
            <button
              key={album.id}
              onClick={() => { setSelectedAlbum(album); setViewMode('all') }}
              className="rounded-2xl border border-olu-border bg-olu-surface overflow-hidden text-left hover:-translate-y-0.5 transition-all"
            >
              <div className={`h-32 bg-gradient-to-br ${pickGradient(album.id)} flex items-center justify-center`}>
                <Grid3X3 size={28} className="text-white/30" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm">{album.title}</p>
                <p className="text-olu-muted text-xs mt-1">{album.description}</p>
                <p className="text-olu-muted text-xs mt-2">
                  {t('consumer.photoCount', { count: album.image_count })}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          {displayImages.length === 0 ? (
            <div className="text-center py-16 text-olu-muted text-sm">
              {t('consumer.noPhotosYet')}
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {displayImages.map((image, index) => {
                const height = [160, 200, 240, 180, 220][index % 5]
                return (
                  <motion.button
                    key={image.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLightboxIndex(index)}
                    className="w-full rounded-2xl overflow-hidden border border-olu-border bg-olu-surface break-inside-avoid block"
                  >
                    <div
                      className={`bg-gradient-to-br ${pickGradient(image.id)} flex items-center justify-center relative group`}
                      style={{ height }}
                    >
                      <Camera size={20} className="text-white/20" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Heart size={12} />
                          {image.likes + (likedImages.has(image.id) ? 1 : 0)}
                        </div>
                      </div>
                    </div>
                    {image.caption && (
                      <div className="p-3">
                        <p className="text-xs text-olu-muted line-clamp-2">{image.caption}</p>
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X size={20} className="text-white" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`rounded-2xl bg-gradient-to-br ${pickGradient(displayImages[lightboxIndex].id)} h-80 md:h-[28rem] flex items-center justify-center`}>
                <Camera size={48} className="text-white/20" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{displayImages[lightboxIndex].caption}</p>
                  <div className="flex gap-2 mt-2">
                    {displayImages[lightboxIndex].tags.map((tag) => (
                      <span key={tag} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(displayImages[lightboxIndex].id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all',
                    likedImages.has(displayImages[lightboxIndex].id)
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'bg-white/10 text-white/70 hover:text-pink-400',
                  )}
                >
                  <Heart size={16} fill={likedImages.has(displayImages[lightboxIndex].id) ? 'currentColor' : 'none'} />
                  {displayImages[lightboxIndex].likes + (likedImages.has(displayImages[lightboxIndex].id) ? 1 : 0)}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                  disabled={lightboxIndex === 0}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-white/50 text-xs flex-1 text-center">
                  {lightboxIndex + 1} / {displayImages.length}
                </span>
                <button
                  onClick={() => setLightboxIndex(Math.min(displayImages.length - 1, lightboxIndex + 1))}
                  disabled={lightboxIndex === displayImages.length - 1}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
