/**
 * Agent Webhook — receives Supabase Database Webhook events
 * and forwards them to the agent-runtime for processing.
 *
 * Triggered by: INSERT on workspace_agent_tasks
 * Supabase Dashboard → Database → Webhooks → Create
 *   Table: workspace_agent_tasks, Events: INSERT
 *   URL: https://<project>.supabase.co/functions/v1/agent-webhook
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  const agentRuntimeUrl = Deno.env.get('AGENT_RUNTIME_URL')
  if (!agentRuntimeUrl) {
    console.error('AGENT_RUNTIME_URL not set')
    return new Response(JSON.stringify({ error: 'Agent runtime not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    // Supabase Database Webhooks send: { type, table, record, schema, old_record }
    const { type, table, record } = body

    console.log(`[agent-webhook] ${type} on ${table}:`, JSON.stringify(record).slice(0, 200))

    if (type !== 'INSERT' || table !== 'workspace_agent_tasks') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not a task insert' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Forward to agent-runtime webhook endpoint
    const resp = await fetch(`${agentRuntimeUrl}/webhook/task-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record }),
    })

    const result = await resp.json()
    console.log(`[agent-webhook] Runtime response:`, JSON.stringify(result))

    return new Response(JSON.stringify({ forwarded: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[agent-webhook] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
