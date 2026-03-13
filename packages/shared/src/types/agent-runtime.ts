/**
 * Agent Runtime API — shared request/response types
 *
 * Used by both apps/web (client) and apps/agent-runtime (server).
 * Keeps field names in sync across the boundary.
 */

// ── POST /chat ──────────────────────────────────────────────

export interface ChatRequest {
  workspaceId: string
  agentId: string
  agentName?: string
  agentRole?: string
  /** The user's message text */
  message: string
  /** Optional model provider override (e.g. 'openai', 'kimi') */
  provider?: string
  /** Optional model override (e.g. 'gpt-4o') */
  model?: string
  /** Session ID for conversation continuity */
  sessionId?: string
  /** Base64 or URL images for vision models */
  images?: string[]
}

export interface ChatResponse {
  response: string
  reasoning?: string
  toolCalls?: ToolCallResult[]
  notice?: string
}

export interface ToolCallResult {
  name: string
  args: Record<string, unknown>
  result: string
}

// ── GET /models ─────────────────────────────────────────────

export interface ModelOption {
  id: string
  provider: string
  providerLabel: string
  model: string
  label: string
  supportsTools: boolean
  supportsVision: boolean
  isDefault?: boolean
}

export interface ModelsResponse {
  models: ModelOption[]
}
