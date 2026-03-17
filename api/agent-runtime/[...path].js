/**
 * Vercel Serverless Function — proxy to agent-runtime ALB
 * Adds API_SECRET auth header server-side so the frontend never sees the secret.
 */

const AGENT_RUNTIME_ORIGIN = (
  process.env.AGENT_RUNTIME_URL ||
  'http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com'
).trim()

const API_SECRET = (process.env.AGENT_RUNTIME_SECRET || '').trim()

export default async function handler(req, res) {
  // Debug: check if function is hit
  if (req.query.path?.[0] === '_debug') {
    return res.status(200).json({ ok: true, origin: AGENT_RUNTIME_ORIGIN, hasSecret: !!API_SECRET })
  }
  // Build target URL from the catch-all path segments
  const pathSegments = req.query.path || []
  const target = `${AGENT_RUNTIME_ORIGIN}/${Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments}`
  const url = new URL(target)
  // Forward query params
  const incomingUrl = new URL(req.url, `https://${req.headers.host}`)
  incomingUrl.searchParams.forEach((v, k) => {
    if (k !== 'path') url.searchParams.set(k, v)
  })

  // Build forwarded headers (strip host, add auth)
  const headers = { ...req.headers }
  delete headers.host
  delete headers['content-length'] // let fetch recalculate
  if (API_SECRET) {
    headers['authorization'] = `Bearer ${API_SECRET}`
  }

  try {
    console.log('[agent-runtime-proxy] target:', url.toString(), 'method:', req.method)
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      duplex: 'half',
    })
    console.log('[agent-runtime-proxy] upstream status:', upstream.status)

    // Forward status and response headers
    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      // Skip transfer-encoding as Vercel handles it
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value)
      }
    })

    // Stream response body
    const body = await upstream.text()
    res.send(body)
  } catch (err) {
    console.error('[agent-runtime-proxy] error:', err.message)
    res.status(502).json({ error: 'Agent runtime unreachable' })
  }
}
