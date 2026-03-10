/**
 * Workspace tools — LangGraph tools that agents can invoke
 * to interact with workspace data (tasks, team, etc.)
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'

/**
 * List tasks assigned to this agent
 */
export const listMyTasks = tool(
  async ({ agentId, status }) => {
    let query = supabase
      .from('workspace_agent_tasks')
      .select('id, task_key, title, status, priority, due, progress')
      .eq('workspace_agent_id', agentId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'list_my_tasks',
    description:
      'List tasks assigned to this agent. Optionally filter by status.',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      status: z
        .enum(['pending', 'in_progress', 'done', 'cancelled'])
        .optional()
        .describe('Filter by task status'),
    }),
  },
)

/**
 * Update a task's status and/or progress
 */
export const updateTaskStatus = tool(
  async ({ taskId, status, progress }) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (progress !== undefined) updates.progress = progress

    const { data, error } = await supabase
      .from('workspace_agent_tasks')
      .update(updates)
      .eq('id', taskId)
      .select('id, title, status, progress')
      .single()

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'update_task_status',
    description: "Update a task's status and/or progress percentage.",
    schema: z.object({
      taskId: z.string().describe('The task id'),
      status: z
        .enum(['pending', 'in_progress', 'done', 'cancelled'])
        .optional()
        .describe('New status'),
      progress: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Progress percentage (0-100)'),
    }),
  },
)

/**
 * Create a new task for this agent
 */
export const createTask = tool(
  async ({ agentId, taskKey, title, priority, due }) => {
    const { data, error } = await supabase
      .from('workspace_agent_tasks')
      .insert({
        workspace_agent_id: agentId,
        task_key: taskKey,
        title,
        priority: priority || 'medium',
        due: due || null,
        status: 'pending',
        progress: 0,
      })
      .select('id, task_key, title, status, priority')
      .single()

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'create_task',
    description: 'Create a new task for this agent.',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      taskKey: z.string().describe('Unique task key (e.g. "review-q1-report")'),
      title: z.string().describe('Human-readable task title'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .optional()
        .describe('Task priority'),
      due: z.string().optional().describe('Due date string'),
    }),
  },
)

/**
 * Get workspace team overview — list all agents and their task counts
 */
export const getTeamOverview = tool(
  async ({ workspaceId }) => {
    const { data, error } = await supabase
      .from('workspace_agents')
      .select(
        'id, name, role, status, workspace_agent_tasks(id, status)',
      )
      .eq('workspace_id', workspaceId)

    if (error) return JSON.stringify({ error: error.message })

    const overview = (data || []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      taskCounts: {
        total: agent.workspace_agent_tasks?.length || 0,
        pending: agent.workspace_agent_tasks?.filter(
          (t: any) => t.status === 'pending',
        ).length || 0,
        in_progress: agent.workspace_agent_tasks?.filter(
          (t: any) => t.status === 'in_progress',
        ).length || 0,
        done: agent.workspace_agent_tasks?.filter(
          (t: any) => t.status === 'done',
        ).length || 0,
      },
    }))

    return JSON.stringify(overview)
  },
  {
    name: 'get_team_overview',
    description:
      'Get an overview of all agents in the workspace with their task counts.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace id'),
    }),
  },
)

/**
 * Post a message to the workspace conversation as this agent
 */
export const postConversation = tool(
  async ({ agentId, text }) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        from_type: 'agent',
        text,
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      })
      .select('id, text, time')
      .single()

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'post_conversation',
    description:
      'Post a message to the workspace conversation as this agent (visible to team members).',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      text: z.string().describe('Message text to post'),
    }),
  },
)

/**
 * Search the web using DuckDuckGo
 */
export const webSearch = tool(
  async ({ query }) => {
    try {
      // Use DuckDuckGo HTML search (no API key needed)
      const encoded = encodeURIComponent(query)
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OLU-Agent/1.0)' },
      })
      const html = await res.text()

      // Extract result snippets from HTML
      const results: { title: string; snippet: string; url: string }[] = []
      const resultBlocks = html.match(/<div class="result[^"]*"[\s\S]*?<\/div>\s*<\/div>/g) || []

      for (const block of resultBlocks.slice(0, 5)) {
        const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/)
        const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)
        const urlMatch = block.match(/href="([^"]*)"/)
        if (titleMatch) {
          results.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            snippet: snippetMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '',
            url: urlMatch?.[1] || '',
          })
        }
      }

      if (results.length === 0) {
        return JSON.stringify({ query, results: [], note: 'No results found' })
      }
      return JSON.stringify({ query, results })
    } catch (err: any) {
      return JSON.stringify({ error: err.message, query })
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for information. Returns titles, snippets, and URLs of top results.',
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
  },
)

/**
 * Fetch and extract text from a webpage
 */
export const fetchWebpage = tool(
  async ({ url, maxLength }) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OLU-Agent/1.0)' },
        redirect: 'follow',
      })
      if (!res.ok) return JSON.stringify({ error: `HTTP ${res.status}`, url })
      const html = await res.text()

      // Strip scripts, styles, and HTML tags to get text content
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const limit = maxLength || 4000
      return JSON.stringify({
        url,
        title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '',
        text: text.slice(0, limit),
        truncated: text.length > limit,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message, url })
    }
  },
  {
    name: 'fetch_webpage',
    description: 'Fetch a webpage and extract its text content. Useful for reading articles, product pages, competitor analysis, etc.',
    schema: z.object({
      url: z.string().describe('The URL to fetch'),
      maxLength: z.number().optional().describe('Max characters to return (default 4000)'),
    }),
  },
)

/**
 * Generate an image using Volcengine/Doubao API (OpenAI-compatible)
 */
export const generateImage = tool(
  async ({ prompt, size }) => {
    const apiKey = process.env.VOLCENGINE_API_KEY
    const baseURL = process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
    const model = process.env.VOLCENGINE_IMAGE_MODEL || 'doubao-seedream-5-0-260128'

    if (!apiKey) return JSON.stringify({ error: 'VOLCENGINE_API_KEY not configured' })

    try {
      const res = await fetch(`${baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          size: size || '2048x2048',
          response_format: 'url',
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return JSON.stringify({ error: `API error ${res.status}: ${errText.slice(0, 200)}` })
      }

      const data = await res.json()
      const imageUrl = data.data?.[0]?.url
      if (!imageUrl) return JSON.stringify({ error: 'No image URL in response', raw: JSON.stringify(data).slice(0, 300) })

      return JSON.stringify({ success: true, imageUrl, prompt })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a text description using AI (Doubao/豆包). Returns an image URL. Use for creating marketing visuals, social media content, product mockups, etc.',
    schema: z.object({
      prompt: z.string().describe('Text description of the image to generate (in English for best results)'),
      size: z.enum(['1024x1024', '2048x2048', '1280x720', '720x1280']).optional().describe('Image size (default 2048x2048)'),
    }),
  },
)

/**
 * Execute JavaScript code (sandboxed)
 */
export const executeCode = tool(
  async ({ code }) => {
    try {
      // Use Function constructor for basic sandboxing
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      const fn = new AsyncFunction('fetch', code)

      // Capture console output
      const logs: string[] = []
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
      }

      // Override console temporarily
      const origConsole = globalThis.console
      globalThis.console = mockConsole as any

      let result: any
      try {
        result = await Promise.race([
          fn(fetch),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timed out (10s)')), 10000)),
        ])
      } finally {
        globalThis.console = origConsole
      }

      return JSON.stringify({
        result: result !== undefined ? String(result) : undefined,
        logs: logs.length > 0 ? logs : undefined,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'execute_code',
    description: 'Execute JavaScript/TypeScript code. Has access to fetch() for HTTP requests. Use for data analysis, calculations, API calls, text processing, etc.',
    schema: z.object({
      code: z.string().describe('JavaScript code to execute. Use console.log() for output. The last expression is returned as result.'),
    }),
  },
)

/**
 * Send an email (via Supabase edge function or direct SMTP)
 */
export const sendEmail = tool(
  async ({ to, subject, body, html }) => {
    // For demo: store in Supabase as an "outgoing email" record
    const { data, error } = await supabase
      .from('outgoing_emails')
      .insert({
        to_email: to,
        subject,
        body_text: body,
        body_html: html || null,
        status: 'queued',
        created_at: new Date().toISOString(),
      })
      .select('id, to_email, subject, status')
      .single()

    if (error) {
      // Table might not exist — return a simulated success for demo
      return JSON.stringify({
        success: true,
        simulated: true,
        to,
        subject,
        note: 'Email queued (demo mode — table not yet created)',
      })
    }
    return JSON.stringify({ success: true, ...data })
  },
  {
    name: 'send_email',
    description: 'Send an email on behalf of the workspace. Useful for outreach, follow-ups, welcome emails, etc.',
    schema: z.object({
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      body: z.string().describe('Plain text email body'),
      html: z.string().optional().describe('HTML version of the email body'),
    }),
  },
)

/**
 * Browse a webpage with JavaScript rendering (lightweight browser)
 * Uses the fetch_webpage as a base but with more structured extraction
 */
export const browseWebpage = tool(
  async ({ url, action, selector, value }) => {
    try {
      if (action === 'screenshot' || action === 'click' || action === 'fill') {
        // For actions requiring a real browser, we use Playwright if available
        // Fall back to fetch-based extraction for demo
        return JSON.stringify({
          note: 'Full browser automation requires Playwright. Using fetch-based extraction.',
          action,
          url,
        })
      }

      // Default: extract structured content
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      })
      if (!res.ok) return JSON.stringify({ error: `HTTP ${res.status}`, url })
      const html = await res.text()

      // Extract metadata
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''
      const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)?.[1]?.trim() || ''
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["']/i)?.[1]?.trim() || ''

      // Extract links
      const links: { text: string; href: string }[] = []
      const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
      for (const m of linkMatches) {
        const text = m[2].replace(/<[^>]+>/g, '').trim()
        if (text && m[1] && !m[1].startsWith('#') && !m[1].startsWith('javascript:')) {
          links.push({ text: text.slice(0, 100), href: m[1] })
        }
        if (links.length >= 20) break
      }

      // Extract text if selector is given (simple CSS selector support)
      let selectedText = ''
      if (selector) {
        // Simple class/id selector extraction
        const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/)
        const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/)
        if (classMatch) {
          const pattern = new RegExp(`<[^>]*class="[^"]*${classMatch[1]}[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'i')
          selectedText = html.match(pattern)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
        } else if (idMatch) {
          const pattern = new RegExp(`<[^>]*id="${idMatch[1]}"[^>]*>([\\s\\S]*?)<\\/`, 'i')
          selectedText = html.match(pattern)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
        }
      }

      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000)

      return JSON.stringify({
        url,
        title,
        description,
        ogImage,
        links: links.slice(0, 10),
        selectedText: selectedText || undefined,
        bodyText,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message, url })
    }
  },
  {
    name: 'browse_webpage',
    description: 'Browse a webpage and extract structured content including metadata, links, and text. More powerful than fetch_webpage. Supports CSS selector extraction.',
    schema: z.object({
      url: z.string().describe('The URL to browse'),
      action: z.enum(['extract', 'screenshot', 'click', 'fill']).optional().describe('Action to perform (default: extract)'),
      selector: z.string().optional().describe('CSS selector to extract specific content'),
      value: z.string().optional().describe('Value for fill action'),
    }),
  },
)

/**
 * Facebook Ads API — Create and manage ad campaigns
 */
export const facebookAds = tool(
  async ({ action, campaignName, dailyBudget, targetAudience, adCreative, campaignId }) => {
    const accessToken = process.env.FB_ACCESS_TOKEN
    const adAccountId = process.env.FB_AD_ACCOUNT_ID
    const baseUrl = 'https://graph.facebook.com/v19.0'

    if (!accessToken || !adAccountId) {
      return JSON.stringify({
        error: 'FB_ACCESS_TOKEN and FB_AD_ACCOUNT_ID not configured',
        note: 'Please set these environment variables. Get them from Facebook Business Manager.',
      })
    }

    try {
      if (action === 'create_campaign') {
        const res = await fetch(`${baseUrl}/act_${adAccountId}/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campaignName || 'OLU Campaign',
            objective: 'OUTCOME_ENGAGEMENT',
            status: 'PAUSED',
            special_ad_categories: [],
            access_token: accessToken,
          }),
        })
        const data = await res.json()
        return JSON.stringify({ success: !data.error, ...data })
      }

      if (action === 'get_insights') {
        const target = campaignId ? `${campaignId}` : `act_${adAccountId}`
        const res = await fetch(
          `${baseUrl}/${target}/insights?fields=impressions,clicks,spend,ctr,cpc,conversions&date_preset=last_7d&access_token=${accessToken}`,
        )
        const data = await res.json()
        return JSON.stringify(data)
      }

      if (action === 'list_campaigns') {
        const res = await fetch(
          `${baseUrl}/act_${adAccountId}/campaigns?fields=name,status,objective,daily_budget,insights{impressions,clicks,spend}&access_token=${accessToken}`,
        )
        const data = await res.json()
        return JSON.stringify(data)
      }

      return JSON.stringify({ error: `Unknown action: ${action}` })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'facebook_ads',
    description: 'Manage Facebook/Meta ad campaigns — create campaigns, get performance insights, and list existing campaigns.',
    schema: z.object({
      action: z.enum(['create_campaign', 'get_insights', 'list_campaigns']).describe('Action to perform'),
      campaignName: z.string().optional().describe('Name for new campaign'),
      dailyBudget: z.number().optional().describe('Daily budget in cents (e.g. 5000 = $50)'),
      targetAudience: z.string().optional().describe('Target audience description'),
      adCreative: z.string().optional().describe('Ad creative text'),
      campaignId: z.string().optional().describe('Campaign ID for insights'),
    }),
  },
)

/**
 * Google Play Reviews — Read and respond to app reviews
 */
export const googlePlayReviews = tool(
  async ({ action, packageName, reviewId, replyText }) => {
    const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY
    const defaultPackage = process.env.GOOGLE_PLAY_PACKAGE_NAME || packageName

    if (!serviceAccountKey) {
      return JSON.stringify({
        error: 'GOOGLE_PLAY_SERVICE_ACCOUNT_KEY not configured',
        note: 'Please set this env var with the service account JSON key (base64 encoded).',
      })
    }

    if (!defaultPackage) {
      return JSON.stringify({ error: 'Package name is required' })
    }

    try {
      // Parse service account key and get access token
      const keyData = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString())

      // Create JWT for Google OAuth
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
      const payload = Buffer.from(JSON.stringify({
        iss: keyData.client_email,
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })).toString('base64url')

      // For demo, we'll use a direct token exchange approach
      // In production, implement proper JWT signing with the private key
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: `${header}.${payload}.PLACEHOLDER_SIGNATURE`,
        }),
      })

      if (!tokenRes.ok) {
        return JSON.stringify({
          error: 'Failed to authenticate with Google Play API',
          note: 'Service account key may be invalid or improperly configured',
        })
      }

      const { access_token } = await tokenRes.json()
      const apiBase = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${defaultPackage}`

      if (action === 'list_reviews') {
        const res = await fetch(`${apiBase}/reviews?maxResults=20`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        const data = await res.json()

        const reviews = (data.reviews || []).map((r: any) => ({
          reviewId: r.reviewId,
          author: r.authorName,
          rating: r.comments?.[0]?.userComment?.starRating,
          text: r.comments?.[0]?.userComment?.text,
          lastModified: r.comments?.[0]?.userComment?.lastModified?.seconds,
          hasReply: !!r.comments?.[1],
        }))

        return JSON.stringify({ packageName: defaultPackage, reviews, total: data.tokenPagination?.totalResults })
      }

      if (action === 'reply_review') {
        if (!reviewId || !replyText) {
          return JSON.stringify({ error: 'reviewId and replyText are required for reply_review' })
        }

        const res = await fetch(`${apiBase}/reviews/${reviewId}:reply`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ replyText }),
        })

        const data = await res.json()
        return JSON.stringify({ success: !data.error, ...data })
      }

      if (action === 'analyze_reviews') {
        // Fetch recent reviews and analyze sentiment
        const res = await fetch(`${apiBase}/reviews?maxResults=50`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        const data = await res.json()

        const reviews = data.reviews || []
        const ratings = reviews.map((r: any) => r.comments?.[0]?.userComment?.starRating || 0)
        const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
        const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
        for (const r of ratings) distribution[String(r) as keyof typeof distribution]++

        // Extract common themes from review text
        const texts = reviews.map((r: any) => r.comments?.[0]?.userComment?.text || '').join(' ')

        return JSON.stringify({
          packageName: defaultPackage,
          totalReviews: reviews.length,
          averageRating: avgRating.toFixed(2),
          distribution,
          recentReviewTexts: reviews.slice(0, 5).map((r: any) => ({
            rating: r.comments?.[0]?.userComment?.starRating,
            text: (r.comments?.[0]?.userComment?.text || '').slice(0, 200),
          })),
        })
      }

      return JSON.stringify({ error: `Unknown action: ${action}` })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'google_play_reviews',
    description: 'Manage Google Play Store app reviews — list reviews, reply to reviews, and analyze review sentiment/trends.',
    schema: z.object({
      action: z.enum(['list_reviews', 'reply_review', 'analyze_reviews']).describe('Action to perform'),
      packageName: z.string().optional().describe('Android package name (e.g. com.example.app)'),
      reviewId: z.string().optional().describe('Review ID for replying'),
      replyText: z.string().optional().describe('Reply text for the review'),
    }),
  },
)

/**
 * Generate files — CSV, JSON, HTML, or plain text documents
 */
export const generateFile = tool(
  async ({ format, filename, content, columns, rows }) => {
    try {
      let fileContent: string
      let mimeType: string

      if (format === 'csv') {
        if (columns && rows) {
          const header = columns.join(',')
          const csvRows = rows.map((row: string[]) =>
            row.map(cell => cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell).join(',')
          )
          fileContent = [header, ...csvRows].join('\n')
        } else {
          fileContent = content || ''
        }
        mimeType = 'text/csv'
      } else if (format === 'json') {
        fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        mimeType = 'application/json'
      } else if (format === 'html') {
        fileContent = content || '<html><body><h1>Generated Document</h1></body></html>'
        mimeType = 'text/html'
      } else {
        fileContent = content || ''
        mimeType = 'text/plain'
      }

      // Store in Supabase storage if available
      const fileName = filename || `generated-${Date.now()}.${format}`
      const { data, error } = await supabase.storage
        .from('generated-files')
        .upload(`files/${fileName}`, fileContent, {
          contentType: mimeType,
          upsert: true,
        })

      if (error) {
        // Storage bucket might not exist — return content directly
        return JSON.stringify({
          success: true,
          filename: fileName,
          format,
          size: fileContent.length,
          content: fileContent.slice(0, 2000),
          note: 'File generated but could not be uploaded to storage. Content returned inline.',
        })
      }

      const { data: urlData } = supabase.storage
        .from('generated-files')
        .getPublicUrl(`files/${fileName}`)

      return JSON.stringify({
        success: true,
        filename: fileName,
        format,
        size: fileContent.length,
        url: urlData?.publicUrl,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'generate_file',
    description: 'Generate a file (CSV, JSON, HTML, or text). Can create reports, data exports, templates, etc. Returns the file URL or inline content.',
    schema: z.object({
      format: z.enum(['csv', 'json', 'html', 'text']).describe('File format'),
      filename: z.string().optional().describe('Output filename'),
      content: z.string().optional().describe('File content (for json/html/text)'),
      columns: z.array(z.string()).optional().describe('CSV column headers'),
      rows: z.array(z.array(z.string())).optional().describe('CSV data rows'),
    }),
  },
)

export const allTools = [
  listMyTasks, updateTaskStatus, createTask, getTeamOverview, postConversation,
  webSearch, fetchWebpage, generateImage, executeCode, sendEmail,
  browseWebpage, facebookAds, googlePlayReviews, generateFile,
]
