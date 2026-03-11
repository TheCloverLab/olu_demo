/**
 * MCP Client — Model Context Protocol integration
 *
 * Connects to external MCP servers to discover and invoke tools dynamically.
 * Supports stdio-based MCP servers (subprocess) and SSE-based servers (HTTP).
 */

interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  serverName: string
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

/** Call a tool on an SSE-based MCP server */
async function callSSETool(server: MCPServer, toolName: string, args: Record<string, unknown>): Promise<string> {
  if (!server.url) return JSON.stringify({ error: 'Server URL not configured' })

  try {
    const res = await fetch(`${server.url}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

/** Call an MCP tool by its namespaced name */
export async function callMCPTool(namespacedName: string, args: Record<string, unknown>): Promise<string> {
  const parts = namespacedName.split('__')
  if (parts.length < 2) return JSON.stringify({ error: 'Invalid MCP tool name format' })

  const serverName = parts[0]
  const toolName = parts.slice(1).join('__')
  const server = servers.get(serverName)

  if (!server) return JSON.stringify({ error: `MCP server not found: ${serverName}` })

  if (server.type === 'sse') {
    return callSSETool(server, toolName, args)
  }

  return JSON.stringify({ error: `Unsupported server type: ${server.type}` })
}

/** Get all discovered MCP tools */
export function getMCPTools(): MCPTool[] {
  const tools: MCPTool[] = []
  for (const server of servers.values()) {
    tools.push(...server.tools)
  }
  return tools
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
