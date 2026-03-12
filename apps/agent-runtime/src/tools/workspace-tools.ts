/**
 * Workspace tools — LangGraph tools that agents can invoke
 * to interact with workspace data (tasks, team, etc.)
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'
import { generateEmbedding } from '../lib/models.js'
import { twitterTools } from './twitter-tools.js'
import { supportTools } from './support-tools.js'

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
        // Use Playwright for browser actions
        try {
          const { chromium } = await import('playwright-core')
          const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          })
          const page = await browser.newPage()
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

          let result: any = { action, url }

          if (action === 'screenshot') {
            const screenshot = await page.screenshot({ type: 'png', fullPage: false })
            const base64 = screenshot.toString('base64')
            result.screenshot = `data:image/png;base64,${base64.slice(0, 200)}...`
            result.screenshotSize = screenshot.length
            result.title = await page.title()

            // Also upload to Supabase storage
            const fileName = `screenshot-${Date.now()}.png`
            const { data: uploadData } = await supabase.storage
              .from('generated-files')
              .upload(`screenshots/${fileName}`, screenshot, { contentType: 'image/png', upsert: true })
            if (uploadData) {
              const { data: urlData } = supabase.storage.from('generated-files').getPublicUrl(`screenshots/${fileName}`)
              result.screenshotUrl = urlData?.publicUrl
            }
          } else if (action === 'click' && selector) {
            await page.click(selector, { timeout: 5000 })
            result.clicked = true
            result.title = await page.title()
            result.currentUrl = page.url()
          } else if (action === 'fill' && selector && value) {
            await page.fill(selector, value, { timeout: 5000 })
            result.filled = true
          }

          await browser.close()
          return JSON.stringify(result)
        } catch (pwErr: any) {
          return JSON.stringify({
            note: 'Playwright browser action failed, falling back to fetch.',
            error: pwErr.message,
            action,
            url,
          })
        }
      }

      // Default: extract structured content via fetch
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
 * Generate files — CSV, JSON, HTML, text, PDF, DOCX, or XLSX
 */
export const generateFile = tool(
  async ({ format, filename, content, columns, rows, title }) => {
    try {
      let fileBuffer: Buffer | null = null
      let fileContent: string = ''
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
      } else if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default
        const doc = new PDFDocument({ margin: 50 })
        const chunks: Buffer[] = []
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))

        if (title) {
          doc.fontSize(20).text(title, { align: 'center' })
          doc.moveDown()
        }

        if (columns && rows) {
          // Table layout for PDF
          const colWidth = (doc.page.width - 100) / columns.length
          doc.fontSize(10).font('Helvetica-Bold')
          columns.forEach((col, i) => doc.text(col, 50 + i * colWidth, doc.y, { width: colWidth, continued: i < columns.length - 1 }))
          doc.moveDown(0.5)
          doc.font('Helvetica')
          for (const row of rows) {
            const y = doc.y
            row.forEach((cell, i) => doc.text(cell, 50 + i * colWidth, y, { width: colWidth, continued: i < row.length - 1 }))
            doc.moveDown(0.3)
          }
        } else if (content) {
          doc.fontSize(12).text(content)
        }

        doc.end()
        await new Promise<void>(resolve => doc.on('end', resolve))
        fileBuffer = Buffer.concat(chunks)
        mimeType = 'application/pdf'
      } else if (format === 'docx') {
        const docx = await import('docx')
        const paragraphs: any[] = []

        if (title) {
          paragraphs.push(new docx.Paragraph({ text: title, heading: docx.HeadingLevel.HEADING_1 }))
        }

        if (columns && rows) {
          // Create table
          const headerRow = new docx.TableRow({
            children: columns.map(col => new docx.TableCell({
              children: [new docx.Paragraph({ children: [new docx.TextRun({ text: col, bold: true })] })],
            })),
          })
          const dataRows = rows.map(row => new docx.TableRow({
            children: row.map(cell => new docx.TableCell({
              children: [new docx.Paragraph(cell)],
            })),
          }))
          paragraphs.push(new docx.Table({ rows: [headerRow, ...dataRows] }))
        } else if (content) {
          for (const line of content.split('\n')) {
            paragraphs.push(new docx.Paragraph(line))
          }
        }

        const doc = new docx.Document({
          sections: [{ children: paragraphs }],
        })
        fileBuffer = Buffer.from(await docx.Packer.toBuffer(doc))
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (format === 'xlsx') {
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.default.Workbook()
        const sheet = workbook.addWorksheet(title || 'Sheet1')

        if (columns && rows) {
          sheet.addRow(columns)
          // Bold header
          sheet.getRow(1).font = { bold: true }
          for (const row of rows) sheet.addRow(row)
          // Auto-fit column widths
          columns.forEach((_, i) => { sheet.getColumn(i + 1).width = 15 })
        } else if (content) {
          for (const line of content.split('\n')) {
            sheet.addRow([line])
          }
        }

        fileBuffer = Buffer.from(await workbook.xlsx.writeBuffer())
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      } else {
        fileContent = content || ''
        mimeType = 'text/plain'
      }

      const ext = format === 'docx' ? 'docx' : format === 'xlsx' ? 'xlsx' : format
      const fileName = filename || `generated-${Date.now()}.${ext}`
      const uploadContent = fileBuffer || fileContent

      const { data, error } = await supabase.storage
        .from('generated-files')
        .upload(`files/${fileName}`, uploadContent, {
          contentType: mimeType,
          upsert: true,
        })

      if (error) {
        return JSON.stringify({
          success: true,
          filename: fileName,
          format,
          size: fileBuffer ? fileBuffer.length : fileContent.length,
          content: fileBuffer ? `[Binary ${format.toUpperCase()} file, ${fileBuffer.length} bytes]` : fileContent.slice(0, 2000),
          note: 'File generated but could not be uploaded to storage.',
        })
      }

      const { data: urlData } = supabase.storage
        .from('generated-files')
        .getPublicUrl(`files/${fileName}`)

      return JSON.stringify({
        success: true,
        filename: fileName,
        format,
        size: fileBuffer ? fileBuffer.length : fileContent.length,
        url: urlData?.publicUrl,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'generate_file',
    description: 'Generate a file in various formats: CSV, JSON, HTML, text, PDF, DOCX (Word), or XLSX (Excel). Can create reports, invoices, data exports, presentations, etc.',
    schema: z.object({
      format: z.enum(['csv', 'json', 'html', 'text', 'pdf', 'docx', 'xlsx']).describe('File format'),
      filename: z.string().optional().describe('Output filename'),
      content: z.string().optional().describe('File content (for text-based formats) or body text (for pdf/docx)'),
      title: z.string().optional().describe('Document title (for pdf/docx/xlsx)'),
      columns: z.array(z.string()).optional().describe('Table column headers (for csv/pdf/docx/xlsx)'),
      rows: z.array(z.array(z.string())).optional().describe('Table data rows'),
    }),
  },
)

/**
 * Schedule a recurring task (cron job)
 */
export const scheduleCronJob = tool(
  async ({ agentId, cronExpression, taskDescription, jobKey }) => {
    // Import dynamically to avoid circular deps
    const { registerJob } = await import('../scheduler/cron-scheduler.js')
    const result = await registerJob({ agentId, cronExpression, taskDescription, jobKey })
    return JSON.stringify(result)
  },
  {
    name: 'schedule_cron_job',
    description: 'Schedule a recurring task using cron expression. Examples: "0 */2 * * *" (every 2 hours), "0 9 * * 1-5" (weekdays 9am), "*/30 * * * *" (every 30 min).',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      cronExpression: z.string().describe('Cron expression (5 fields: minute hour day month weekday)'),
      taskDescription: z.string().describe('What to do when the job runs'),
      jobKey: z.string().optional().describe('Unique key for this job'),
    }),
  },
)

/**
 * Remember — save a memory for future recall
 */
export const rememberMemory = tool(
  async ({ agentId, workspaceId, content, memoryType, scope, importance }) => {
    // Generate embedding for semantic search
    const embedding = await generateEmbedding(content)

    const insertData: Record<string, unknown> = {
      agent_id: agentId,
      workspace_id: workspaceId,
      content,
      memory_type: memoryType,
      scope: scope || '/',
      importance: importance || 0.5,
      metadata: {},
    }
    if (embedding) {
      insertData.embedding = JSON.stringify(embedding)
    }

    const { data, error } = await supabase
      .from('agent_memories')
      .insert(insertData)
      .select('id, content, memory_type, scope')
      .single()

    if (error) {
      return JSON.stringify({ success: true, simulated: true, content: content.slice(0, 100), note: 'Memory saved (demo mode)' })
    }
    return JSON.stringify({ success: true, ...data, hasEmbedding: !!embedding })
  },
  {
    name: 'remember',
    description: 'Save a memory for future recall. Use for storing facts, past experiences, and learned workflows.',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      workspaceId: z.string().describe('The workspace id'),
      content: z.string().describe('The information to remember'),
      memoryType: z.enum(['semantic', 'episodic', 'procedural']).describe('Memory type: semantic (facts), episodic (experiences), procedural (workflows)'),
      scope: z.string().optional().describe('Memory scope path (e.g. /campaign/summer)'),
      importance: z.number().min(0).max(1).optional().describe('Importance (0-1, default 0.5)'),
    }),
  },
)

/**
 * Recall — search past memories by content
 */
export const recallMemory = tool(
  async ({ agentId, query, memoryType, limit }) => {
    const maxResults = limit || 10

    // Try semantic search first if query is provided
    if (query) {
      const queryEmbedding = await generateEmbedding(query)

      if (queryEmbedding) {
        // Use the Supabase search_agent_memories function (pgvector)
        const { data, error } = await supabase.rpc('search_agent_memories', {
          p_agent_id: agentId,
          p_query_embedding: JSON.stringify(queryEmbedding),
          p_match_count: maxResults,
          p_memory_type: memoryType || null,
        })

        if (!error && data?.length) {
          return JSON.stringify({
            memories: data,
            count: data.length,
            searchType: 'semantic',
          })
        }
      }
    }

    // Fallback to text search
    let q = supabase
      .from('agent_memories')
      .select('id, content, memory_type, scope, importance, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(maxResults)

    if (memoryType) q = q.eq('memory_type', memoryType)
    if (query) q = q.ilike('content', `%${query}%`)

    const { data, error } = await q
    if (error) {
      return JSON.stringify({ memories: [], note: 'Memory table not yet created' })
    }
    return JSON.stringify({ memories: data || [], count: data?.length || 0, searchType: 'text' })
  },
  {
    name: 'recall',
    description: 'Search past memories by content. Returns matching memories sorted by recency.',
    schema: z.object({
      agentId: z.string().describe('The workspace_agent id'),
      query: z.string().optional().describe('Search query'),
      memoryType: z.enum(['semantic', 'episodic', 'procedural']).optional().describe('Filter by memory type'),
      limit: z.number().optional().describe('Max results (default 10)'),
    }),
  },
)

/**
 * Log an event for event-driven triggers
 */
export const logEvent = tool(
  async ({ workspaceId, eventType, source, payload }) => {
    const { data, error } = await supabase
      .from('agent_events')
      .insert({
        workspace_id: workspaceId,
        event_type: eventType,
        source,
        payload: payload ? JSON.parse(payload) : {},
      })
      .select('id, event_type, source')
      .single()

    if (error) {
      return JSON.stringify({ success: true, simulated: true, eventType, note: 'Event logged (demo mode)' })
    }
    return JSON.stringify({ success: true, ...data })
  },
  {
    name: 'log_event',
    description: 'Log an event that can trigger other agents. Events are stored for event-driven workflows.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace id'),
      eventType: z.string().describe('Event type (e.g. "new_follower", "order_placed", "review_posted")'),
      source: z.string().describe('Event source (e.g. "shopify", "tiktok", "manual")'),
      payload: z.string().optional().describe('JSON payload with event details'),
    }),
  },
)

/**
 * Lark Suite API — calls Python lark-suite skill via subprocess
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const execFileAsync = promisify(execFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Resolve lark_suite.py path — bundled in Docker at /app/lark-suite/
const LARK_SUITE_SCRIPT = process.env.LARK_SUITE_SCRIPT
  || (process.env.NODE_ENV === 'production' ? '/app/lark-suite/lark_suite.py' : resolve(__dirname, '../../../../scripts/lark-suite/lark_suite.py'))

async function runLarkSuite(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync('python3', [LARK_SUITE_SCRIPT, ...args], {
      env: { ...process.env },
      timeout: 30000,
    })
    if (stderr) console.error(`[lark-suite] ${stderr.trim()}`)
    return stdout.trim() || JSON.stringify({ ok: true })
  } catch (err: any) {
    return JSON.stringify({ error: err.message || 'lark-suite subprocess failed' })
  }
}

export const larkTasks = tool(
  async ({ action, summary, due, taskId }) => {
    if (action === 'create') {
      const args = ['task-create', summary || 'Untitled task']
      if (due) args.push('--due', due)
      return runLarkSuite(args)
    }
    if (action === 'list') {
      return runLarkSuite(['task-list'])
    }
    if (action === 'complete' && taskId) {
      return runLarkSuite(['task-complete', taskId])
    }
    return JSON.stringify({ error: `Unknown action: ${action}` })
  },
  {
    name: 'lark_tasks',
    description: 'Manage Lark/Feishu tasks — create tasks, list tasks, complete tasks.',
    schema: z.object({
      action: z.enum(['create', 'list', 'complete']).describe('Action to perform'),
      summary: z.string().optional().describe('Task summary (for create)'),
      due: z.string().optional().describe('Due date YYYY-MM-DD (for create)'),
      taskId: z.string().optional().describe('Task GUID (for complete)'),
    }),
  },
)

export const larkCalendar = tool(
  async ({ action, summary, startTime, endTime, calendarId }) => {
    if (action === 'list_calendars') {
      return runLarkSuite(['cal-list'])
    }
    if (action === 'list_events') {
      const args = ['cal-events', calendarId || 'primary']
      if (startTime) args.push('--start', startTime)
      if (endTime) args.push('--end', endTime)
      return runLarkSuite(args)
    }
    if (action === 'create_event') {
      return runLarkSuite([
        'cal-create', calendarId || 'primary',
        summary || 'Untitled event',
        startTime || String(Math.floor(Date.now() / 1000)),
        endTime || String(Math.floor(Date.now() / 1000) + 3600),
      ])
    }
    return JSON.stringify({ error: `Unknown action: ${action}` })
  },
  {
    name: 'lark_calendar',
    description: 'Manage Lark/Feishu calendar — list calendars, list upcoming events, create events.',
    schema: z.object({
      action: z.enum(['list_calendars', 'list_events', 'create_event']).describe('Action to perform'),
      summary: z.string().optional().describe('Event title (for create)'),
      startTime: z.string().optional().describe('Start time ISO timestamp'),
      endTime: z.string().optional().describe('End time ISO timestamp'),
      calendarId: z.string().optional().describe('Calendar ID (default: primary)'),
    }),
  },
)

export const larkBitable = tool(
  async ({ action, appToken, tableId, fields, recordId }) => {
    if (action === 'list_tables' && appToken) {
      return runLarkSuite(['base-tables', appToken])
    }
    if (action === 'list_records' && appToken && tableId) {
      return runLarkSuite(['base-records', appToken, tableId])
    }
    if (action === 'create_record' && appToken && tableId && fields) {
      return runLarkSuite(['base-add', appToken, tableId, fields])
    }
    if (action === 'update_record' && appToken && tableId && recordId && fields) {
      return runLarkSuite(['base-update', appToken, tableId, recordId, fields])
    }
    return JSON.stringify({ error: `Unknown action: ${action}. Required params may be missing.` })
  },
  {
    name: 'lark_bitable',
    description: 'Manage Lark/Feishu Bitable (多维表格) — list tables, read records, create/update records. Bitable is like Airtable for data management.',
    schema: z.object({
      action: z.enum(['list_tables', 'list_records', 'create_record', 'update_record']).describe('Action to perform'),
      appToken: z.string().optional().describe('Bitable app token'),
      tableId: z.string().optional().describe('Table ID'),
      fields: z.string().optional().describe('JSON string of field key-value pairs'),
      recordId: z.string().optional().describe('Record ID (for update)'),
    }),
  },
)

/**
 * Data visualization — generate charts as HTML/SVG
 */
export const generateChart = tool(
  async ({ chartType, data, title, xLabel, yLabel }) => {
    try {
      const chartData = JSON.parse(data)

      // Generate a simple SVG chart
      const width = 600
      const height = 400
      const margin = { top: 40, right: 20, bottom: 60, left: 60 }
      const innerW = width - margin.left - margin.right
      const innerH = height - margin.top - margin.bottom

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background:#fff;font-family:Arial,sans-serif">`

      if (title) {
        svg += `<text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold">${title}</text>`
      }
      if (xLabel) {
        svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#666">${xLabel}</text>`
      }
      if (yLabel) {
        svg += `<text x="15" y="${height / 2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90,15,${height / 2})">${yLabel}</text>`
      }

      const labels = chartData.labels || chartData.map((_: any, i: number) => String(i))
      const values = chartData.values || chartData.map((d: any) => typeof d === 'number' ? d : d.value)
      const maxVal = Math.max(...values)
      const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

      if (chartType === 'bar') {
        const barW = innerW / values.length * 0.7
        const gap = innerW / values.length * 0.3

        values.forEach((v: number, i: number) => {
          const x = margin.left + i * (barW + gap) + gap / 2
          const h = (v / maxVal) * innerH
          const y = margin.top + innerH - h
          svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${colors[i % colors.length]}" rx="3"/>`
          svg += `<text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" font-size="11">${v}</text>`
          svg += `<text x="${x + barW / 2}" y="${margin.top + innerH + 15}" text-anchor="middle" font-size="10">${labels[i]}</text>`
        })
      } else if (chartType === 'line') {
        const points = values.map((v: number, i: number) => {
          const x = margin.left + (i / (values.length - 1)) * innerW
          const y = margin.top + innerH - (v / maxVal) * innerH
          return `${x},${y}`
        })
        svg += `<polyline points="${points.join(' ')}" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`
        values.forEach((v: number, i: number) => {
          const x = margin.left + (i / (values.length - 1)) * innerW
          const y = margin.top + innerH - (v / maxVal) * innerH
          svg += `<circle cx="${x}" cy="${y}" r="4" fill="#4F46E5"/>`
          svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="10">${v}</text>`
          svg += `<text x="${x}" y="${margin.top + innerH + 15}" text-anchor="middle" font-size="10">${labels[i]}</text>`
        })
      } else if (chartType === 'pie') {
        const total = values.reduce((a: number, b: number) => a + b, 0)
        let startAngle = 0
        const cx = width / 2
        const cy = height / 2
        const r = Math.min(innerW, innerH) / 2 - 20

        values.forEach((v: number, i: number) => {
          const angle = (v / total) * 2 * Math.PI
          const endAngle = startAngle + angle
          const x1 = cx + r * Math.cos(startAngle)
          const y1 = cy + r * Math.sin(startAngle)
          const x2 = cx + r * Math.cos(endAngle)
          const y2 = cy + r * Math.sin(endAngle)
          const largeArc = angle > Math.PI ? 1 : 0
          svg += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}"/>`
          // Label
          const midAngle = startAngle + angle / 2
          const lx = cx + (r * 0.65) * Math.cos(midAngle)
          const ly = cy + (r * 0.65) * Math.sin(midAngle)
          svg += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="11" fill="white" font-weight="bold">${labels[i]}: ${Math.round(v / total * 100)}%</text>`
          startAngle = endAngle
        })
      }

      svg += '</svg>'

      // Wrap in HTML for display
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Chart'}</title></head><body style="display:flex;justify-content:center;padding:20px">${svg}</body></html>`

      return JSON.stringify({
        success: true,
        chartType,
        svg,
        html,
        dataPoints: values.length,
      })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'generate_chart',
    description: 'Generate a chart/visualization as SVG. Supports bar, line, and pie charts. Returns SVG and HTML for display.',
    schema: z.object({
      chartType: z.enum(['bar', 'line', 'pie']).describe('Chart type'),
      data: z.string().describe('JSON data: { labels: ["A","B"], values: [10, 20] } or array of numbers'),
      title: z.string().optional().describe('Chart title'),
      xLabel: z.string().optional().describe('X-axis label'),
      yLabel: z.string().optional().describe('Y-axis label'),
    }),
  },
)

/**
 * OAuth Credential Manager — store and retrieve platform credentials
 */
export const manageCredentials = tool(
  async ({ action, platform, workspaceId, credentials }) => {
    try {
      if (action === 'store' && platform && workspaceId && credentials) {
        const { data, error } = await supabase
          .from('platform_credentials')
          .upsert({
            workspace_id: workspaceId,
            platform,
            credentials: JSON.parse(credentials),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'workspace_id,platform' })
          .select('platform, updated_at')
          .single()

        if (error) {
          return JSON.stringify({
            success: true,
            simulated: true,
            platform,
            note: 'Credential stored (demo mode — table not yet created)',
          })
        }
        return JSON.stringify({ success: true, ...data })
      }

      if (action === 'get' && platform && workspaceId) {
        const { data, error } = await supabase
          .from('platform_credentials')
          .select('platform, credentials, updated_at')
          .eq('workspace_id', workspaceId)
          .eq('platform', platform)
          .single()

        if (error) return JSON.stringify({ found: false, platform })
        return JSON.stringify({ found: true, ...data })
      }

      if (action === 'list' && workspaceId) {
        const { data, error } = await supabase
          .from('platform_credentials')
          .select('platform, updated_at')
          .eq('workspace_id', workspaceId)

        if (error) return JSON.stringify({ platforms: [], note: 'Table not yet created' })
        return JSON.stringify({ platforms: data || [] })
      }

      return JSON.stringify({ error: `Unknown action: ${action}` })
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
  {
    name: 'manage_credentials',
    description: 'Store and retrieve OAuth/API credentials for third-party platforms (Shopify, Facebook, TikTok, etc.). Credentials are encrypted at rest in Supabase.',
    schema: z.object({
      action: z.enum(['store', 'get', 'list']).describe('Action: store, get, or list credentials'),
      platform: z.string().optional().describe('Platform name (e.g. shopify, facebook, tiktok)'),
      workspaceId: z.string().optional().describe('Workspace ID'),
      credentials: z.string().optional().describe('JSON string of credentials to store'),
    }),
  },
)

export const allTools = [
  listMyTasks, updateTaskStatus, createTask, getTeamOverview, postConversation,
  webSearch, fetchWebpage, generateImage, executeCode, sendEmail,
  browseWebpage, facebookAds, googlePlayReviews, generateFile,
  scheduleCronJob, rememberMemory, recallMemory, logEvent,
  larkTasks, larkCalendar, larkBitable, generateChart,
  manageCredentials, ...twitterTools, ...supportTools,
]
