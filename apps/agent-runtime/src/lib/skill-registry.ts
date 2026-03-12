/**
 * Skill Registry — Dynamic tool loading by skill packs
 *
 * Groups related tools into "skills" that can be enabled/disabled per agent.
 * If an agent has no skill configuration, all tools are available (backward compatible).
 *
 * Also integrates MCP tools: agents can have `enabled_mcp_servers` to pull in
 * external tools from MCP server ecosystems (e.g., OpenClaw).
 */

import type { StructuredToolInterface } from '@langchain/core/tools'
import {
  listMyTasks, updateTaskStatus, createTask, getTeamOverview,
  postConversation, webSearch, fetchWebpage, generateImage,
  executeCode, sendEmail, browseWebpage, facebookAds,
  googlePlayReviews, generateFile, scheduleCronJob,
  rememberMemory, recallMemory, logEvent,
  larkTasks, larkCalendar, larkBitable,
  generateChart, manageCredentials,
} from '../tools/workspace-tools.js'
import {
  postTweet, getMyTweets, likeTweet, searchTweets, getMyMentions,
} from '../tools/twitter-tools.js'
import { requestBudget, reportBudgetUsage } from '../tools/budget-tools.js'
import { supabase } from './supabase.js'
import { getMCPToolsAsLangChain } from './mcp-client.js'

/**
 * Skill definitions — each skill groups related tools
 */
export const SKILL_DEFINITIONS: Record<string, {
  name: string
  description: string
  tools: StructuredToolInterface[]
}> = {
  'workspace-core': {
    name: 'Workspace Core',
    description: 'Task management, team overview, conversations',
    tools: [listMyTasks, updateTaskStatus, createTask, getTeamOverview, postConversation],
  },
  'web': {
    name: 'Web Tools',
    description: 'Web search, webpage fetching, browser automation',
    tools: [webSearch, fetchWebpage, browseWebpage],
  },
  'content': {
    name: 'Content Generation',
    description: 'Image generation, file creation (PDF/DOCX/XLSX), charts',
    tools: [generateImage, generateFile, generateChart],
  },
  'code': {
    name: 'Code Execution',
    description: 'Execute JavaScript code in sandbox',
    tools: [executeCode],
  },
  'communication': {
    name: 'Communication',
    description: 'Send emails',
    tools: [sendEmail],
  },
  'lark-suite': {
    name: 'Lark Suite',
    description: 'Lark tasks, calendar, and Bitable integration',
    tools: [larkTasks, larkCalendar, larkBitable],
  },
  'marketing': {
    name: 'Marketing',
    description: 'Facebook Ads, Google Play reviews',
    tools: [facebookAds, googlePlayReviews],
  },
  'memory': {
    name: 'Memory',
    description: 'Remember and recall information with vector search',
    tools: [rememberMemory, recallMemory],
  },
  'automation': {
    name: 'Automation',
    description: 'Cron job scheduling, event logging',
    tools: [scheduleCronJob, logEvent],
  },
  'credentials': {
    name: 'Credentials',
    description: 'Manage OAuth credentials and API keys',
    tools: [manageCredentials],
  },
  'social': {
    name: 'Social Media',
    description: 'Post tweets, search, like, and monitor mentions on X/Twitter',
    tools: [postTweet, getMyTweets, likeTweet, searchTweets, getMyMentions],
  },
  'budget': {
    name: 'Budget Management',
    description: 'Request budget approval and report spending progress for paid tasks',
    tools: [requestBudget, reportBudgetUsage],
  },
}

/**
 * Skill-specific system prompt additions.
 */
const SKILL_PROMPTS: Record<string, string> = {
  budget: `## Budget Protocol
When the user asks you to perform a task that involves spending money (running ads, influencer outreach, paid promotions, purchasing services, boosting posts, etc.):
1. ALWAYS call request_budget FIRST. Do NOT proceed until the owner approves a budget.
2. After the owner approves, call create_task to create a trackable task for this work (e.g. "Run Facebook ad campaign — $200 budget").
3. Begin the task and call report_budget_usage periodically to show progress.
4. When the task is complete, call report_budget_usage one final time with status "completed" and a full breakdown, then update the task status to "done".
5. If the owner says "stop" or "pause", immediately call report_budget_usage with status "paused" and stop spending.
6. Unspent funds are automatically returned to the owner upon completion or pause.`,
}

/** All available skill names */
export const ALL_SKILL_NAMES = Object.keys(SKILL_DEFINITIONS)

/** Default skills enabled for all agents (when no configuration exists) */
const DEFAULT_SKILLS = ALL_SKILL_NAMES

interface AgentConfig {
  enabled_skills: string[] | null
  enabled_mcp_servers: string[] | null
  runtime_type: 'langgraph' | 'openclaw' | null
}

/**
 * Load agent configuration from the database.
 * Returns skills, MCP servers, and runtime type.
 */
async function loadAgentConfig(agentId: string): Promise<AgentConfig & { workspace_id: string | null }> {
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('enabled_skills, enabled_mcp_servers, runtime_type, workspace_id')
    .eq('id', agentId)
    .single()

  if (error || !data) {
    return { enabled_skills: null, enabled_mcp_servers: null, runtime_type: null, workspace_id: null }
  }

  return {
    enabled_skills: data.enabled_skills as string[] | null,
    enabled_mcp_servers: data.enabled_mcp_servers as string[] | null,
    runtime_type: data.runtime_type as AgentConfig['runtime_type'],
    workspace_id: (data as any).workspace_id as string | null,
  }
}

/**
 * Get tools for an agent based on their enabled skills + MCP servers.
 * If no skill configuration exists, returns all native tools.
 * MCP tools are appended if the agent has enabled_mcp_servers configured.
 */
export async function getAgentTools(agentId: string): Promise<StructuredToolInterface[]> {
  const config = await loadAgentConfig(agentId)
  const skillNames = config.enabled_skills || DEFAULT_SKILLS

  const tools: StructuredToolInterface[] = []
  const seen = new Set<string>()

  // Load native skill-based tools
  for (const skillName of skillNames) {
    const skill = SKILL_DEFINITIONS[skillName]
    if (!skill) continue
    for (const tool of skill.tools) {
      if (!seen.has(tool.name)) {
        seen.add(tool.name)
        tools.push(tool)
      }
    }
  }

  // Load MCP tools from enabled servers (with per-workspace credential injection)
  const mcpServers = config.enabled_mcp_servers
  if (mcpServers && mcpServers.length > 0) {
    const mcpTools = getMCPToolsAsLangChain(mcpServers, config.workspace_id || undefined)
    for (const tool of mcpTools) {
      if (!seen.has(tool.name)) {
        seen.add(tool.name)
        tools.push(tool)
      }
    }
    console.log(`[skills] Agent ${agentId}: loaded ${mcpTools.length} MCP tools from [${mcpServers.join(', ')}]`)
  }

  return tools
}

/**
 * Get skill-specific system prompt additions for an agent.
 */
export async function getAgentSkillPrompts(agentId: string): Promise<string> {
  const config = await loadAgentConfig(agentId)
  const skillNames = config.enabled_skills || DEFAULT_SKILLS
  const prompts = skillNames
    .filter((name) => SKILL_PROMPTS[name])
    .map((name) => SKILL_PROMPTS[name])
  return prompts.join('\n\n')
}

/**
 * Get the runtime type for an agent. Defaults to 'langgraph'.
 */
export async function getAgentRuntimeType(agentId: string): Promise<'langgraph' | 'openclaw'> {
  const config = await loadAgentConfig(agentId)
  return config.runtime_type || 'langgraph'
}

/**
 * List all available skills with their tool counts.
 */
export function listSkills(): Array<{ id: string; name: string; description: string; toolCount: number }> {
  return Object.entries(SKILL_DEFINITIONS).map(([id, skill]) => ({
    id,
    name: skill.name,
    description: skill.description,
    toolCount: skill.tools.length,
  }))
}
