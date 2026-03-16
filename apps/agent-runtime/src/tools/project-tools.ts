/**
 * Project tools — tools for managing project tasks, files, and context
 * Used by the project chat endpoint's Lead Agent
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'

/**
 * List tasks for a project
 */
export const listProjectTasks = tool(
  async ({ projectId, status }) => {
    let query = supabase
      .from('project_tasks')
      .select('id, title, description, status, priority, assignee_id, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'list_project_tasks',
    description: 'List tasks for the current project. Optionally filter by status.',
    schema: z.object({
      projectId: z.string().describe('The project id'),
      status: z
        .enum(['pending', 'in_progress', 'done', 'blocked'])
        .optional()
        .describe('Filter by task status'),
    }),
  },
)

/**
 * Create a task in a project
 */
export const createProjectTask = tool(
  async ({ projectId, title, description, priority, assigneeId }) => {
    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: projectId,
        title,
        description: description || null,
        priority: priority || 'medium',
        assignee_id: assigneeId || null,
      })
      .select('id, title, status, priority')
      .single()

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'create_project_task',
    description: 'Create a new task in the current project. Use this when the user mentions work that should be tracked.',
    schema: z.object({
      projectId: z.string().describe('The project id'),
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Priority level'),
      assigneeId: z.string().optional().describe('User id to assign the task to'),
    }),
  },
)

/**
 * Update a project task
 */
export const updateProjectTask = tool(
  async ({ taskId, status, title, description, priority }) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (title) updates.title = title
    if (description !== undefined) updates.description = description
    if (priority) updates.priority = priority

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', taskId)
      .select('id, title, status, priority')
      .single()

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'update_project_task',
    description: "Update a project task's status, title, description, or priority.",
    schema: z.object({
      taskId: z.string().describe('The task id'),
      status: z.enum(['pending', 'in_progress', 'done', 'blocked']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    }),
  },
)

/**
 * List files attached to a project
 */
export const listProjectFiles = tool(
  async ({ projectId }) => {
    const { data, error } = await supabase
      .from('project_files')
      .select('id, name, url, mime_type, size_bytes, created_by, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data)
  },
  {
    name: 'list_project_files',
    description: 'List files and deliverables attached to the current project.',
    schema: z.object({
      projectId: z.string().describe('The project id'),
    }),
  },
)

/**
 * Get project summary (overview, participants, task stats)
 */
export const getProjectSummary = tool(
  async ({ projectId }) => {
    const [projectRes, participantsRes, tasksRes] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name, description, type, status, runtime_type, config, created_at')
        .eq('id', projectId)
        .single(),
      supabase
        .from('project_participants')
        .select('user_id, role')
        .eq('project_id', projectId),
      supabase
        .from('project_tasks')
        .select('status')
        .eq('project_id', projectId),
    ])

    if (projectRes.error) return JSON.stringify({ error: projectRes.error.message })

    const taskStats = (tasksRes.data || []).reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        acc.total++
        return acc
      },
      { total: 0 } as Record<string, number>,
    )

    return JSON.stringify({
      project: projectRes.data,
      participants: participantsRes.data || [],
      taskStats,
    })
  },
  {
    name: 'get_project_summary',
    description: 'Get an overview of the project including details, participants, and task statistics.',
    schema: z.object({
      projectId: z.string().describe('The project id'),
    }),
  },
)

/** All project tools */
export const projectTools = [
  listProjectTasks,
  createProjectTask,
  updateProjectTask,
  listProjectFiles,
  getProjectSummary,
]
