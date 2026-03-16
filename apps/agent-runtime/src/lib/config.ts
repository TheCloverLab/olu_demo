/**
 * Environment configuration — validated with Zod at startup.
 *
 * Required vars throw immediately; optional vars log warnings when missing.
 */

import { z } from 'zod'

const envSchema = z.object({
  // --- Required ---
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // --- Optional (with defaults) ---
  PORT: z.string().default('8080'),
  API_SECRET: z.string().default(''),
  WEBHOOK_SECRET: z.string().default(''),
  ENCRYPTION_KEY: z.string().default(''),
  ALLOWED_ORIGINS: z.string().default(''),
  RATE_LIMIT_MAX: z.string().default('120'),
  OPENCLAW_URL: z.string().default('http://localhost:3100'),
  APP_URL: z.string().default('http://localhost:5173'),
  BUILD_TIME: z.string().optional(),

  // Twitter OAuth
  TWITTER_CLIENT_ID: z.string().default(''),
  TWITTER_CLIENT_SECRET: z.string().optional(),

  // Lark
  LARK_ENCRYPT_KEY: z.string().default(''),
})

export type EnvConfig = z.infer<typeof envSchema>

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues.map(
      (i) => `  - ${i.path.join('.')}: ${i.message}`,
    )
    console.error('[config] Fatal — missing required environment variables:\n' + missing.join('\n'))
    throw new Error('Missing required environment variables. See logs above.')
  }

  const cfg = result.data

  // Warn about insecure optional config
  if (!cfg.API_SECRET) {
    console.warn('[config] WARNING: API_SECRET is not set — all requests will be allowed without authentication')
  }
  if (!cfg.ENCRYPTION_KEY) {
    console.warn('[config] WARNING: ENCRYPTION_KEY is not set — MCP credentials will be stored in plaintext')
  }
  if (!cfg.WEBHOOK_SECRET) {
    console.warn('[config] WARNING: WEBHOOK_SECRET is not set — webhook signatures will not be verified')
  }

  return cfg
}

export const config = loadConfig()
