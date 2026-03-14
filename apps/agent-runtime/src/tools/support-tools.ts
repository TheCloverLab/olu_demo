/**
 * Support tools — tools for customer support agents to query workspace data
 * (products, experiences, courses, members)
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'

/**
 * List products and their pricing plans for a workspace
 */
export const listProducts = tool(
  async ({ workspaceId }) => {
    const { data: products, error } = await supabase
      .from('workspace_products')
      .select('id, name, description, access_type, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')

    if (error) return JSON.stringify({ error: error.message })

    // Load plans for each product
    const result = await Promise.all(
      (products || []).map(async (p) => {
        const { data: plans } = await supabase
          .from('workspace_product_plans')
          .select('id, price, currency, billing_type, interval')
          .eq('product_id', p.id)
        return { ...p, plans: plans || [] }
      })
    )

    return JSON.stringify(result)
  },
  {
    name: 'list_products',
    description: 'List all active products and their pricing plans for this workspace. Use this to answer questions about pricing, plans, and product offerings.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
    }),
  },
)

/**
 * List experiences (forums, courses, group chats) for a workspace
 */
export const listExperiences = tool(
  async ({ workspaceId }) => {
    const { data, error } = await supabase
      .from('workspace_experiences')
      .select('id, name, type, visibility, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('position')

    if (error) return JSON.stringify({ error: error.message })
    return JSON.stringify(data || [])
  },
  {
    name: 'list_experiences',
    description: 'List all active experiences (forums, courses, group chats) for this workspace.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
    }),
  },
)

/**
 * Get full course content tree (course → chapters → lessons)
 */
export const getCourseContent = tool(
  async ({ workspaceId, experienceName }) => {
    // Find the experience by name (fuzzy match)
    let query = supabase
      .from('workspace_experiences')
      .select('id, name, type')
      .eq('workspace_id', workspaceId)
      .eq('type', 'course')
      .eq('status', 'active')

    if (experienceName) {
      query = query.ilike('name', `%${experienceName}%`)
    }

    const { data: experiences, error: expErr } = await query
    if (expErr) return JSON.stringify({ error: expErr.message })
    if (!experiences?.length) return JSON.stringify({ error: 'No matching course experiences found' })

    const result = []
    for (const exp of experiences) {
      // Get courses for this experience
      const { data: courses } = await supabase
        .from('experience_courses')
        .select('id, name, description, status')
        .eq('experience_id', exp.id)
        .order('position')

      const coursesWithContent = await Promise.all(
        (courses || []).map(async (course) => {
          const { data: chapters } = await supabase
            .from('experience_course_chapters')
            .select('id, title, position')
            .eq('course_id', course.id)
            .order('position')

          const chaptersWithLessons = await Promise.all(
            (chapters || []).map(async (ch) => {
              const { data: lessons } = await supabase
                .from('experience_course_lessons')
                .select('id, title, content, video_url, position')
                .eq('chapter_id', ch.id)
                .order('position')
              return { ...ch, lessons: lessons || [] }
            })
          )
          return { ...course, chapters: chaptersWithLessons }
        })
      )
      result.push({ experience: exp.name, courses: coursesWithContent })
    }

    return JSON.stringify(result)
  },
  {
    name: 'get_course_content',
    description: 'Get the full course content tree (courses, chapters, lessons) for a workspace. Optionally filter by experience name. Use this to answer detailed questions about what a course contains.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      experienceName: z.string().optional().describe('Filter by experience name (fuzzy match). If omitted, returns all course experiences.'),
    }),
  },
)

/**
 * Search workspace content across products, experiences, and courses
 */
export const searchWorkspaceContent = tool(
  async ({ workspaceId, query }) => {
    const q = `%${query}%`
    const [products, experiences, courses, lessons] = await Promise.all([
      supabase.from('workspace_products').select('id, name, description').eq('workspace_id', workspaceId).ilike('name', q),
      supabase.from('workspace_experiences').select('id, name, type').eq('workspace_id', workspaceId).ilike('name', q),
      supabase.from('experience_courses').select('id, name, description, experience_id').ilike('name', q),
      supabase.from('experience_course_lessons').select('id, title, content, chapter_id').or(`title.ilike.${q},content.ilike.${q}`),
    ])

    return JSON.stringify({
      products: products.data || [],
      experiences: experiences.data || [],
      courses: courses.data || [],
      lessons: (lessons.data || []).map((l) => ({ id: l.id, title: l.title, content: l.content?.slice(0, 200) })),
    })
  },
  {
    name: 'search_workspace_content',
    description: 'Search across all workspace content (products, experiences, courses, lessons) by keyword. Useful when you need to find specific content.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      query: z.string().describe('Search keyword'),
    }),
  },
)

export const supportTools = [listProducts, listExperiences, getCourseContent, searchWorkspaceContent]
