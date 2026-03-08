import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type RequestBody = {
  messages?: ChatMessage[]
}

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('data: [ERROR:missing-auth]\n\n', {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const kimiApiKey = Deno.env.get('KIMI_API_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('data: [ERROR:missing-supabase-env]\n\n', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  }

  if (!kimiApiKey) {
    return new Response('data: [ERROR:missing-api-key]\n\n', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError || !authData.user) {
    return new Response('data: [ERROR:invalid-auth]\n\n', {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  }

  const body = (await req.json()) as RequestBody
  const messages = Array.isArray(body.messages) ? body.messages.filter((message) => message?.role && message?.content) : []

  if (messages.length === 0) {
    return new Response('data: [ERROR:missing-messages]\n\n', {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  }

  try {
    const upstream = await fetch('https://api.kimi.com/coding/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiApiKey}`,
        'User-Agent': 'olu-demo/1.0.0',
        'X-Client-Name': 'olu-demo',
      },
      body: JSON.stringify({
        model: 'kimi-for-coding',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      console.error('Kimi error:', upstream.status, await upstream.text())
      return new Response(`data: [ERROR:provider-http-${upstream.status}]\n\n`, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Kimi fetch failed:', error)
    return new Response('data: [ERROR:provider-fetch-failed]\n\n', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }
})
