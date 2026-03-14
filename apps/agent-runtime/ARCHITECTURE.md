# Agent Runtime — Architecture

## Overview

The agent-runtime is a multi-agent orchestration backend that executes AI agent tasks.
It supports two execution modes and extensible tool loading.

## Runtime Architecture

```
POST /chat or /invoke
  → agent-runtime (HTTP server, index.ts)
    → getAgentRuntimeType(agentId)
    → if "langgraph" → LangGraph graph (task-agent.ts / chat-agent.ts)
    → if "openclaw"  → OpenClaw instance (Phase 2, not yet implemented)
```

### Phase 1: MCP Bridge (✅ Done)

LangGraph agents call external tools via the Model Context Protocol (MCP).

```
LangGraph Agent
  → getAgentTools(agentId)
    → Native Skills (skill-registry.ts)
    → MCP Tools (mcp-client.ts)
      → discoverSSETools() — JSON-RPC tools/list
      → callSSETool()      — JSON-RPC tools/call + credential injection
```

Key files:
- `src/lib/mcp-client.ts` — MCP client (tool discovery, invocation, credential injection)
- `src/lib/skill-registry.ts` — Skill packs + MCP tool loading, per-agent config
- `src/index.ts` — HTTP API (register servers, store credentials)

### Phase 2: OpenClaw Runtime (✅ Done)

OpenClaw runs as a standalone Docker service alongside the agent-runtime.

```
docker-compose.yml (repo root)
├── agent-runtime (port 8080)
├── openclaw-gateway (port 18789 UI, internal 3100)
├── mcp-github (port 3001)     ← optional MCP servers
└── mcp-slack (port 3002)      ← optional MCP servers
```

How it works:
1. `docker-compose.yml` defines `openclaw-gateway` service (`ghcr.io/openclaw/openclaw:v2026.3.12`)
2. `index.ts` checks `getAgentRuntimeType(agentId)` — if `openclaw`, proxies `/chat` and `/invoke` to OpenClaw
3. All `/openclaw/*` requests are forwarded to the OpenClaw gateway (for direct API access)
4. API layer stays unified — callers use the same `/chat` and `/invoke` endpoints regardless of runtime
5. OpenClaw Gateway UI available at `http://localhost:18789`
6. Env: `OPENCLAW_URL` (default `http://openclaw-gateway:3100` in Docker, `http://localhost:3100` locally)
7. LLM API keys are passed through to OpenClaw via docker-compose environment

## Tool System

### Native Skills (11 packs, 30+ tools)

| Skill Pack | Tools | Core? |
|------------|-------|-------|
| workspace-core | listMyTasks, updateTaskStatus, createTask, getTeamOverview, postConversation | ✅ |
| memory | rememberMemory, recallMemory | ✅ |
| automation | scheduleCronJob, logEvent | ✅ |
| credentials | manageCredentials | ✅ |
| web | webSearch, fetchWebpage, browseWebpage | |
| content | generateImage, generateFile, generateChart | |
| code | executeCode | |
| communication | sendEmail | |
| lark-suite | larkTasks, larkCalendar, larkBitable | |
| marketing | facebookAds, googlePlayReviews | |
| social | postTweet, getMyTweets, likeTweet, searchTweets, getMyMentions | |

### MCP Tools (extensible)

Any MCP-compatible server can be registered. Tools are discovered via JSON-RPC `tools/list`
and converted to LangChain `DynamicStructuredTool` instances.

Per-agent configuration:
- `workspace_agents.enabled_skills` — which native skill packs to load (null = all)
- `workspace_agents.enabled_mcp_servers` — which MCP servers to use
- `workspace_agents.runtime_type` — `langgraph` or `openclaw`

## Credential Injection

MCP tool calls inject per-workspace credentials automatically.

Storage: `workspace_integrations` table
- `provider` = `mcp:<serverName>` (e.g., `mcp:github`)
- `config_json` = credentials object
- `status` = `connected`

Supported credential types:
- `bearer` — Authorization: Bearer token
- `api_key` — X-API-Key header
- `basic` — Authorization: Basic base64(user:pass)
- `custom_header` — arbitrary header name/value

API: `POST /mcp/credentials` to store credentials for a workspace + server.

## MCP Server Deployment

Recommended: Docker Compose co-located with agent-runtime (internal network, zero latency).

```yaml
services:
  agent-runtime:
    environment:
      MCP_GITHUB_URL: http://mcp-github:3001
      MCP_SLACK_URL: http://mcp-slack:3002

  mcp-github:
    image: node:20
    command: npx @modelcontextprotocol/server-github --port 3001

  mcp-slack:
    image: node:20
    command: npx @modelcontextprotocol/server-slack --port 3002
```

Registration: environment variables (`MCP_<NAME>_URL=...`) or HTTP API (`POST /mcp/servers`).

## Key Decisions

- **MCP is the extension protocol**, not tied to OpenClaw specifically
- **Native tools stay native** — core workspace operations cannot be external MCP
- **MCP is for user-extensible integrations** — Shopify, Discord, Notion, Stripe, etc.
- **Per-agent granularity** — each agent independently configures skills, MCP servers, and runtime
- **No workspace-level runtime config** — redundant when per-agent is supported
