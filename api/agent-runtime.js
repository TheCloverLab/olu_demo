/**
 * Vercel Serverless Function — proxy to agent-runtime ALB
 * Matches /api/agent-runtime?path=models etc.
 * Also handles /api/agent-runtime/* via Vercel rewrites.
 */

const AGENT_RUNTIME_ORIGIN = (
  process.env.AGENT_RUNTIME_URL ||
  'http://olu-agent-runtime-alb-316192720.us-west-2.elb.amazonaws.com'
).trim()

const API_SECRET = (process.env.AGENT_RUNTIME_SECRET || '').trim()

module.exports = async function handler(req, res) {
  // Extract the sub-path from query param (set by rewrite) or default to ''
  const subPath = req.query.path || ''
  const target = `${AGENT_RUNTIME_ORIGIN}/${subPath}`
  const url = new URL(target)

  // Forward query params (except our routing 'path' param)
  const incomingUrl = new URL(req.url, `https://${req.headers.host}`)
  incomingUrl.searchParams.forEach((v, k) => {
    if (k !== 'path') url.searchParams.set(k, v)
  })

  // Build forwarded headers (strip host, add auth)
  const headers = {
    'content-type': req.headers['content-type'] || 'application/json',
  }
  if (API_SECRET) {
    headers['authorization'] = `Bearer ${API_SECRET}`
  }

  try {
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    // Forward status and response headers
    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('content-type', ct)

    // Stream response body
    const body = await upstream.text()
    res.send(body)
  } catch (err) {
    console.error('[agent-runtime-proxy] error:', err.message)
    res.status(502).json({ error: 'Agent runtime unreachable' })
  }
}
