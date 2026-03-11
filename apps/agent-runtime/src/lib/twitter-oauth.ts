/**
 * Twitter/X OAuth 2.0 PKCE flow
 *
 * Implements the Authorization Code Flow with PKCE for X API v2.
 * Stores tokens in workspace_integrations.config_json.
 */

import crypto from 'node:crypto'
import { supabase } from './supabase.js'

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

// Scopes needed for posting, reading, and managing tweets
const SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access', // refresh token
  'like.write',
  'like.read',
].join(' ')

interface TwitterTokens {
  access_token: string
  refresh_token?: string
  expires_at: number // unix timestamp
  scope: string
  token_type: string
}

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

// In-memory PKCE store (short-lived, keyed by state)
const pendingAuth = new Map<string, { verifier: string; workspaceId: string; redirectUri: string }>()

/**
 * Step 1: Generate the authorization URL
 */
export function getAuthorizationUrl(workspaceId: string, redirectUri: string, clientId: string): { url: string; state: string } {
  const { verifier, challenge } = generatePKCE()
  const state = crypto.randomBytes(16).toString('hex')

  pendingAuth.set(state, { verifier, workspaceId, redirectUri })

  // Auto-expire after 10 minutes
  setTimeout(() => pendingAuth.delete(state), 10 * 60 * 1000)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return { url: `${TWITTER_AUTH_URL}?${params}`, state }
}

/**
 * Step 2: Exchange authorization code for tokens
 */
export async function handleCallback(
  code: string,
  state: string,
  clientId: string,
  clientSecret?: string,
): Promise<{ workspaceId: string; username?: string }> {
  const pending = pendingAuth.get(state)
  if (!pending) throw new Error('Invalid or expired state parameter')

  const { verifier, workspaceId, redirectUri } = pending
  pendingAuth.delete(state)

  // Exchange code for tokens
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // Use Basic auth if client_secret is available (confidential client)
  if (clientSecret) {
    headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  }

  const resp = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Token exchange failed: ${resp.status} ${err}`)
  }

  const tokens = await resp.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
  }

  const tokenData: TwitterTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    scope: tokens.scope,
    token_type: tokens.token_type,
  }

  // Fetch the authenticated user's profile
  let username: string | undefined
  try {
    const meResp = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (meResp.ok) {
      const me = await meResp.json() as { data: { username: string; id: string; name: string } }
      username = me.data.username
    }
  } catch {}

  // Store tokens in workspace_integrations
  await storeTokens(workspaceId, tokenData, username)

  return { workspaceId, username }
}

/**
 * Get a valid access token, refreshing if needed
 */
export async function getAccessToken(workspaceId: string, clientId: string, clientSecret?: string): Promise<string> {
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('config_json')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'X')
    .single()

  if (error || !data?.config_json?.access_token) {
    throw new Error('Twitter not connected for this workspace')
  }

  const config = data.config_json as TwitterTokens & { username?: string }
  const now = Math.floor(Date.now() / 1000)

  // Token still valid (with 60s buffer)
  if (now < config.expires_at - 60) {
    return config.access_token
  }

  // Refresh the token
  if (!config.refresh_token) {
    throw new Error('Twitter token expired and no refresh token available. Re-authorize.')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: config.refresh_token,
    client_id: clientId,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (clientSecret) {
    headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
  }

  const resp = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  if (!resp.ok) {
    // Mark as disconnected on refresh failure
    await supabase
      .from('workspace_integrations')
      .update({ status: 'error', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('provider', 'X')
    throw new Error('Token refresh failed. Re-authorize Twitter.')
  }

  const tokens = await resp.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
  }

  const updated: TwitterTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || config.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    scope: tokens.scope,
    token_type: tokens.token_type,
  }

  await storeTokens(workspaceId, updated, config.username)
  return updated.access_token
}

async function storeTokens(workspaceId: string, tokens: TwitterTokens, username?: string) {
  const configJson = { ...tokens, username }

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from('workspace_integrations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'X')
    .single()

  if (existing) {
    await supabase
      .from('workspace_integrations')
      .update({
        status: 'connected',
        config_json: configJson,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('workspace_integrations')
      .insert({
        workspace_id: workspaceId,
        provider: 'X',
        status: 'connected',
        config_json: configJson,
      })
  }
}
