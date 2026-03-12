/**
 * Budget tools — Agent budget approval & tracking skill
 *
 * Enables agents to request budget approval before spending money,
 * report spending progress, and handle budget lifecycle.
 * The frontend renders special UI cards for these tool responses.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * Request budget approval from the workspace owner.
 * The frontend renders a budget card with amount buttons.
 * The agent should wait for the user's response before proceeding.
 */
export const requestBudget = tool(
  async ({ task_description, suggested_amounts, currency }) => {
    return JSON.stringify({
      type: 'budget_approval_required',
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
