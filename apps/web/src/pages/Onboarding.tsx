import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [handle, setHandle] = useState((user?.handle || '').replace(/^@/, ''))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

    if (!trimmedName || !normalizedHandle) {
      setError('Please enter a display name and handle.')
      return
    }

    if (!user?.id) {
      setError('User session not found. Please sign in again.')
      return
    }

    setSaving(true)

    const initials = trimmedName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

    let avatarUrl: string | null = null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg'
      const path = `${user.auth_id || user.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      })

      if (uploadError) {
        setSaving(false)
        setError(uploadError.message)
        return
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = publicData.publicUrl
    }

    const updates: any = {
      name: trimmedName,
      handle: `@${normalizedHandle}`,
      initials,
      onboarding_completed: true,
    }

    if (avatarUrl) updates.avatar_img = avatarUrl

    const { error: updateError } = await supabase.from('users').update(updates).eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-olu-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md glass rounded-2xl p-6">
        <h1 className="text-2xl font-black mb-1">Complete your profile</h1>
        <p className="text-olu-muted text-sm mb-6">One quick step before you start.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--olu-input-focus)]"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Handle</label>
            <div className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm flex items-center">
              <span className="text-olu-muted mr-1">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none"
                placeholder="your_handle"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Avatar (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-white text-black font-semibold py-2.5 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
