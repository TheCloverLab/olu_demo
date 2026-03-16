/**
 * Support Auto-Reply — triggered by pg_net when a consumer sends a
 * message in a support chat. Checks AI support config and forwards
 * to agent-runtime for an AI response, then writes reply back to DB.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const agentRuntimeUrl = Deno.env.get('AGENT_RUNTIME_URL')
  const apiSecret = Deno.env.get('AGENT_RUNTIME_SECRET') || ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!agentRuntimeUrl) {
    console.error('AGENT_RUNTIME_URL not set')
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.json()
    const { social_chat_id, text, message_id } = body

    if (!social_chat_id || !text) {
      return new Response(JSON.stringify({ skipped: true, reason: 'missing fields' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[support-auto-reply] chat=${social_chat_id} msg=${message_id}`)

    // Look up the chat to find the workspace owner
    const { data: chat } = await supabase
      .from('social_chats')
      .select('with_user_id')
      .eq('id', social_chat_id)
      .single()

    if (!chat) {
      return new Response(JSON.stringify({ skipped: true, reason: 'chat not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find the workspace owned by with_user_id
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('owner_user_id', chat.with_user_id)
      .limit(1)
      .single()

    if (!ws) {
      return new Response(JSON.stringify({ skipped: true, reason: 'workspace not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check AI support enabled
    const { data: config } = await supabase
      .from('workspace_home_configs')
      .select('ai_support_enabled')
      .eq('workspace_id', ws.id)
      .single()

    if (!config?.ai_support_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: 'ai support disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call agent-runtime /chat with default support agent
    const chatPayload: Record<string, unknown> = {
      workspaceId: ws.id,
      agentId: 'support',
      agentName: 'Support Assistant',
      agentRole: `Customer support assistant for ${ws.name}. Reply in the same language as the user. Be concise and helpful.\nYou have tools to query the database in real-time: list_products, list_experiences, get_course_content, search_workspace_content. Use them to answer detailed questions about products, courses, pricing, etc.`,
      message: text,
      sessionId: social_chat_id,
    }

    const chatResp = await fetch(`${agentRuntimeUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiSecret ? { Authorization: `Bearer ${apiSecret}` } : {}) },
      body: JSON.stringify(chatPayload),
    })

    if (!chatResp.ok) {
      console.error(`[support-auto-reply] agent-runtime error: ${chatResp.status}`)
      return new Response(JSON.stringify({ error: 'agent runtime error', status: chatResp.status }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await chatResp.json()
    const replyText = result.response || result.text || ''

    if (!replyText.trim()) {
      return new Response(JSON.stringify({ skipped: true, reason: 'empty response' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Write AI reply to social_chat_messages
    const { error: insertErr } = await supabase
      .from('social_chat_messages')
      .insert({
        social_chat_id,
        from_type: 'other',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })

    if (insertErr) {
      console.error('[support-auto-reply] insert error:', insertErr)
    }

    console.log(`[support-auto-reply] replied: ${replyText.slice(0, 100)}`)

    return new Response(JSON.stringify({ replied: true, agent: agent.name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[support-auto-reply] Error:', error)
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
