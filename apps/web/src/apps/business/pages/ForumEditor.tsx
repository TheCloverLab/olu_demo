import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2, Users, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { getExperience, updateExperience } from '../../../domain/experience/api'
import type { WorkspaceExperience } from '../../../lib/supabase'

type ForumConfig = {
  banner?: string | null
  who_can_post: 'everyone' | 'admin_only'
  who_can_comment: 'everyone' | 'admin_only'
  email_notifications: 'all_admin_posts' | 'none'
}

function defaultConfig(exp: WorkspaceExperience): ForumConfig {
  const cfg = (exp.config_json || {}) as Partial<ForumConfig>
  return {
    banner: cfg.banner ?? exp.cover ?? null,
    who_can_post: cfg.who_can_post ?? 'everyone',
    who_can_comment: cfg.who_can_comment ?? 'everyone',
    email_notifications: cfg.email_notifications ?? 'all_admin_posts',
  }
}

function RadioOption({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: typeof Users
  title: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full p-4 rounded-xl text-left transition-colors border',
        selected
          ? 'border-cyan-300/40 bg-cyan-300/10'
          : 'border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] hover:bg-[var(--olu-card-hover)]'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={selected ? 'text-cyan-400' : 'text-[var(--olu-text-secondary)]'} />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="text-xs text-[var(--olu-text-secondary)]">{description}</p>
    </button>
  )
}

export default function ForumEditor() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const experienceId = params.get('id')

  const [exp, setExp] = useState<WorkspaceExperience | null>(null)
  const [config, setConfig] = useState<ForumConfig | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!experienceId) return
    getExperience(experienceId)
      .then((e) => {
        if (e) {
          setExp(e)
          setConfig(defaultConfig(e))
          setName(e.name)
        }
      })
      .finally(() => setLoading(false))
  }, [experienceId])

  async function handleSave() {
    if (!exp || !config) return
    setSaving(true)
    try {
      await updateExperience(exp.id, {
        name,
        cover: config.banner || undefined,
        config_json: {
          banner: config.banner,
          who_can_post: config.who_can_post,
          who_can_comment: config.who_can_comment,
          email_notifications: config.email_notifications,
        },
      })
      navigate('/business/experiences')
    } catch (err) {
      console.error('Failed to save forum config', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!exp || !config) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--olu-muted)]">Forum not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/business/experiences')}
            className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[var(--olu-muted)] text-xs">Editing Forum</p>
            <h1 className="font-bold text-lg">{name}</h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-semibold text-base">Configure your forum</h2>
        <p className="text-[var(--olu-text-secondary)] text-sm">
          Edit notification settings and customize the look and feel of your forum here.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Forum Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/30"
        />
      </div>

      {/* Banner Image */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Banner Image</h3>
        <div className="rounded-xl border border-dashed border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] p-8 flex flex-col items-center justify-center gap-3">
          {config.banner ? (
            <div className="relative w-full">
              <img src={config.banner} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
              <button
                onClick={() => setConfig({ ...config, banner: null })}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <Upload size={24} className="text-[var(--olu-muted)]" />
              <p className="text-xs text-[var(--olu-muted)]">Recommended dimensions: 2200x460px with a 43:9 aspect ratio.</p>
              <label className="px-4 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm cursor-pointer hover:bg-[var(--olu-card-hover)] transition-colors">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setConfig({ ...config, banner: url })
                    }
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Who can post */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Who can post</h3>
        <div className="space-y-2">
          <RadioOption
            selected={config.who_can_post === 'everyone'}
            onClick={() => setConfig({ ...config, who_can_post: 'everyone' })}
            icon={Users}
            title="Everyone"
            description="Allow anyone to write posts"
          />
          <RadioOption
            selected={config.who_can_post === 'admin_only'}
            onClick={() => setConfig({ ...config, who_can_post: 'admin_only' })}
            icon={ShieldCheck}
            title="Only admin"
            description="Everyone will be able to read posts but only admins will be able to write posts"
          />
        </div>
      </div>

      {/* Who can comment */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Who can comment</h3>
        <div className="space-y-2">
          <RadioOption
            selected={config.who_can_comment === 'everyone'}
            onClick={() => setConfig({ ...config, who_can_comment: 'everyone' })}
            icon={Users}
            title="Everyone"
            description="Anyone can comment on any post"
          />
          <RadioOption
            selected={config.who_can_comment === 'admin_only'}
            onClick={() => setConfig({ ...config, who_can_comment: 'admin_only' })}
            icon={ShieldCheck}
            title="Only admin"
            description="Only admins can comment on posts"
          />
        </div>
      </div>

      {/* Email notification preferences */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Email notification preferences</h3>
        <div className="space-y-2">
          <RadioOption
            selected={config.email_notifications === 'all_admin_posts'}
            onClick={() => setConfig({ ...config, email_notifications: 'all_admin_posts' })}
            icon={Users}
            title="All admin posts"
            description="Every user will receive an email whenever an admin posts. Users can opt out of these emails."
          />
          <RadioOption
            selected={config.email_notifications === 'none'}
            onClick={() => setConfig({ ...config, email_notifications: 'none' })}
            icon={ShieldCheck}
            title="Do not send emails"
            description="Emails will not be sent for this forum"
          />
        </div>
      </div>
    </div>
  )
}
