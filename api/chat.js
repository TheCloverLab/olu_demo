export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body
  const apiKey = process.env.KIMI_API_KEY

  if (!apiKey) {
    console.error('Kimi error: missing KIMI_API_KEY')
    res.setHeader('Content-Type', 'text/event-stream')
    return res.end('data: [ERROR:missing-api-key]\n\n')
  }

  try {
    const upstream = await fetch('https://api.kimi.com/coding/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'claude-code/1.0.0',
        'X-Client-Name': 'claude-code',
      },
      body: JSON.stringify({
        model: 'kimi-for-coding',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('Kimi error:', upstream.status, err)
      res.setHeader('Content-Type', 'text/event-stream')
      return res.end(`data: [ERROR:provider-http-${upstream.status}]\n\n`)
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = upstream.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  } catch (e) {
    console.error('Fetch failed:', e.message)
    res.setHeader('Content-Type', 'text/event-stream')
    res.end(`data: [ERROR:provider-fetch-failed]\n\n`)
  }
}
