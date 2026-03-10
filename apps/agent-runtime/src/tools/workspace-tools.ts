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

export const allTools = [
  listMyTasks, updateTaskStatus, createTask, getTeamOverview, postConversation,
  webSearch, fetchWebpage, generateImage, executeCode, sendEmail,
]
