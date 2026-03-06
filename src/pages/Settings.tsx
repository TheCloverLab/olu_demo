import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { ChevronLeft, Check, Plus, Clock3, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getMyRoleApplications, submitRoleApplication } from '../services/api'
import type { RoleApplication } from '../lib/supabase'

const ROLE_OPTIONS = [
  { value: 'creator', label: 'Creator', emoji: '🎨', description: 'Create and monetize content' },
  { value: 'fan', label: 'Fan', emoji: '❤️', description: 'Support and engage with creators' },
  { value: 'advertiser', label: 'Advertiser', emoji: '📣', description: 'Run marketing campaigns' },
  { value: 'supplier', label: 'Supplier', emoji: '🏭', description: 'Supply products to creators' },
] as const

const APPLYABLE_ROLES = new Set(['creator', 'advertiser', 'supplier'])

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { availableRoles } = useApp()

  const [applications, setApplications] = useState<RoleApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState(user?.name || '')
  const [handle, setHandle] = useState((user?.handle || '').replace(/^@/, ''))
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  async function loadApplications() {
    try {
      const data = await getMyRoleApplications()
      setApplications(data)
    } catch (err: any) {
      setMessage(`Failed to load applications: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    setName(user?.name || '')
    setHandle((user?.handle || '').replace(/^@/, ''))
    setBio(user?.bio || '')
  }, [user?.id])

  const pendingRoles = useMemo(() => {
    return new Set(
      applications
        .filter((app) => app.status === 'pending')
        .map((app) => app.target_role)
    )
  }, [applications])

  const approvedRoles = useMemo(() => {
    return new Set(
      applications
        .filter((app) => app.status === 'approved')
        .map((app) => app.target_role)
    )
  }, [applications])

  async function handleApply(role: 'creator' | 'advertiser' | 'supplier') {
    setSavingRole(role)
    setMessage('')

    try {
      await submitRoleApplication(role, 'Requested from account settings')
      setMessage(`Application submitted for ${role}. We will review it soon.`)
      await loadApplications()
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit application')
    } finally {
      setSavingRole(null)
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return
    setSavingProfile(true)
    setMessage('')

    try {
      const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (!name.trim() || !normalizedHandle) {
        throw new Error('Display name and handle are required')
      }

      let avatarUrl: string | undefined
      let coverUrl: string | undefined

      const ownerFolder = user.auth_id || user.id

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${ownerFolder}/avatar-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        })
        if (uploadErr) throw uploadErr
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }

      if (coverFile) {
        const ext = coverFile.name.split('.').pop() || 'jpg'
        const path = `${ownerFolder}/cover-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('covers').upload(path, coverFile, {
          upsert: true,
          contentType: coverFile.type,
        })
        if (uploadErr) throw uploadErr
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      }

      const initials = name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'

      const updates: any = {
        name: name.trim(),
        handle: `@${normalizedHandle}`,
        bio: bio.trim() || null,
        initials,
      }

      if (avatarUrl) updates.avatar_img = avatarUrl
      if (coverUrl) updates.cover_img = coverUrl

      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error

      setAvatarFile(null)
      setCoverFile(null)
      setMessage('Profile updated successfully. Refreshing...')
      setTimeout(() => window.location.reload(), 700)
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-olu-border z-10">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-[#1c1c1c] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg">Account Settings</h1>
              <p className="text-olu-muted text-xs">Manage your profile and role applications</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-[#111111] rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-olu-muted text-xs mb-1">Display Name</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Handle</p>
                <div className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm flex items-center">
                  <span className="text-olu-muted mr-1">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="bg-transparent flex-1 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Bio</p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none"
                />
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Avatar (optional)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black"
                />
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Cover Image (optional)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full rounded-xl bg-white text-black py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="bg-[#111111] rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="font-semibold mb-1">Roles</h2>
              <p className="text-olu-muted text-sm">
                New users start as Fan. Apply for additional roles below.
              </p>
            </div>

            <div className="space-y-3">
              {ROLE_OPTIONS.map(({ value, label, emoji, description }) => {
                const hasRole = availableRoles.includes(value)
                const isPending = value === 'fan' ? false : pendingRoles.has(value)
                const isApproved = value === 'fan' ? false : approvedRoles.has(value)
                const canApply = APPLYABLE_ROLES.has(value)
                const isApplying = savingRole === value

                return (
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-olu-border"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0">
                      {emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-olu-muted text-xs">{description}</p>
                    </div>

                    {hasRole ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-black text-xs font-semibold">
                        <Check size={12} />
                        Active
                      </div>
                    ) : isPending ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                        <Clock3 size={12} />
                        Pending
                      </div>
                    ) : canApply ? (
                      <button
                        onClick={() => handleApply(value as 'creator' | 'advertiser' | 'supplier')}
                        disabled={isApplying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1c1c] hover:bg-[#242424] text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Plus size={14} />
                        {isApplying ? 'Applying...' : 'Apply'}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1c1c1c] text-olu-muted text-xs font-semibold">
                        Default
                      </div>
                    )}

                    {!hasRole && isApproved && (
                      <div className="text-xs text-green-400">Approved. Refresh to activate.</div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${
                message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-green-500/10 text-green-400'
              }`}>
                {message}
              </div>
            )}

            {loading && <p className="text-olu-muted text-sm mt-4">Loading applications...</p>}
          </div>

          <div className="bg-[#111111] rounded-2xl p-6">
            <h2 className="font-semibold mb-3">Session</h2>
            <p className="text-olu-muted text-sm mb-4">Sign out from this device.</p>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full rounded-xl bg-[#1c1c1c] hover:bg-[#242424] text-olu-muted py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSignOutConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                onClick={() => !signingOut && setShowSignOutConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="w-full max-w-sm bg-[#111111] border border-olu-border rounded-2xl p-5">
                  <h3 className="font-bold text-lg mb-1">Sign out?</h3>
                  <p className="text-olu-muted text-sm mb-4">You will need to sign in again to continue.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSignOutConfirm(false)}
                      disabled={signingOut}
                      className="flex-1 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] disabled:opacity-50 py-2.5 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex-1 rounded-xl bg-white text-black hover:opacity-90 disabled:opacity-50 py-2.5 text-sm font-semibold"
                    >
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
