import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Parse .env.local manually (no dotenv dependency)
const envContent = readFileSync('.env.local', 'utf8')
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

const NEW_PASSWORD = 'Demo123!'

const ACCOUNTS = [
  { email: 'luna.demo@olu.app', oldPassword: 'Demo123!Creator' },
  { email: 'alex.demo@olu.app', oldPassword: 'Demo123!Fan' },
  { email: 'gameverse.demo@olu.app', oldPassword: 'Demo123!Ads' },
  { email: 'artisan.demo@olu.app', oldPassword: 'Demo123!Supply' },
  { email: 'maya.demo@olu.app', oldPassword: 'Demo123!Hybrid' },
]

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const results = []

for (const account of ACCOUNTS) {
  // Sign in with old password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.oldPassword,
  })

  if (signInError) {
    // Maybe already updated — try new password
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: NEW_PASSWORD,
    })
    if (retryError) {
      results.push({ email: account.email, status: 'FAILED', error: signInError.message })
    } else {
      results.push({ email: account.email, status: 'ALREADY_UPDATED' })
    }
    await supabase.auth.signOut()
    continue
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: NEW_PASSWORD,
  })

  if (updateError) {
    results.push({ email: account.email, status: 'UPDATE_FAILED', error: updateError.message })
  } else {
    results.push({ email: account.email, status: 'UPDATED' })
  }

  await supabase.auth.signOut()
}

console.table(results)
