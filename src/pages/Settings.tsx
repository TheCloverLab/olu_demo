import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Briefcase, ChevronLeft, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { availableRoles, enabledBusinessModules } = useApp()
  const [savingProfile, setSavingProfile] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState(user?.name || '')
  const [handle, setHandle] = useState((user?.handle || '').replace(/^@/, ''))
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  useEffect(() => {
    setName(user?.name || '')
    setHandle((user?.handle || '').replace(/^@/, ''))
    setBio(user?.bio || '')
  }, [user?.id])

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
              <p className="text-olu-muted text-xs">Manage your profile and account security</p>
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
              <h2 className="font-semibold mb-1">Account Scope</h2>
              <p className="text-olu-muted text-sm">
                Product roles and business modules now live in the workspace layer. This page only manages your personal identity and sign-in state.
              </p>
            </div>

            <div className="rounded-2xl border border-olu-border bg-black/30 p-4 flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="font-semibold text-base">Business capabilities moved out of consumer settings</p>
                <p className="text-olu-muted text-sm mt-1 leading-relaxed">
                  Use the business workspace for capability switching, module access, approvals, and operator controls. Your current account supports {availableRoles.length} signed-in context{availableRoles.length > 1 ? 's' : ''}, but they are no longer managed from this page.
                </p>
              </div>
            </div>

            {enabledBusinessModules.length > 0 ? (
              <button
                onClick={() => navigate('/business')}
                className="w-full mt-4 rounded-2xl border border-white/10 bg-[#161616] hover:bg-[#1d1d1d] transition-colors px-4 py-3 text-left flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">Open business workspace</p>
                    <p className="text-olu-muted text-xs mt-1">Modules, approvals, operators, and AI agents</p>
                  </div>
                </div>
                <span className="text-xs text-olu-muted">Open</span>
              </button>
            ) : null}
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
