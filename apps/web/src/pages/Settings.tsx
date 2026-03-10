import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Briefcase, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { enabledBusinessModules } = useApp()
  const [savingHandle, setSavingHandle] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [handleMessage, setHandleMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [handle, setHandle] = useState((user?.handle || '').replace(/^@/, ''))

  useEffect(() => {
    setHandle((user?.handle || '').replace(/^@/, ''))
  }, [user?.id])

  async function handleSaveHandle() {
    if (!user?.id) return
    setSavingHandle(true)
    setHandleMessage('')

    try {
      const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (!normalizedHandle) throw new Error('Handle is required')

      const { error } = await supabase.from('users').update({ handle: `@${normalizedHandle}` }).eq('id', user.id)
      if (error) throw error

      setHandleMessage('Handle updated. Refreshing...')
      setTimeout(() => window.location.reload(), 700)
    } catch (err: any) {
      setHandleMessage(err.message || 'Failed to update handle')
    } finally {
      setSavingHandle(false)
    }
  }

  async function handleChangePassword() {
    if (!user?.email) return
    setSavingPassword(true)
    setPasswordMessage('')

    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('Current password is incorrect')

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw updateError

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated successfully')
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
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
              <p className="text-olu-muted text-xs">Manage your account and security</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-[#111111] rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Account</h2>
            <div className="space-y-4">
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
              {handleMessage && (
                <p className={`text-sm ${handleMessage.includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {handleMessage}
                </p>
              )}
              <button
                onClick={handleSaveHandle}
                disabled={savingHandle}
                className="w-full rounded-xl bg-white text-black py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {savingHandle ? 'Saving...' : 'Save Handle'}
              </button>
            </div>
          </div>

          <div className="bg-[#111111] rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Password</h2>
            <div className="space-y-4">
              <div>
                <p className="text-olu-muted text-xs mb-1">Current Password</p>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">New Password</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <p className="text-olu-muted text-xs mb-1">Confirm New Password</p>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-[#161616] border border-olu-border px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              {passwordMessage && (
                <p className={`text-sm ${passwordMessage.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordMessage}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword}
                className="w-full rounded-xl bg-white text-black py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </div>

          {enabledBusinessModules.length > 0 ? (
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-fuchsia-600/10 border border-indigo-500/20">
              <button
                onClick={() => navigate('/business')}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    <Briefcase size={20} className="text-white" />
                  </span>
                  <div>
                    <p className="font-bold text-base">Business OS</p>
                    <p className="text-white/60 text-sm mt-0.5">Modules, approvals, operators, and AI agents</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40" />
              </button>
            </div>
          ) : null}

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
