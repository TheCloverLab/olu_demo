import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Pencil, Save, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getProfileById, updateProfile } from '../../../domain/profile/api'
import { getWorkspacesByOwner } from '../../../domain/workspace/api'
import { supabase } from '../../../lib/supabase'
import type { User, Workspace } from '../../../lib/supabase'

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function ProfileEditor({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const ownerFolder = user.auth_id || user.id
      let avatarUrl: string | undefined
      let coverUrl: string | undefined

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${ownerFolder}/avatar-${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (error) throw error
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() || 'jpg'
        const path = `${ownerFolder}/cover-${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('covers').upload(path, coverFile, { upsert: true, contentType: coverFile.type })
        if (error) throw error
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      }

      const initials = name.trim().split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'U'
      const updates: Record<string, unknown> = { name: name.trim(), bio: bio.trim() || null, initials }
      if (avatarUrl) updates.avatar_img = avatarUrl
      if (coverUrl) updates.cover_img = coverUrl

      await updateProfile(user.id, updates)

      setMessage(t('consumer.savedRefreshing'))
      setTimeout(() => { onSaved(); window.location.reload() }, 500)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : t('consumer.failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-[24px] border border-olu-border bg-olu-surface p-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">{t('consumer.editProfile')}</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors">
          <X size={16} className="text-olu-muted" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-olu-muted text-xs mb-1">{t('consumer.displayName')}</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-olu-primary/40" />
        </div>
        <div>
          <p className="text-olu-muted text-xs mb-1">{t('consumer.bio')}</p>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-olu-primary/40 resize-none" />
        </div>
        <div>
          <p className="text-olu-muted text-xs mb-1">{t('consumer.avatarOptional')}</p>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black" />
        </div>
        <div>
          <p className="text-olu-muted text-xs mb-1">{t('consumer.coverOptional')}</p>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black" />
        </div>
        {message && <p className={`text-sm ${message.includes('Saved') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-400'}`}>{message}</p>}
        <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-white text-black py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          <Save size={14} />
          {saving ? t('common.saving') : t('consumer.saveProfile')}
        </button>
      </div>
    </section>
  )
}

const CARD_GRADIENTS = [
  'from-cyan-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-sky-600 to-indigo-700',
  'from-teal-600 to-cyan-700',
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length]
}

export default function PublicProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [creator, setCreator] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const isOwn = !!(authUser && creator && authUser.id === creator.id)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      const profileId = id || authUser?.id
      if (!profileId) return

      try {
        const creatorData = await getProfileById(profileId)
        if (cancelled) return
        setCreator(creatorData)

        // Load workspaces owned by this user
        const ws = await getWorkspacesByOwner(profileId)
        if (cancelled) return
        setWorkspaces(ws)
      } catch (error) {
        console.error('Failed to load public profile', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [id, authUser?.id])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">{t('consumer.loadingProfile')}</div>
  }

  if (!creator) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">{t('consumer.profileNotFound')}</div>
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-6">
      <div className="px-4 pt-4 mb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-olu-muted hover:text-olu-text transition-colors text-sm">
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
      </div>

      <div className="px-4">
        <section className="rounded-[28px] border border-olu-border bg-olu-surface p-5">
          <div className="flex items-start gap-4">
            {creator.avatar_img ? (
              <img src={creator.avatar_img} alt={creator.name} className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${creator.avatar_color || 'from-gray-600 to-gray-500'} flex items-center justify-center font-black text-xl text-white flex-shrink-0`}>
                {creator.initials || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-2xl">{creator.name}</h1>
                  {creator.verified && <BadgeCheck size={18} className="text-sky-600 dark:text-sky-400" fill="currentColor" />}
                </div>
                {isOwn && (
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors flex-shrink-0"
                  >
                    <Pencil size={16} className="text-olu-muted" />
                  </button>
                )}
              </div>
              <p className="text-olu-muted text-sm mt-1">{creator.handle}</p>
              <p className="text-sm text-olu-muted mt-3 leading-relaxed">{creator.bio || t('consumer.noBioYet')}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-3 py-2 text-sm">
              <span className="font-semibold">{formatNumber(creator.followers || 0)}</span>
              <span className="ml-2 text-olu-muted">{t('consumer.followers')}</span>
            </div>
            {workspaces.length > 0 && (
              <div className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-3 py-2 text-sm">
                <span className="font-semibold">{workspaces.length}</span>
                <span className="ml-2 text-olu-muted">{workspaces.length === 1 ? 'App' : 'Apps'}</span>
              </div>
            )}
          </div>
        </section>

        {editing && isOwn && (
          <ProfileEditor user={creator} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
        )}

        {workspaces.length > 0 && (
          <section className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-olu-muted px-1">
              {t('nav.apps', 'Apps')}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => navigate(`/w/${ws.slug}`)}
                  className="group relative w-full overflow-hidden rounded-2xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="aspect-[16/9] relative">
                    {ws.icon ? (
                      <img src={ws.icon} alt={ws.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${pickGradient(ws.id)}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-black text-white/30">{ws.name[0]}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-100 transition-colors">{ws.name}</h3>
                    {ws.headline && (
                      <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{ws.headline}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
