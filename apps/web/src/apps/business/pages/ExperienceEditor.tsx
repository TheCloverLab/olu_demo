import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { getExperience, updateExperience, deleteExperience } from '../../../domain/experience/api'
import type { WorkspaceExperience } from '../../../lib/supabase'

export default function ExperienceEditor() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const experienceId = params.get('id')

  const [exp, setExp] = useState<WorkspaceExperience | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!experienceId) return
    getExperience(experienceId)
      .then((e) => {
        if (e) { setExp(e); setName(e.name) }
      })
      .finally(() => setLoading(false))
  }, [experienceId])

  async function handleSave() {
    if (!exp) return
    setSaving(true)
    try {
      await updateExperience(exp.id, { name })
      navigate('/business/experiences')
    } catch (err) {
      console.error('Failed to save', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!exp) return
    if (!confirm(`Delete "${exp.name}"? This cannot be undone.`)) return
    try {
      await deleteExperience(exp.id)
      navigate('/business/experiences')
    } catch (err) {
      console.error('Failed to delete', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!exp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--olu-muted)]">Experience not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/business/experiences')}
            className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[var(--olu-muted)] text-xs">Editing Experience</p>
            <h1 className="font-bold text-lg">{exp.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl hover:bg-red-500/10 transition-colors text-[var(--olu-muted)] hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
        />
      </div>
    </div>
  )
}
