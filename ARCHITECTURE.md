# OLU Platform Architecture

## Overview

OLU is a multi-tenant SaaS platform combining **consumer-facing native apps** with an **AI-Agent Business OS**. The platform uses an HR metaphor where AI agents and human employees share the same Employee model — position, JD, skills, qualifications, performance, and salary (token cost).

---

## Product Architecture (4 Layers)

```mermaid
graph TB
  subgraph Layer1["Layer 1 — OLU Native Apps"]
    FC[Fan Community]
    CO[Courses / Academy]
    CS[Consulting]
    KP[Knowledge Products]
  end

  subgraph Layer2["Layer 2 — Existing Apps"]
    SH[Shopify]
    TM[Temu]
    SN[Shein]
  end

  subgraph Layer3["Layer 3 — Business OS"]
    HW[Hybrid Workforce<br/>AI + Human]
    TM2[Task Management]
    TC[Team Chat]
    MOD[Module-Based Access]
  end

  subgraph Layer4["Layer 4 — Third-Party Integrations"]
    SL[Slack]
    TG[Telegram]
    WA[WhatsApp]
    ZD[ZenDesk]
    MP[Mixpanel]
  end

  Layer1 --> Layer3
  Layer2 --> Layer3
  Layer3 --> Layer4
```

---

## Monorepo Structure

```mermaid
graph LR
  subgraph Monorepo["olu_demo/"]
    subgraph Apps["apps/"]
      WEB["web/<br/>React + Vite Frontend"]
      AR["agent-runtime/<br/>LangGraph Agent Backend"]
    end

    subgraph Packages["packages/"]
      SHARED["shared/<br/>Domain Models & Types"]
    end

    subgraph Infra["supabase/"]
      MIG["migrations/<br/>35+ SQL migrations"]
      FUNC["functions/<br/>Edge Functions"]
    end
  end

  WEB -->|HTTP API| AR
  WEB -->|Realtime + Auth| Infra
  AR -->|DB + Storage| Infra
```

---

## System Data Flow

```mermaid
flowchart TD
  USER([User / Browser])

  subgraph Frontend["apps/web (Vite + React)"]
    CONSUMER[Consumer App]
    BUSINESS[Business App]
  end

  subgraph Backend["apps/agent-runtime (Node.js)"]
    CHAT["/chat — Chat Agent"]
    INVOKE["/invoke — Task Agent"]
    BATCH["/batch — Batch Run"]
    OAUTH["/oauth/* — OAuth Flows"]
    WEBHOOK["/webhook/* — Event Hooks"]
    SCHEDULER["Cron Scheduler"]
    LARK["Lark Bot Webhook"]
  end

  subgraph Supabase["Supabase"]
    AUTH[Auth]
    DB[(PostgreSQL)]
    RT[Realtime]
    STORE[Storage]
    EDGE[Edge Functions]
  end

  subgraph External["External Services"]
    TWITTER[Twitter / X API]
    LLM[LLM Providers<br/>OpenAI / Anthropic / Kimi]
    MCP[MCP Servers]
  end

  USER --> Frontend
  CONSUMER --> DB
  CONSUMER --> RT
  BUSINESS --> CHAT
  BUSINESS --> INVOKE
  BUSINESS --> DB

  CHAT --> LLM
  CHAT --> DB
  INVOKE --> LLM
  INVOKE --> DB
  OAUTH --> TWITTER
  SCHEDULER --> INVOKE
  LARK --> CHAT
  CHAT --> MCP

  Backend --> DB
  Backend --> STORE
```

---

## Frontend Domain Architecture

```mermaid
graph TD
  subgraph ConsumerApp["Consumer App (/consumer)"]
    D_CONSUMER["consumer/<br/>App config, templates"]
    D_SOCIAL["social/<br/>Posts, comments, likes"]
    D_PROFILE["profile/<br/>User profiles"]
  end

  subgraph BusinessApp["Business App (/business)"]
    D_TEAM["team/<br/>Agents + Humans (HR model)"]
    D_WORKSPACE["workspace/<br/>Multi-tenant workspaces"]
    D_EXPERIENCE["experience/<br/>Modular content (forum, course, chat)"]
    D_PRODUCT["product/<br/>Products, plans, purchases, home config"]
    D_CHAT["chat/<br/>Unified chat (4 scopes)"]
    D_CONNECTORS["connectors/<br/>Task targets (Twitter, Shopify...)"]
    D_INTEGRATIONS["integrations/<br/>Communication bridges"]
    D_CAMPAIGN["campaign/<br/>Marketing campaigns"]
    D_AGENT["agent/<br/>Re-exports from team/"]
  end

  subgraph SharedDomain["Shared"]
    D_AUTH["auth/<br/>Session & auth"]
  end

  subgraph Contexts["React Contexts"]
    CTX_SESSION["SessionContext"]
    CTX_WORKSPACE["WorkspaceContext"]
    CTX_CONSUMER["ConsumerContext"]
    CTX_APP["AppContext"]
  end

  D_AUTH --> CTX_SESSION
  D_WORKSPACE --> CTX_WORKSPACE
  D_CONSUMER --> CTX_APP
  ConsumerApp --> CTX_CONSUMER
  BusinessApp --> CTX_WORKSPACE
```

---

## Business App Pages

```mermaid
graph LR
  subgraph Pages["Business Pages"]
    TEAM["Team.tsx<br/>Hybrid workforce grid"]
    CHAT["TeamChat.tsx<br/>Agent chat interface"]
    MEMBERS["MembersPage.tsx<br/>Purchase records & stats"]
    CONN["Connectors.tsx<br/>OAuth connectors + integrations"]
    SETTINGS["BusinessSettings.tsx<br/>Workspace settings"]
  end

  subgraph Features
    F1["Module-based access<br/>(not role-based)"]
    F2["Agent + Human<br/>unified employee model"]
    F3["Multi-turn chat<br/>with conversation memory"]
    F4["OAuth 2.0 PKCE<br/>for platform connectors"]
  end

  TEAM --> F1
  TEAM --> F2
  CHAT --> F3
  CONN --> F4
```

---

## Agent Runtime Architecture

```mermaid
flowchart TD
  subgraph ChatAgent["Chat Agent (chat-agent.ts)"]
    CA_IN[User Message + Images] --> CA_HIST[Load Conversation History<br/>agent_conversations table]
    CA_HIST --> CA_SYS[Build System Prompt<br/>agent persona + workspace context]
    CA_SYS --> CA_LLM[LLM Call<br/>with tool-calling]
    CA_LLM --> CA_TOOLS{Tool Calls?}
    CA_TOOLS -->|Yes| CA_EXEC[Execute Tools]
    CA_EXEC --> CA_LLM
    CA_TOOLS -->|No| CA_SAVE[Save to History]
    CA_SAVE --> CA_OUT[Response]
  end

  subgraph TaskAgent["Task Agent (task-agent.ts)"]
    TA_IN[Task Description] --> TA_PLAN[Plan Phase]
    TA_PLAN --> TA_APPROVE{Approval<br/>Required?}
    TA_APPROVE -->|Yes| TA_INTERRUPT[Interrupt<br/>Wait for Decision]
    TA_APPROVE -->|No| TA_EXEC[Execute Phase]
    TA_INTERRUPT -->|Approved| TA_EXEC
    TA_INTERRUPT -->|Rejected| TA_CANCEL[Cancel]
    TA_EXEC --> TA_SUMMARY[Summary Phase]
  end

  subgraph Tools["Agent Tools"]
    T_TASK["Task Tools<br/>create, update, list tasks"]
    T_TWITTER["Twitter Tools<br/>post, like, search, mentions"]
    T_WORKSPACE["Workspace Tools<br/>read agent/workspace data"]
    T_MCP["MCP Tools<br/>dynamic external tools"]
    T_SKILLS["Skill Tools<br/>registered skill execution"]
  end

  CA_EXEC --> Tools
  TA_EXEC --> Tools
```

---

## LLM Provider System

```mermaid
graph TD
  subgraph Providers["Configured Providers (models.ts)"]
    OPENAI["OpenAI<br/>gpt-4o-mini"]
    ANTHROPIC["Anthropic<br/>claude-sonnet-4-20250514"]
    KIMI["Kimi (Moonshot)<br/>moonshot-v1-128k"]
  end

  subgraph Selection["Model Selection"]
    DEFAULT["Default: kimi"]
    OVERRIDE["Per-request override<br/>provider + model params"]
    VISION["Vision routing<br/>→ OpenAI gpt-4o-mini"]
  end

  Selection --> Providers
  Providers --> LLM_CALL["Chat Agent / Task Agent"]
```

---

## Unified Chat System

All chat/messaging in OLU uses a single set of tables (`chats`, `chat_members`, `chat_messages`), differentiated by **scope**. Each scope enables a different subset of features via `SCOPE_FEATURES`.

```mermaid
graph TD
  subgraph Scopes["Chat Scopes"]
    EXP["experience<br/>Consumer group chats<br/>in experiences"]
    SUP["support<br/>1:N customer support<br/>with AI agent toggle"]
    TEAM["team<br/>Internal team group chats<br/>with @mentions"]
    AGENT["agent<br/>1:1 AI agent chat<br/>streaming + model selector"]
  end

  subgraph Tables["Unified Tables"]
    CHATS["chats<br/>scope, workspace_id,<br/>experience_id?, agent_id?"]
    MEMBERS["chat_members<br/>user_id, role, unread"]
    MSGS["chat_messages<br/>sender_id, sender_type,<br/>content, metadata"]
  end

  subgraph Features["Feature Flags (SCOPE_FEATURES)"]
    F_MD["markdown"]
    F_IMG["images (all scopes)"]
    F_TC["toolCalls (agent only)"]
    F_REASON["reasoning (agent only)"]
    F_MODEL["modelSelector (agent only)"]
    F_STREAM["streaming (agent only)"]
    F_MENTION["mentions (experience, support, team)"]
    F_AI["aiReply (support only)"]
  end

  Scopes --> Tables
  Tables --> Features
```

### Chat Architecture

| Component | Path | Purpose |
|-----------|------|---------|
| `domain/chat/types.ts` | Types + `SCOPE_FEATURES` | `ChatScope`, `ChatMessage`, `ChatFeatures` |
| `domain/chat/api.ts` | Data layer | CRUD, realtime subscriptions, file upload |
| `components/ChatRoom.tsx` | Reusable chat UI | Used by consumer pages (GroupChatView, SupportChat) |
| `pages/TeamChat.tsx` | Business agent/team chat | Custom UI with model selector, budget cards, tool calls |
| `pages/SupportCenter.tsx` | Business support inbox | Lists support chats, per-agent assignment |

### RLS Strategy

Chat RLS uses `SECURITY DEFINER` functions to break recursion:

- `is_chat_member(chat_id, user_id)` — bypasses RLS on `chat_members`
- `is_workspace_owner(workspace_id, user_id)` — bypasses RLS on `workspace_memberships`

Workspace owners can see all chats in their workspace. Members can only see chats they belong to.

---

## Database Schema (Key Tables)

```mermaid
erDiagram
  workspaces ||--o{ workspace_agents : has
  workspaces ||--o{ workspace_integrations : has
  workspaces ||--o{ workspace_experiences : has
  workspaces ||--o{ workspace_products : has
  workspaces ||--o{ chats : has
  workspace_agents ||--o{ workspace_agent_tasks : assigned
  workspace_agents ||--o{ chats : "agent scope"
  workspace_experiences ||--o{ chats : "experience scope"
  workspace_experiences ||--o{ workspace_product_experiences : linked
  workspace_products ||--o{ workspace_product_plans : has
  workspace_products ||--o{ workspace_product_experiences : linked
  workspace_experiences ||--o{ forum_posts : contains
  chats ||--o{ chat_members : has
  chats ||--o{ chat_messages : contains

  workspaces {
    uuid id PK
    text name
    uuid owner_id FK
    text plan
    text icon
    text cover
    text headline
  }

  workspace_agents {
    uuid id PK
    uuid workspace_id FK
    text name
    text role
    text status
    text agent_key
    text avatar_url
  }

  workspace_agent_tasks {
    uuid id PK
    uuid workspace_agent_id FK
    text title
    text status
    text priority
    int progress
  }

  workspace_integrations {
    uuid id PK
    uuid workspace_id FK
    text provider
    jsonb config_json
    text status
  }

  workspace_experiences {
    uuid id PK
    uuid workspace_id FK
    text type
    text name
    text visibility
    text cover
  }

  workspace_products {
    uuid id PK
    uuid workspace_id FK
    text name
    text access_type
  }

  chats {
    uuid id PK
    uuid workspace_id FK
    text scope
    text name
    uuid experience_id FK
    uuid agent_id FK
    jsonb config
    text last_message
    timestamptz last_message_at
  }

  chat_members {
    uuid chat_id PK_FK
    uuid user_id PK_FK
    text role
    int unread
  }

  chat_messages {
    uuid id PK
    uuid chat_id FK
    text sender_id
    text sender_type
    text message_type
    text content
    jsonb metadata
    timestamptz created_at
  }
```

---

## Deployment Architecture

```mermaid
graph TB
  subgraph Client
    BROWSER[Browser]
  end

  subgraph Vercel
    WEB["apps/web<br/>Vite Static + Rewrites"]
  end

  subgraph AWS["AWS (us-west-2)"]
    ALB["ALB<br/>olu-agent-runtime-alb"]
    ECS["ECS Fargate<br/>olu-agent-runtime"]
    ECR["ECR<br/>Docker Registry"]
  end

  subgraph Services
    SUPA["Supabase Cloud<br/>DB + Auth + Realtime + Storage"]
    TWITTER_API["Twitter API v2"]
    LLM_API["LLM APIs<br/>OpenAI / Anthropic / Kimi"]
  end

  subgraph CI["GitHub Actions"]
    GHA["deploy-agent-runtime.yml<br/>Build → ECR → ECS"]
  end

  BROWSER --> WEB
  BROWSER --> SUPA
  WEB -->|"/api/agent-runtime/*"| ALB
  ALB --> ECS
  ECR -.->|image| ECS
  GHA -.->|push image| ECR
  GHA -.->|update service| ECS
  ECS --> SUPA
  ECS --> TWITTER_API
  ECS --> LLM_API
```

---

## Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Full-stack TypeScript** | All apps and packages use TypeScript/Node.js |
| **Module-based access** | `enabledBusinessModules` controls feature access, not user roles |
| **HR metaphor** | AI agents and humans share `workspace_agents` — same fields, same management |
| **Domain-driven frontend** | 10 domains under `src/domain/`, each with own `api.ts`, `types.ts`, `hooks.ts` |
| **Separation of concerns** | Connectors (task targets) vs Integrations (communication bridges) |
| **Multi-tenant** | Workspace-scoped data isolation via Supabase RLS |
| **Unified chat** | Single `chats`/`chat_members`/`chat_messages` tables; 4 scopes (experience, support, team, agent) with feature flags |
| **OAuth delegation** | Workspace-level OAuth tokens for platform connectors (Twitter, etc.) |
