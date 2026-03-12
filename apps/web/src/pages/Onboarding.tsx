import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, BookOpen, Layers, Box, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

type PresetKey = 'community' | 'academy' | 'hybrid' | 'blank'

const PRESETS: { key: PresetKey; icon: typeof Users; label: string; desc: string; gradient: string }[] = [
  { key: 'community', icon: Users, label: 'Community', desc: 'Forums, group chat, fan engagement', gradient: 'from-purple-500 to-violet-600' },
  { key: 'academy', icon: BookOpen, label: 'Academy', desc: 'Courses, Q&A, structured learning', gradient: 'from-blue-500 to-cyan-600' },
  { key: 'hybrid', icon: Layers, label: 'Hybrid', desc: 'Community + courses + support', gradient: 'from-amber-500 to-orange-600' },
  { key: 'blank', icon: Box, label: 'Blank', desc: 'Start from scratch', gradient: 'from-gray-500 to-gray-600' },
]

export default function Onboarding() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [name, setName] = useState(user?.name || '')
  const [handle, setHandle] = useState((user?.handle || '').replace(/^@/, ''))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null)

  const submitProfile = async (e: FormEvent) => {
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
    }

    if (avatarUrl) updates.avatar_img = avatarUrl

    const { error: updateError } = await supabase.from('users').update(updates).eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setStep(2)
  }

  const applyPreset = async () => {
    if (!user?.id || !selectedPreset) return
    setSaving(true)

    try {
      // Mark onboarding complete
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)

      if (!IS_DEMO && selectedPreset !== 'blank') {
        // Get user's workspace
        const { data: membership } = await supabase
          .from('workspace_memberships')
          .select('workspace_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .single()

        if (membership) {
          const wsId = membership.workspace_id
          const presetExperiences = getPresetExperiences(selectedPreset, wsId)
          if (presetExperiences.length > 0) {
            await supabase.from('workspace_experiences').insert(presetExperiences)
          }
        }
      }
    } catch (err) {
      console.error('Preset apply error', err)
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-olu-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md glass rounded-2xl p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={clsx('h-1 flex-1 rounded-full', step >= 1 ? 'bg-white' : 'bg-white/20')} />
          <div className={clsx('h-1 flex-1 rounded-full', step >= 2 ? 'bg-white' : 'bg-white/20')} />
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-2xl font-black mb-6">{t('onboarding.title')}</h1>
            <form onSubmit={submitProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('onboarding.namePlaceholder')}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--olu-input-focus)]"
                  placeholder={t('onboarding.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t('settings.handle')}</label>
                <div className="w-full rounded-xl bg-olu-card border border-olu-border px-3 py-2.5 text-sm flex items-center">
                  <span className="text-olu-muted mr-1">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="bg-transparent flex-1 focus:outline-none"
                    placeholder={t('onboarding.handlePlaceholder')}
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
                {saving ? t('common.saving') : t('onboarding.continueButton')}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-2">{t('onboarding.presetTitle', 'Choose your template')}</h1>
            <p className="text-sm text-[var(--olu-muted)] mb-5">{t('onboarding.presetSubtitle', 'This sets up your workspace with starter content. You can customize everything later.')}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {PRESETS.map(({ key, icon: Icon, label, desc, gradient }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={clsx(
                    'rounded-2xl p-4 text-left transition-all border-2',
                    selectedPreset === key
                      ? 'border-white bg-white/10 scale-[1.02]'
                      : 'border-transparent bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)]'
                  )}
                >
                  <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', gradient)}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-[var(--olu-muted)] mt-0.5 leading-snug">{desc}</p>
                  {selectedPreset === key && (
                    <div className="mt-2">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={applyPreset}
              disabled={!selectedPreset || saving}
              className="w-full rounded-xl bg-white text-black font-semibold py-2.5 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                t('onboarding.continueButton')
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function getPresetExperiences(preset: PresetKey, workspaceId: string) {
  const base = { workspace_id: workspaceId, status: 'active' as const, visibility: 'public' as const }
  switch (preset) {
    case 'community':
      return [
        { ...base, name: 'General Discussion', type: 'forum', description: 'Open forum for all members', position: 0 },
        { ...base, name: 'Announcements', type: 'forum', description: 'Official updates and news', position: 1 },
        { ...base, name: 'Lounge', type: 'group_chat', description: 'Real-time group conversation', position: 2 },
      ]
    case 'academy':
      return [
        { ...base, name: 'Getting Started', type: 'course', description: 'Introductory course for beginners', position: 0 },
        { ...base, name: 'Q&A Forum', type: 'forum', description: 'Ask questions and get help', position: 1 },
        { ...base, name: 'Office Hours', type: 'support_chat', description: 'Live support sessions', position: 2 },
      ]
    case 'hybrid':
      return [
        { ...base, name: 'Community Hub', type: 'forum', description: 'Main discussion forum', position: 0 },
        { ...base, name: 'Courses', type: 'course', description: 'Structured learning content', position: 1 },
        { ...base, name: 'Group Chat', type: 'group_chat', description: 'Chat with other members', position: 2 },
        { ...base, name: 'Support', type: 'support_chat', description: 'Get help from the team', position: 3 },
      ]
    default:
      return []
  }
}
