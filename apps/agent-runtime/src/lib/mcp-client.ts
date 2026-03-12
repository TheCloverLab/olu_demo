/**
 * MCP Client — Model Context Protocol integration
 *
 * Connects to external MCP servers to discover and invoke tools dynamically.
 * Supports stdio-based MCP servers (subprocess) and SSE-based servers (HTTP).
 *
 * MCP tools are converted to LangChain StructuredTools so agents can use them
 * alongside native skill-based tools.
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { supabase } from './supabase.js'

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  serverName: string
}

export type MCPCredentialType = 'bearer' | 'api_key' | 'basic' | 'custom_header'

export interface MCPCredentials {
  type: MCPCredentialType
  token?: string        // for bearer
  api_key?: string      // for api_key (sent as X-API-Key header)
  username?: string     // for basic
  password?: string     // for basic
  header_name?: string  // for custom_header
  header_value?: string // for custom_header
}

interface MCPServer {
  name: string
  type: 'stdio' | 'sse'
  command?: string  // for stdio
  args?: string[]   // for stdio
  url?: string      // for sse
  tools: MCPTool[]
  process?: any     // child process for stdio
}

const servers = new Map<string, MCPServer>()

/** Register an MCP server configuration */
export function registerMCPServer(config: {
  name: string
  type: 'stdio' | 'sse'
  command?: string
  args?: string[]
  url?: string
}) {
  servers.set(config.name, {
    ...config,
    tools: [],
  })
  console.log(`[mcp] Registered server: ${config.name} (${config.type})`)
}

/** Discover tools from an SSE-based MCP server */
async function discoverSSETools(server: MCPServer): Promise<MCPTool[]> {
  if (!server.url) return []

  try {
    const res = await fetch(`${server.url}/tools/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    })

    if (!res.ok) return []
    const data = await res.json()

    return (data.result?.tools || []).map((t: any) => ({
      name: `${server.name}__${t.name}`,
      description: t.description || '',
      inputSchema: t.inputSchema || { type: 'object', properties: {} },
      serverName: server.name,
    }))
  } catch (err: any) {
    console.error(`[mcp] Failed to discover tools from ${server.name}:`, err.message)
    return []
  }
}

/**
 * Build auth headers from MCP credentials.
 */
function buildAuthHeaders(creds: MCPCredentials): Record<string, string> {
  switch (creds.type) {
    case 'bearer':
      return creds.token ? { Authorization: `Bearer ${creds.token}` } : {}
    case 'api_key':
      return creds.api_key ? { 'X-API-Key': creds.api_key } : {}
    case 'basic': {
      if (!creds.username) return {}
      const encoded = Buffer.from(`${creds.username}:${creds.password || ''}`).toString('base64')
      return { Authorization: `Basic ${encoded}` }
    }
    case 'custom_header':
      return creds.header_name && creds.header_value
        ? { [creds.header_name]: creds.header_value }
        : {}
    default:
      return {}
  }
}

/**
 * Look up MCP server credentials from workspace_integrations.
 * Stores credentials as: provider = `mcp:<serverName>`, config_json = MCPCredentials
 */
async function loadMCPCredentials(workspaceId: string, serverName: string): Promise<MCPCredentials | null> {
  const provider = `mcp:${serverName}`
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('config_json')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .eq('status', 'connected')
    .maybeSingle()

  if (error || !data?.config_json) return null
  return data.config_json as MCPCredentials
}

/** Call a tool on an SSE-based MCP server */
async function callSSETool(server: MCPServer, toolName: string, args: Record<string, unknown>, credentials?: MCPCredentials | null): Promise<string> {
  if (!server.url) return JSON.stringify({ error: 'Server URL not configured' })

  try {
    const authHeaders = credentials ? buildAuthHeaders(credentials) : {}
    const res = await fetch(`${server.url}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: toolName, arguments: args },
        id: Date.now(),
      }),
    })

    if (!res.ok) return JSON.stringify({ error: `MCP server error: ${res.status}` })
    const data = await res.json()

    if (data.error) return JSON.stringify({ error: data.error.message })

    // MCP returns content array
    const content = data.result?.content || []
    const textParts = content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)

    return textParts.join('\n') || JSON.stringify(data.result)
  } catch (err: any) {
    return JSON.stringify({ error: err.message })
  }
}

/** Initialize all registered servers and discover their tools */
export async function initMCPServers(): Promise<MCPTool[]> {
  const allTools: MCPTool[] = []

  for (const [name, server] of servers) {
    if (server.type === 'sse') {
      const tools = await discoverSSETools(server)
      server.tools = tools
      allTools.push(...tools)
      console.log(`[mcp] ${name}: discovered ${tools.length} tools`)
    }
    // stdio support would use child_process.spawn + JSON-RPC over stdin/stdout
    // Skipped for now — SSE is more practical for remote MCP servers
  }

  return allTools
}

/** Call an MCP tool by its namespaced name, with optional workspace credential injection */
export async function callMCPTool(namespacedName: string, args: Record<string, unknown>, workspaceId?: string): Promise<string> {
  const parts = namespacedName.split('__')
  if (parts.length < 2) return JSON.stringify({ error: 'Invalid MCP tool name format' })

  const serverName = parts[0]
  const toolName = parts.slice(1).join('__')
  const server = servers.get(serverName)

  if (!server) return JSON.stringify({ error: `MCP server not found: ${serverName}` })

  // Look up per-workspace credentials for this MCP server
  let credentials: MCPCredentials | null = null
  if (workspaceId) {
    credentials = await loadMCPCredentials(workspaceId, serverName)
  }

  if (server.type === 'sse') {
    return callSSETool(server, toolName, args, credentials)
  }

  return JSON.stringify({ error: `Unsupported server type: ${server.type}` })
}

/** Get all discovered MCP tools (raw format) */
export function getMCPTools(): MCPTool[] {
  const tools: MCPTool[] = []
  for (const server of servers.values()) {
    tools.push(...server.tools)
  }
  return tools
}

/**
 * Convert a JSON Schema to a Zod schema for LangChain compatibility.
 * Handles basic types — complex schemas fall back to z.record.
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const properties = schema.properties as Record<string, any> | undefined
  if (!properties || Object.keys(properties).length === 0) {
    return z.object({}).passthrough()
  }

  const required = new Set((schema.required as string[]) || [])
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, prop] of Object.entries(properties)) {
    let field: z.ZodTypeAny

    switch (prop.type) {
      case 'string':
        field = prop.enum ? z.enum(prop.enum) : z.string()
        break
      case 'number':
      case 'integer':
        field = z.number()
        break
      case 'boolean':
        field = z.boolean()
        break
      case 'array':
        field = z.array(z.any())
        break
      case 'object':
        field = z.record(z.any())
        break
      default:
        field = z.any()
    }

    if (prop.description) {
      field = field.describe(prop.description)
    }

    if (!required.has(key)) {
      field = field.optional()
    }

    shape[key] = field
  }

  return z.object(shape)
}

/**
 * Convert all discovered MCP tools to LangChain DynamicStructuredTool instances.
 * Optionally filter to only include tools from specific servers.
 * When workspaceId is provided, MCP calls inject per-workspace credentials.
 */
export function getMCPToolsAsLangChain(serverFilter?: string[], workspaceId?: string): DynamicStructuredTool[] {
  const mcpTools = getMCPTools()
  const filtered = serverFilter
    ? mcpTools.filter((t) => serverFilter.includes(t.serverName))
    : mcpTools

  return filtered.map((tool) => {
    const schema = jsonSchemaToZod(tool.inputSchema)

    return new DynamicStructuredTool({
      name: tool.name,
      description: `[MCP:${tool.serverName}] ${tool.description}`,
      schema,
      func: async (input: Record<string, unknown>) => {
        return callMCPTool(tool.name, input, workspaceId)
      },
    })
  })
}

/** Get all registered server names */
export function getRegisteredServers(): Array<{ name: string; type: string; url?: string; toolCount: number }> {
  return Array.from(servers.entries()).map(([name, server]) => ({
    name,
    type: server.type,
    url: server.url,
    toolCount: server.tools.length,
  }))
}

/** Load MCP server configs from environment */
export function loadMCPFromEnv() {
  // Format: MCP_<NAME>_URL=https://... for SSE servers
  // Format: MCP_<NAME>_COMMAND=npx for stdio servers
  for (const [key, value] of Object.entries(process.env)) {
    const urlMatch = key.match(/^MCP_(.+)_URL$/)
    if (urlMatch && value) {
      registerMCPServer({
        name: urlMatch[1].toLowerCase(),
        type: 'sse',
        url: value,
      })
    }
  }
}
