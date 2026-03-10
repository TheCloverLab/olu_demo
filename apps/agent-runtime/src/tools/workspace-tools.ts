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
        'id, name, position, status, employment_status, workspace_agent_tasks(id, status)',
      )
      .eq('workspace_id', workspaceId)
      .eq('employment_status', 'active')

    if (error) return JSON.stringify({ error: error.message })

    const overview = (data || []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      position: agent.position,
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

export const allTools = [listMyTasks, updateTaskStatus, createTask, getTeamOverview]
