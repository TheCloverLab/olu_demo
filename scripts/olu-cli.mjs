#!/usr/bin/env node
/**
 * OLU CLI — authenticate with email/password, then get/set data via Supabase RLS.
 *
 * Usage:
 *   node scripts/olu-cli.mjs login <email> <password>
 *   node scripts/olu-cli.mjs whoami
 *   node scripts/olu-cli.mjs tables
 *   node scripts/olu-cli.mjs get <table> [--select <cols>] [--eq <col>=<val>] [--limit <n>] [--order <col>] [--single]
 *   node scripts/olu-cli.mjs set <table> <json>                  # upsert
 *   node scripts/olu-cli.mjs update <table> --eq <col>=<val> <json>
 *   node scripts/olu-cli.mjs delete <table> --eq <col>=<val>
 *   node scripts/olu-cli.mjs rpc <function_name> [json_args]
 *   node scripts/olu-cli.mjs logout
 *
 * Session is stored in ~/.olu-session.json so subsequent commands stay authenticated.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://indiwmqxvnkzapsuvhyh.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_2ZHLC2lcJSsZJPkjRs-zGg__KdsG_pe'
const SESSION_FILE = join(homedir(), '.olu-session.json')

function saveSession(session) {
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2))
}

function loadSession() {
  if (!existsSync(SESSION_FILE)) return null
  try {
    return JSON.parse(readFileSync(SESSION_FILE, 'utf-8'))
  } catch {
    return null
  }
}

function clearSession() {
  if (existsSync(SESSION_FILE)) unlinkSync(SESSION_FILE)
}

function createAuthClient(session) {
  const opts = {}
  if (session) {
    opts.global = {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }
    opts.auth = {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts)
}

async function refreshIfNeeded(supabase, session) {
  if (!session) return null
  const expiresAt = session.expires_at * 1000
  if (Date.now() < expiresAt - 60_000) return session

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  })
  if (error) {
    console.error('Session expired. Please login again.')
    clearSession()
    process.exit(1)
  }
  const newSession = data.session
  saveSession(newSession)
  return newSession
}

function parseArgs(args) {
  const result = { filters: [], select: '*', limit: null, order: null, single: false }
  let i = 0
  while (i < args.length) {
    if (args[i] === '--select' && args[i + 1]) {
      result.select = args[++i]
    } else if (args[i] === '--eq' && args[i + 1]) {
      const [col, ...rest] = args[++i].split('=')
      result.filters.push({ type: 'eq', col, val: rest.join('=') })
    } else if (args[i] === '--gt' && args[i + 1]) {
      const [col, ...rest] = args[++i].split('=')
      result.filters.push({ type: 'gt', col, val: rest.join('=') })
    } else if (args[i] === '--lt' && args[i + 1]) {
      const [col, ...rest] = args[++i].split('=')
      result.filters.push({ type: 'lt', col, val: rest.join('=') })
    } else if (args[i] === '--like' && args[i + 1]) {
      const [col, ...rest] = args[++i].split('=')
      result.filters.push({ type: 'ilike', col, val: rest.join('=') })
    } else if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[++i], 10)
    } else if (args[i] === '--order' && args[i + 1]) {
      result.order = args[++i]
    } else if (args[i] === '--single') {
      result.single = true
    } else {
      result.positional = result.positional || []
      result.positional.push(args[i])
    }
    i++
  }
  return result
}

async function getAuthenticatedClient() {
  const session = loadSession()
  if (!session) {
    console.error('Not logged in. Run: olu-cli login <email> <password>')
    process.exit(1)
  }
  const supabase = createAuthClient(session)
  const refreshed = await refreshIfNeeded(supabase, session)
  if (refreshed !== session) {
    return createAuthClient(refreshed)
  }
  // Set the session so RLS sees the JWT
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  return supabase
}

// Known public tables (from migrations)
const KNOWN_TABLES = [
  'users',
  'workspaces',
  'workspace_memberships',
  'workspace_modules',
  'workspace_permissions',
  'workspace_agents',
  'workspace_agent_tasks',
  'workspace_agent_task_logs',
  'workspace_employees',
  'workspace_experiences',
  'experience_video_items',
  'workspace_products',
  'workspace_product_plans',
  'workspace_product_experiences',
  'workspace_home_configs',
  'workspace_consumer_configs',
  'consumer_courses',
  'consumer_course_sections',
  'consumer_memberships',
  'consumer_purchases',
  'membership_tiers',
  'fans',
  'posts',
  'products',
  'agent_templates',
  'agent_scheduled_jobs',
  'agent_memories',
  'social_chats',
  'social_chat_messages',
  'group_chats',
  'group_chat_messages',
  'conversations',
  'ip_licenses',
  'ip_infringements',
  'analytics_revenue',
  'analytics_views',
  'campaigns',
  'campaign_creators',
  'role_applications',
  'wallets',
]

// ── Commands ──

async function cmdLogin(email, password) {
  if (!email || !password) {
    console.error('Usage: olu-cli login <email> <password>')
    process.exit(1)
  }
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error(`Login failed: ${error.message}`)
    process.exit(1)
  }
  saveSession(data.session)
  console.log(`Logged in as ${data.user.email} (${data.user.id})`)
}

async function cmdLogout() {
  clearSession()
  console.log('Logged out.')
}

async function cmdWhoami() {
  const supabase = await getAuthenticatedClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    console.error('Not authenticated.')
    clearSession()
    process.exit(1)
  }
  // Fetch profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, email, role, onboarding_complete')
    .eq('auth_id', user.id)
    .single()

  console.log({
    auth_id: user.id,
    email: user.email,
    profile: profile || 'no profile found',
  })
}

async function cmdTables() {
  console.log('Available tables (subject to RLS policies):\n')
  for (const t of KNOWN_TABLES) {
    console.log(`  ${t}`)
  }
  console.log(`\nUse: olu-cli get <table> [--select <cols>] [--eq col=val] [--limit n]`)
}

async function cmdGet(table, args) {
  if (!table) {
    console.error('Usage: olu-cli get <table> [--select cols] [--eq col=val] [--limit n] [--order col] [--single]')
    process.exit(1)
  }
  const supabase = await getAuthenticatedClient()
  const opts = parseArgs(args)

  let query = supabase.from(table).select(opts.select)

  for (const f of opts.filters) {
    query = query[f.type](f.col, f.val)
  }
  if (opts.order) {
    const desc = opts.order.startsWith('-')
    const col = desc ? opts.order.slice(1) : opts.order
    query = query.order(col, { ascending: !desc })
  }
  if (opts.limit) query = query.limit(opts.limit)
  if (opts.single) query = query.single()

  const { data, error, count } = await query
  if (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  console.log(JSON.stringify(data, null, 2))
}

async function cmdSet(table, jsonStr) {
  if (!table || !jsonStr) {
    console.error('Usage: olu-cli set <table> \'{"col":"val",...}\'')
    process.exit(1)
  }
  const supabase = await getAuthenticatedClient()
  let payload
  try {
    payload = JSON.parse(jsonStr)
  } catch {
    console.error('Invalid JSON payload.')
    process.exit(1)
  }

  const { data, error } = await supabase.from(table).upsert(payload).select()
  if (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  console.log('Upserted:')
  console.log(JSON.stringify(data, null, 2))
}

async function cmdUpdate(table, args) {
  const opts = parseArgs(args)
  if (!opts.positional?.length) {
    console.error('Usage: olu-cli update <table> --eq col=val \'{"col":"newval"}\'')
    process.exit(1)
  }
  const supabase = await getAuthenticatedClient()
  let payload
  try {
    payload = JSON.parse(opts.positional[0])
  } catch {
    console.error('Invalid JSON payload.')
    process.exit(1)
  }

  let query = supabase.from(table).update(payload)
  for (const f of opts.filters) {
    query = query[f.type](f.col, f.val)
  }
  const { data, error } = await query.select()
  if (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  console.log('Updated:')
  console.log(JSON.stringify(data, null, 2))
}

async function cmdDelete(table, args) {
  const opts = parseArgs(args)
  if (!opts.filters.length) {
    console.error('Usage: olu-cli delete <table> --eq col=val')
    process.exit(1)
  }
  const supabase = await getAuthenticatedClient()

  let query = supabase.from(table).delete()
  for (const f of opts.filters) {
    query = query[f.type](f.col, f.val)
  }
  const { data, error } = await query.select()
  if (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  console.log('Deleted:')
  console.log(JSON.stringify(data, null, 2))
}

async function cmdRpc(fnName, argsJson) {
  if (!fnName) {
    console.error('Usage: olu-cli rpc <function_name> [\'{"arg":"val"}\']')
    process.exit(1)
  }
  const supabase = await getAuthenticatedClient()
  let params = {}
  if (argsJson) {
    try {
      params = JSON.parse(argsJson)
    } catch {
      console.error('Invalid JSON arguments.')
      process.exit(1)
    }
  }
  const { data, error } = await supabase.rpc(fnName, params)
  if (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  console.log(JSON.stringify(data, null, 2))
}

function printHelp() {
  console.log(`
OLU CLI — Supabase data access with user-level permissions (RLS)

Commands:
  login <email> <password>    Authenticate and save session
  logout                      Clear saved session
  whoami                      Show current user info
  tables                      List available tables
  get <table> [options]       Query data
  set <table> <json>          Upsert a row
  update <table> [options] <json>  Update matching rows
  delete <table> --eq col=val Delete matching rows
  rpc <function> [json_args]  Call a Postgres function

Get options:
  --select <cols>    Columns to return (default: *)
  --eq <col>=<val>   Filter: equals
  --gt <col>=<val>   Filter: greater than
  --lt <col>=<val>   Filter: less than
  --like <col>=<val> Filter: case-insensitive like
  --limit <n>        Max rows
  --order <col>      Sort (prefix with - for desc)
  --single           Return single object instead of array

Examples:
  olu-cli login luna.demo@olu.app Demo123!
  olu-cli whoami
  olu-cli get workspaces
  olu-cli get workspace_agents --eq workspace_id=<id> --select 'name,role,status'
  olu-cli get posts --limit 5 --order -created_at
  olu-cli set posts '{"title":"Hello","body":"World","workspace_id":"..."}'
  olu-cli update posts --eq id=<id> '{"title":"Updated"}'
  olu-cli delete posts --eq id=<id>
  olu-cli logout
`)
}

// ── Main ──

const [, , command, ...rest] = process.argv

switch (command) {
  case 'login':
    await cmdLogin(rest[0], rest[1])
    break
  case 'logout':
    await cmdLogout()
    break
  case 'whoami':
    await cmdWhoami()
    break
  case 'tables':
    await cmdTables()
    break
  case 'get':
    await cmdGet(rest[0], rest.slice(1))
    break
  case 'set':
    await cmdSet(rest[0], rest[1])
    break
  case 'update':
    await cmdUpdate(rest[0], rest.slice(1))
    break
  case 'delete':
    await cmdDelete(rest[0], rest.slice(1))
    break
  case 'rpc':
    await cmdRpc(rest[0], rest[1])
    break
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp()
    break
  default:
    console.error(`Unknown command: ${command}`)
    printHelp()
    process.exit(1)
}
