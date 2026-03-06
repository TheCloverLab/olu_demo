import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const formEmail = String(formData.get('email') || '').trim()
    const formPassword = String(formData.get('password') || '')

    if (!formEmail || !formPassword) {
      setError('Please enter email and password.')
      return
    }

    setLoading(true)

    try {
      await signIn(formEmail, formPassword)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-olu-muted">Sign in to your OLU account</p>
        </div>

        <div className="bg-[#111111] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-[#1c1c1c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#1c1c1c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-xl px-4 py-3 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-olu-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="text-white hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-olu-muted">
            Demo: luna.demo@olu.app / alex.demo@olu.app (see shared demo credentials)
          </p>
        </div>
      </motion.div>
    </div>
  )
}
