import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const accounts = [
  ['luna.demo@olu.app', 'Demo123!Creator'],
  ['alex.demo@olu.app', 'Demo123!Fan'],
  ['gameverse.demo@olu.app', 'Demo123!Ads'],
  ['artisan.demo@olu.app', 'Demo123!Supply'],
  ['maya.demo@olu.app', 'Demo123!Hybrid'],
]

const rows = []
for (const [email, password] of accounts) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  rows.push({ email, ok: !error, error: error?.message || '', user: data.user?.id ? 'yes' : 'no' })
  await supabase.auth.signOut()
}

console.table(rows)
