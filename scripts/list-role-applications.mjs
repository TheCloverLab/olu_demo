import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const status = process.argv[2] || 'pending'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const query = supabase
  .from('role_applications')
  .select('id, user_id, target_role, status, reason, created_at, reviewed_at, review_note')
  .order('created_at', { ascending: false })

if (status !== 'all') {
  query.eq('status', status)
}

const { data, error } = await query

if (error) {
  console.error(error.message)
  process.exit(1)
}

if (!data || data.length === 0) {
  console.log('No role applications found.')
  process.exit(0)
}

console.table(
  data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    target_role: row.target_role,
    status: row.status,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at || '-',
    note: row.review_note || '-',
  }))
)
