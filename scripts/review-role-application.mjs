import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const applicationId = process.argv[2]
const action = process.argv[3]
const reviewNote = process.argv.slice(4).join(' ') || null

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!applicationId || !['approved', 'rejected'].includes(action)) {
  console.error('Usage: node scripts/review-role-application.mjs <applicationId> <approved|rejected> [review note]')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const { data: app, error: appError } = await supabase
  .from('role_applications')
  .select('id, user_id, target_role, status')
  .eq('id', applicationId)
  .single()

if (appError || !app) {
  console.error('Application not found.')
  process.exit(1)
}

if (app.status !== 'pending') {
  console.error(`Application already reviewed with status: ${app.status}`)
  process.exit(1)
}

const { error: updateError } = await supabase
  .from('role_applications')
  .update({
    status: action,
    reviewed_at: new Date().toISOString(),
    review_note: reviewNote,
  })
  .eq('id', applicationId)

if (updateError) {
  console.error(updateError.message)
  process.exit(1)
}

if (action === 'approved') {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', app.user_id)
    .single()

  if (userError || !user) {
    console.error('Failed to load user for role update.')
    process.exit(1)
  }

  const currentRoles = Array.isArray(user.roles) ? user.roles : ['fan']
  const nextRoles = Array.from(new Set([...currentRoles, app.target_role]))

  const { error: roleError } = await supabase
    .from('users')
    .update({ roles: nextRoles })
    .eq('id', app.user_id)

  if (roleError) {
    console.error(roleError.message)
    process.exit(1)
  }
}

console.log(`Application ${applicationId} marked as ${action}.`)
