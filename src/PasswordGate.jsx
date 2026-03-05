import { useState } from 'react'
import { Zap } from 'lucide-react'

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('olu_auth') === '1')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  if (authed) return children

  const submit = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      })
      if (res.ok) {
        sessionStorage.setItem('olu_auth', '1')
        setAuthed(true)
      } else {
        setError(true)
        setInput('')
        setTimeout(() => setError(false), 1500)
      }
    } catch {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6">
        <Zap size={20} className="text-black" fill="black" />
      </div>
      <h1 className="font-black text-2xl mb-1">OLU</h1>
      <p className="text-olu-muted text-sm mb-8">Enter password to continue</p>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border text-sm placeholder:text-olu-muted focus:outline-none transition-colors ${error ? 'border-red-500' : 'border-olu-border focus:border-white/20'}`}
        />
        <button onClick={submit} disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Checking...' : 'Enter'}
        </button>
        {error && <p className="text-red-400 text-xs text-center">Incorrect password</p>}
      </div>
    </div>
  )
}
