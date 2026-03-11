/**
 * Skill Registry — Dynamic tool loading by skill packs
 *
 * Groups related tools into "skills" that can be enabled/disabled per agent.
 * If an agent has no skill configuration, all tools are available (backward compatible).
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
import { supabase } from './supabase.js'

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
}

/** All available skill names */
export const ALL_SKILL_NAMES = Object.keys(SKILL_DEFINITIONS)

/** Default skills enabled for all agents (when no configuration exists) */
const DEFAULT_SKILLS = ALL_SKILL_NAMES

/**
 * Load enabled skills for an agent from the database.
 * Returns null if no configuration found (meaning all skills are enabled).
 */
async function loadAgentSkills(agentId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('workspace_agents')
    .select('enabled_skills')
    .eq('id', agentId)
    .single()

  if (error || !data?.enabled_skills) return null
  return data.enabled_skills as string[]
}

/**
 * Get tools for an agent based on their enabled skills.
 * If no skill configuration exists, returns all tools.
 */
export async function getAgentTools(agentId: string): Promise<StructuredToolInterface[]> {
  const enabledSkills = await loadAgentSkills(agentId)
  const skillNames = enabledSkills || DEFAULT_SKILLS

  const tools: StructuredToolInterface[] = []
  const seen = new Set<string>()

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

  return tools
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
