/**
 * Lark Bot Registry — Multi-bot architecture
 *
 * Each AI agent can be associated with a Lark bot.
 * When a message arrives via webhook, the system routes it to the correct agent.
 * The bot responds using the agent's own bot token.
 */

import { supabase } from './supabase.js'
import { runChatAgent } from '../graph/chat-agent.js'

interface LarkBot {
  agentId: string
  agentName: string
  agentRole: string
  workspaceId: string
  appId: string
  appSecret: string
  token?: string
  tokenExpiry?: number
}

const botRegistry = new Map<string, LarkBot>()

/** Get tenant access token for a bot */
async function getBotToken(bot: LarkBot): Promise<string> {
  if (bot.token && bot.tokenExpiry && Date.now() < bot.tokenExpiry) {
    return bot.token
  }

  const res = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: bot.appId, app_secret: bot.appSecret }),
  })
  const data = await res.json()
  bot.token = data.tenant_access_token
  bot.tokenExpiry = Date.now() + (data.expire - 60) * 1000  // refresh 60s before expiry
  return bot.token!
}

/** Register a bot for an agent */
export function registerBot(params: {
  agentId: string
  agentName: string
  agentRole: string
  workspaceId: string
  appId: string
  appSecret: string
}) {
  botRegistry.set(params.appId, {
    ...params,
  })
  console.log(`[lark-bot] Registered bot for agent "${params.agentName}" (app: ${params.appId})`)
}

/** Load bot registrations from Supabase */
export async function loadBotRegistry() {
  // workspace_agents table removed — bots now load from workspace_integrations
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('workspace_id, config_json')
    .eq('provider', 'lark_bot')
    .eq('status', 'connected')

  if (error || !data?.length) {
    console.log('[lark-bot] No bots configured in database')
    return
  }

  for (const row of data) {
    try {
      const config = typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json
      if (config?.app_id && config?.app_secret) {
        registerBot({
          agentId: config.agent_id || 'lark-bot',
          agentName: config.agent_name || 'Lark Bot',
          agentRole: config.agent_role || 'Assistant',
          workspaceId: row.workspace_id,
          appId: config.app_id,
          appSecret: config.app_secret,
        })
      }
    } catch {
      // skip invalid config
    }
  }
  console.log(`[lark-bot] Loaded ${botRegistry.size} bots`)
}

/** Send a reply message via a bot */
async function sendBotReply(bot: LarkBot, chatId: string, text: string) {
  const token = await getBotToken(bot)
  await fetch('https://open.larksuite.com/open-apis/im/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id_type: 'chat_id',
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
}

/** Handle incoming Lark webhook event */
export async function handleLarkWebhook(body: any): Promise<{ challenge?: string; message?: string }> {
  // Handle URL verification challenge
  if (body.challenge) {
    return { challenge: body.challenge }
  }

  const event = body.event
  if (!event) return { message: 'no event' }

  // Only handle message events
  const msgType = event.message?.message_type
  if (event.type !== 'im.message.receive_v1' || !event.message) {
    return { message: 'ignored event type' }
  }

  // Find the bot by app_id from the header
  const appId = body.header?.app_id
  const bot = appId ? botRegistry.get(appId) : null

  if (!bot) {
    console.log(`[lark-bot] Unknown app_id: ${appId}`)
    return { message: 'unknown bot' }
  }

  // Extract message text
  let userMessage = ''
  if (msgType === 'text') {
    try {
      const content = JSON.parse(event.message.content)
      userMessage = content.text || ''
    } catch {
      userMessage = event.message.content || ''
    }
  } else {
    return { message: 'unsupported message type' }
  }

  // Remove @mention prefix
  userMessage = userMessage.replace(/@_user_\d+\s*/g, '').trim()
  if (!userMessage) return { message: 'empty message' }

  const chatId = event.message.chat_id

  console.log(`[lark-bot] Agent "${bot.agentName}" received: "${userMessage.slice(0, 100)}"`)

  // Run the chat agent (fire-and-forget for speed)
  // Pass chatId as sourceId for multi-turn conversation memory
  runChatAgent({
    workspaceId: bot.workspaceId,
    agentId: bot.agentId,
    agentName: bot.agentName,
    agentRole: bot.agentRole,
    userMessage,
    sourceId: chatId,
  }).then(async (result) => {
    await sendBotReply(bot, chatId, result.response)
    console.log(`[lark-bot] Agent "${bot.agentName}" replied: "${result.response.slice(0, 100)}"`)
  }).catch(async (err) => {
    console.error(`[lark-bot] Agent "${bot.agentName}" error:`, err.message)
    await sendBotReply(bot, chatId, `Sorry, I encountered an error: ${err.message}`)
  })

  return { message: 'processing' }
}

export function getRegisteredBots(): Array<{ agentId: string; agentName: string; appId: string }> {
  return Array.from(botRegistry.values()).map(b => ({
    agentId: b.agentId,
    agentName: b.agentName,
    appId: b.appId,
  }))
}
