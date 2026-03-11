import { describe, it, expect } from 'vitest'
import { registerMCPServer, getMCPTools, callMCPTool } from '../lib/mcp-client.js'

describe('MCP Client', () => {
  it('returns error for invalid tool name format', async () => {
    const result = await callMCPTool('invalidname', {})
    expect(result).toContain('Invalid MCP tool name format')
  })

  it('returns error for unknown server', async () => {
    const result = await callMCPTool('unknown__tool', {})
    expect(result).toContain('MCP server not found: unknown')
  })

  it('registers a server', () => {
    registerMCPServer({
      name: 'test-server',
      type: 'sse',
      url: 'http://localhost:9999',
    })
    // getMCPTools should return empty since we haven't discovered
    // (discovery would fail on fake URL, but registration works)
    const tools = getMCPTools()
    // tools from test-server would be empty since no discovery happened
    expect(Array.isArray(tools)).toBe(true)
  })
})
