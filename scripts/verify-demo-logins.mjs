import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const DEMO_PASSWORD = 'Demo123!'

const accounts = [
  'luna.demo@olu.app',
  'alex.demo@olu.app',
  'gameverse.demo@olu.app',
  'artisan.demo@olu.app',
  'maya.demo@olu.app',
]

const rows = []
for (const email of accounts) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
  rows.push({ email, ok: !error, error: error?.message || '', user: data.user?.id ? 'yes' : 'no' })
  await supabase.auth.signOut()
}

console.table(rows)
