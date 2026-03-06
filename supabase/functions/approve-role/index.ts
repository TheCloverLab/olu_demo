import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type RequestBody = {
  applicationId?: string
  action?: 'approved' | 'rejected'
  reviewNote?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const adminToken = req.headers.get('x-admin-token')
  const expectedToken = Deno.env.get('ROLE_REVIEW_ADMIN_TOKEN')

  if (!expectedToken || adminToken !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = (await req.json()) as RequestBody
  const applicationId = body.applicationId
  const action = body.action

  if (!applicationId || !action) {
    return new Response(JSON.stringify({ error: 'applicationId and action are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: app, error: appError } = await adminClient
    .from('role_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !app) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (app.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Application already reviewed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error: updateAppError } = await adminClient
    .from('role_applications')
    .update({
      status: action,
      reviewed_at: new Date().toISOString(),
      review_note: body.reviewNote ?? null,
    })
    .eq('id', applicationId)

  if (updateAppError) {
    return new Response(JSON.stringify({ error: updateAppError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (action === 'approved') {
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('roles, role')
      .eq('id', app.user_id)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found after approval' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : ['fan']
    const nextRoles = Array.from(new Set([...currentRoles, app.target_role]))

    const { error: roleUpdateError } = await adminClient
      .from('users')
      .update({ roles: nextRoles })
      .eq('id', app.user_id)

    if (roleUpdateError) {
      return new Response(JSON.stringify({ error: roleUpdateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response(JSON.stringify({ ok: true, status: action }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
