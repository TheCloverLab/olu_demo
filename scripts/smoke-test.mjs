import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !service) throw new Error('Missing env vars')

const admin = createClient(url, service)
const client = createClient(url, anon)

const email = `smoke_${Date.now()}@examplemail.com`
const password = 'SmokeTest123!'

const results = []
const ok = (name, extra = '') => results.push({ name, status: 'PASS', extra })
const fail = (name, extra = '') => results.push({ name, status: 'FAIL', extra })

const cleanErr = (err) => {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err.message) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

try {
  const signup = await client.auth.signUp({ email, password })
  if (signup.error) throw signup.error
  if (!signup.data.user) throw new Error('No user returned from signup')
  ok('signup', email)

  const signin = await client.auth.signInWithPassword({ email, password })
  if (signin.error) throw signin.error
  const authUser = signin.data.user
  if (!authUser) throw new Error('No user returned from sign in')
  ok('signin')

  const localPart = email.split('@')[0]
  const username = `${localPart}_smoke`
  const profileInsert = await client.from('users').insert({
    auth_id: authUser.id,
    email,
    username,
    handle: `@${username}`,
    name: 'Smoke Tester',
    role: 'fan',
    roles: ['fan'],
    initials: 'ST',
    avatar_color: 'from-blue-500 to-purple-600',
    followers: 0,
    following: 0,
    posts: 0,
    verified: false,
    onboarding_completed: false,
  })
  if (profileInsert.error) throw profileInsert.error
  ok('profile bootstrap insert')

  const profile = await client.from('users').select('id,auth_id,role,roles,onboarding_completed').eq('auth_id', authUser.id).single()
  if (profile.error) throw profile.error
  if (profile.data.role !== 'fan') throw new Error('Default role is not fan')
  ok('default fan role', JSON.stringify({ role: profile.data.role, roles: profile.data.roles }))

  const update = await client
    .from('users')
    .update({ name: 'Smoke Tester', handle: `@smoke_${Date.now().toString().slice(-6)}`, onboarding_completed: true })
    .eq('id', profile.data.id)
  if (update.error) throw update.error
  ok('onboarding profile update')

  const avatarBody = new TextEncoder().encode('avatar smoke test')
  const avatarPath = `${authUser.id}/avatar-smoke-${Date.now()}.txt`
  const avatarUpload = await client.storage.from('avatars').upload(avatarPath, avatarBody, { upsert: true, contentType: 'text/plain' })
  if (avatarUpload.error) throw avatarUpload.error
  ok('avatar upload')

  const coverBody = new TextEncoder().encode('cover smoke test')
  const coverPath = `${authUser.id}/cover-smoke-${Date.now()}.txt`
  const coverUpload = await client.storage.from('covers').upload(coverPath, coverBody, { upsert: true, contentType: 'text/plain' })
  if (coverUpload.error) throw coverUpload.error
  ok('cover upload')

  const roleApp = await client.rpc('submit_role_application', { target_role_input: 'creator', reason_input: 'smoke test' })
  if (roleApp.error) throw roleApp.error
  ok('role application submit', String(roleApp.data))

  const appRow = await admin.from('role_applications').select('id,status,target_role,user_id').eq('id', roleApp.data).single()
  if (appRow.error) throw appRow.error
  if (appRow.data.status !== 'pending') throw new Error('application not pending')
  ok('role application pending')

  const approve = await admin
    .from('role_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), review_note: 'smoke approved' })
    .eq('id', appRow.data.id)
  if (approve.error) throw approve.error

  const userRoles = await admin.from('users').select('roles').eq('id', appRow.data.user_id).single()
  if (userRoles.error) throw userRoles.error
  const nextRoles = Array.from(new Set([...(userRoles.data.roles || ['fan']), 'creator']))
  const roleUpdate = await admin.from('users').update({ roles: nextRoles }).eq('id', appRow.data.user_id)
  if (roleUpdate.error) throw roleUpdate.error
  ok('role approval+grant')

  const campaignsBlocked = await client
    .from('campaigns')
    .insert({ advertiser_id: profile.data.id, name: 'should fail campaign', status: 'active', budget: 100, spent: 0, start_date: '2026-01-01', end_date: '2026-01-31' })
  if (campaignsBlocked.error) ok('RLS blocks unauthorized campaign write')
  else fail('RLS blocks unauthorized campaign write', 'insert unexpectedly succeeded')
} catch (e) {
  fail('smoke test aborted', cleanErr(e))
}

console.table(results)
if (results.some(r => r.status === 'FAIL')) process.exit(1)
