/**
 * Twitter/X tools — LangGraph tools that agents can invoke
 * to interact with X/Twitter on behalf of the workspace owner.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { getAccessToken } from '../lib/twitter-oauth.js'

const TWITTER_API = 'https://api.twitter.com/2'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || ''
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || ''

async function twitterFetch(workspaceId: string, path: string, options: RequestInit = {}) {
  const token = await getAccessToken(workspaceId, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET)
  const resp = await fetch(`${TWITTER_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(`Twitter API error: ${resp.status} ${JSON.stringify(data)}`)
  return data
}

/**
 * Post a tweet
 */
export const postTweet = tool(
  async ({ workspaceId, text, replyToId }) => {
    const body: Record<string, unknown> = { text }
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId }
    }
    const result = await twitterFetch(workspaceId, '/tweets', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return JSON.stringify(result)
  },
  {
    name: 'post_tweet',
    description: 'Post a new tweet. Can also reply to an existing tweet.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      text: z.string().max(280).describe('Tweet text (max 280 chars)'),
      replyToId: z.string().optional().describe('Tweet ID to reply to'),
    }),
  },
)

/**
 * Get the authenticated user's recent tweets
 */
export const getMyTweets = tool(
  async ({ workspaceId, maxResults }) => {
    // First get user ID
    const me = await twitterFetch(workspaceId, '/users/me')
    const userId = me.data.id
    const result = await twitterFetch(
      workspaceId,
      `/users/${userId}/tweets?max_results=${maxResults || 10}&tweet.fields=created_at,public_metrics`,
    )
    return JSON.stringify(result)
  },
  {
    name: 'get_my_tweets',
    description: 'Get the authenticated user\'s recent tweets with engagement metrics.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      maxResults: z.number().min(5).max(100).optional().describe('Number of tweets to fetch (default 10)'),
    }),
  },
)

/**
 * Like a tweet
 */
export const likeTweet = tool(
  async ({ workspaceId, tweetId }) => {
    const me = await twitterFetch(workspaceId, '/users/me')
    const userId = me.data.id
    const result = await twitterFetch(workspaceId, `/users/${userId}/likes`, {
      method: 'POST',
      body: JSON.stringify({ tweet_id: tweetId }),
    })
    return JSON.stringify(result)
  },
  {
    name: 'like_tweet',
    description: 'Like a tweet by its ID.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      tweetId: z.string().describe('The tweet ID to like'),
    }),
  },
)

/**
 * Search recent tweets
 */
export const searchTweets = tool(
  async ({ workspaceId, query, maxResults }) => {
    const q = encodeURIComponent(query)
    const result = await twitterFetch(
      workspaceId,
      `/tweets/search/recent?query=${q}&max_results=${maxResults || 10}&tweet.fields=created_at,public_metrics,author_id`,
    )
    return JSON.stringify(result)
  },
  {
    name: 'search_tweets',
    description: 'Search recent tweets matching a query.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      query: z.string().describe('Search query'),
      maxResults: z.number().min(10).max(100).optional().describe('Number of results (default 10)'),
    }),
  },
)

/**
 * Get mentions of the authenticated user
 */
export const getMyMentions = tool(
  async ({ workspaceId, maxResults }) => {
    const me = await twitterFetch(workspaceId, '/users/me')
    const userId = me.data.id
    const result = await twitterFetch(
      workspaceId,
      `/users/${userId}/mentions?max_results=${maxResults || 10}&tweet.fields=created_at,public_metrics,author_id`,
    )
    return JSON.stringify(result)
  },
  {
    name: 'get_my_mentions',
    description: 'Get recent tweets mentioning the authenticated user.',
    schema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      maxResults: z.number().min(5).max(100).optional().describe('Number of mentions to fetch (default 10)'),
    }),
  },
)

export const twitterTools = [postTweet, getMyTweets, likeTweet, searchTweets, getMyMentions]
