/**
 * Cron Scheduler — Manages scheduled tasks for agents
 *
 * Agents can register cron jobs (e.g., "check social media every hour").
 * Jobs are stored in Supabase and loaded on startup.
 * Uses node-cron for scheduling.
 */

import * as cron from 'node-cron'
import { supabase } from '../lib/supabase.js'
import { runChatAgent } from '../graph/chat-agent.js'

interface ScheduledJob {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  workspaceId: string
  cronExpression: string
  taskDescription: string
  enabled: boolean
}

const activeJobs = new Map<string, cron.ScheduledTask>()

/** Start a single cron job */
function startJob(job: ScheduledJob) {
  if (activeJobs.has(job.id)) {
    activeJobs.get(job.id)!.stop()
  }

  if (!cron.validate(job.cronExpression)) {
    console.error(`[cron] Invalid expression for job ${job.id}: ${job.cronExpression}`)
    return
  }

  const task = cron.schedule(job.cronExpression, async () => {
    console.log(`[cron] Running job ${job.id}: ${job.taskDescription}`)

    // Update last_run
    await supabase
      .from('agent_scheduled_jobs')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', job.id)

    // Set agent status to busy
    await supabase
      .from('workspace_agents')
      .update({ status: 'busy', updated_at: new Date().toISOString() })
      .eq('id', job.agentId)

    try {
      const result = await runChatAgent({
        workspaceId: job.workspaceId,
        agentId: job.agentId,
        agentName: job.agentName,
        agentRole: job.agentRole,
        userMessage: job.taskDescription,
      })

      console.log(`[cron] Job ${job.id} completed: ${result.response.slice(0, 100)}`)

      // Update run count and last result
      await supabase
        .from('agent_scheduled_jobs')
        .update({
          run_count: (await supabase.from('agent_scheduled_jobs').select('run_count').eq('id', job.id).single()).data?.run_count + 1 || 1,
          last_result: result.response.slice(0, 500),
        })
        .eq('id', job.id)
    } catch (err: any) {
      console.error(`[cron] Job ${job.id} error:`, err.message)
    } finally {
      // Set agent back to online
      await supabase
        .from('workspace_agents')
        .update({ status: 'online', updated_at: new Date().toISOString() })
        .eq('id', job.agentId)
    }
  })

  activeJobs.set(job.id, task)
  console.log(`[cron] Started job ${job.id}: "${job.taskDescription}" (${job.cronExpression})`)
}

/** Stop a cron job */
export function stopJob(jobId: string) {
  const task = activeJobs.get(jobId)
  if (task) {
    task.stop()
    activeJobs.delete(jobId)
    console.log(`[cron] Stopped job ${jobId}`)
  }
}

/** Load all enabled jobs from Supabase and start them */
export async function loadScheduledJobs() {
  const { data: jobs, error } = await supabase
    .from('agent_scheduled_jobs')
    .select(`
      id, cron_expression, task_description, enabled,
      workspace_agents!inner(id, name, role, workspace_id)
    `)
    .eq('enabled', true)

  if (error) {
    console.error('[cron] Failed to load jobs:', error.message)
    return
  }

  console.log(`[cron] Loading ${jobs?.length || 0} scheduled jobs`)

  for (const row of jobs || []) {
    const agent = (row as any).workspace_agents
    startJob({
      id: row.id,
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      workspaceId: agent.workspace_id,
      cronExpression: row.cron_expression,
      taskDescription: row.task_description,
      enabled: row.enabled,
    })
  }
}

/** Register a new scheduled job */
export async function registerJob(params: {
  agentId: string
  cronExpression: string
  taskDescription: string
  jobKey?: string
}): Promise<{ id: string } | { error: string }> {
  if (!cron.validate(params.cronExpression)) {
    return { error: `Invalid cron expression: ${params.cronExpression}` }
  }

  // Look up agent info
  const { data: agent } = await supabase
    .from('workspace_agents')
    .select('id, name, role, workspace_id')
    .eq('id', params.agentId)
    .single()

  if (!agent) return { error: 'Agent not found' }

  const { data, error } = await supabase
    .from('agent_scheduled_jobs')
    .insert({
      workspace_agent_id: params.agentId,
      job_key: params.jobKey || `job-${Date.now()}`,
      cron_expression: params.cronExpression,
      task_description: params.taskDescription,
      enabled: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Start the job immediately
  startJob({
    id: data.id,
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role,
    workspaceId: agent.workspace_id,
    cronExpression: params.cronExpression,
    taskDescription: params.taskDescription,
    enabled: true,
  })

  return { id: data.id }
}

/** List all active job IDs */
export function getActiveJobIds(): string[] {
  return Array.from(activeJobs.keys())
}
