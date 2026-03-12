/**
 * Budget tools — Agent budget approval & tracking skill
 *
 * Enables agents to request budget approval before spending money,
 * report spending progress, and handle budget lifecycle.
 * The frontend renders special UI cards for these tool responses.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'

/**
 * Request budget approval from the workspace owner.
 * Creates a pending record in agent_budgets so the frontend can approve it.
 */
export const requestBudget = tool(
  async ({ workspaceId, agentId, task_description, suggested_amounts, currency }) => {
    const requestedAmount = suggested_amounts[Math.floor(suggested_amounts.length / 2)] || suggested_amounts[0] || 100

    const { data, error } = await supabase
      .from('agent_budgets')
      .insert({
        workspace_id: workspaceId,
        agent_id: agentId,
        requested_amount: requestedAmount,
        currency,
        status: 'pending',
        description: task_description,
      })
      .select('id')
      .single()

    if (error) {
      return JSON.stringify({ type: 'budget_error', error: error.message })
    }

    return JSON.stringify({
      type: 'budget_approval_required',
      budget_id: data.id,
      task: task_description,
      options: suggested_amounts,
      currency,
    })
  },
  {
    name: 'request_budget',
    description:
      'Request budget approval from the store owner before performing any task that involves spending money (ads, influencer outreach, paid promotions, purchasing services, etc.). Call this tool and then wait for the owner to approve a budget amount before proceeding.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      agentId: z.string().describe('The agent ID requesting the budget'),
      task_description: z
        .string()
        .describe('Brief description of what the money will be spent on'),
      suggested_amounts: z
        .array(z.number())
        .default([20, 50, 200])
        .describe('Suggested budget amounts for the owner to choose from (USD)'),
      currency: z
        .string()
        .default('USD')
        .describe('Currency code'),
    }),
  },
)

/**
 * Report budget usage progress to the workspace owner.
 * The frontend renders a progress card with spent/remaining.
 */
export const reportBudgetUsage = tool(
  async ({ task_description, approved_amount, spent_amount, currency, status, breakdown }) => {
    return JSON.stringify({
      type: 'budget_progress',
      task: task_description,
      approved: approved_amount,
      spent: spent_amount,
      remaining: approved_amount - spent_amount,
      currency,
      status,
      breakdown: breakdown || [],
    })
  },
  {
    name: 'report_budget_usage',
    description:
      'Report current budget usage to the store owner. Call this periodically during task execution to show spending progress, or when the task is complete to show the final summary.',
    schema: z.object({
      task_description: z
        .string()
        .describe('Brief description of the task'),
      approved_amount: z
        .number()
        .describe('Total approved budget amount'),
      spent_amount: z
        .number()
        .describe('Amount spent so far'),
      currency: z
        .string()
        .default('USD'),
      status: z
        .enum(['in_progress', 'paused', 'completed', 'cancelled'])
        .describe('Current status of the budget/task'),
      breakdown: z
        .array(z.object({
          item: z.string().describe('What the money was spent on'),
          amount: z.number().describe('Amount spent on this item'),
        }))
        .optional()
        .describe('Itemized breakdown of spending'),
    }),
  },
)
