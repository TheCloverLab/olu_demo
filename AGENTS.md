# OLU Demo — Agent Instructions

> See **ARCHITECTURE.md** for Mermaid diagrams (product layers, data flow, deployment, agent runtime, ER diagram).

## Project Overview

OLU is a multi-tenant SaaS platform: **consumer-facing native apps** + **AI-Agent Business OS**. HR metaphor — AI agents and human employees share one Employee model (position, JD, skills, salary/token cost).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + i18next (EN/ZH)
- **Backend**: Supabase (Postgres 17, Auth, Edge Functions, Realtime, Storage)
- **Agent Runtime**: LangGraph JS on AWS ECS Fargate (multi-agent, tool calling, approval flows)
- **LLM Providers**: OpenAI (gpt-4o-mini), Anthropic (claude-sonnet-4), Kimi (moonshot-v1-128k), default: kimi
- **Deployment**: Frontend → Vercel (auto-deploys from `main`), Agent → AWS ECS via GitHub Actions
- **Testing**: Vitest + React Testing Library + Playwright (E2E screenshots)

## Frontend Architecture

### Context (split design)
- `SessionContext` — Auth user session
- `WorkspaceContext` — Workspace, business modules, module-based gating
- `ConsumerContext` — Template, app type, config, consumer experience
- `AppContext` — Facade combining all three

### Data Flow
```
Pages → useApp() context → domain/*/api.ts → lib/supabase.ts → Supabase (with RLS)
```

### Demo Mode

When `VITE_SUPABASE_URL` contains `demo-placeholder`, all Supabase calls are bypassed:
- AuthContext provides a mock `DEMO_USER` (verified, onboarding complete)
- WorkspaceContext enables all modules
- ConsumerContext uses `DEFAULT_TEMPLATE` without API calls

## Database Schema

### Core
| Table | Purpose |
|-------|---------|
| `users` | User profiles (creators, fans, advertisers, suppliers) with auth linkage |
| `workspaces` | Business OS workspace (owner, slug, status) |
| `workspace_memberships` | User membership with roles (owner/admin/operator/viewer) |
| `workspace_modules` | Enabled business modules (creator_ops/marketing/supply_chain) |
| `workspace_permissions` | Role-based resource/action permissions |
| `workspace_policies` | Approval, sandbox, notification policies (JSONB) |
| `workspace_billing` | Billing plan (starter/pro/enterprise) and status |
| `workspace_integrations` | Connected platforms (Shopify, Slack, TG, WhatsApp, X, IG, Zendesk, Mixpanel) |
| `workspace_consumer_configs` | Consumer template config (fan_community/sell_courses) with JSONB overrides |

### Consumer
| Table | Purpose |
|-------|---------|
| `consumer_courses` | Courses (hero, instructor, level, outcomes, slug) |
| `consumer_course_sections` | Course chapters (duration, summary, preview flag, position) |
| `consumer_memberships` | User membership in creator communities by tier |
| `consumer_course_purchases` | Enrollment records |
| `consumer_lesson_progress` | Per-section completion tracking |
| `membership_tiers` | Subscription tiers (Free/Core/VIP) with perks |
| `fans` | Fan records linked to creators (tier, spend, status) |
| `posts` | Creator posts (image/video/music/text) with engagement metrics |
| `products` | Creator store items (price, stock, sales) |

### Agent & Team
| Table | Purpose |
|-------|---------|
| `agent_templates` | Pre-built agent blueprints (Creator/Advertiser/Supplier/Pro) |
| `workspace_agents` | Hired agents in workspace (template_id, status, last_message) |
| `workspace_agent_tasks` | Agent tasks (priority, progress, status) |
| `workspace_agent_task_logs` | Audit trail for task lifecycle events |
| `workspace_employees` | Human staff (position, skills, salary, status) |
| `agent_scheduled_jobs` | Cron-like scheduled tasks for agents |
| `agent_memories` | Long-term agent memory with pgvector embeddings |
| `agent_events` | Event queue for agent processing |

### Social & Chat
| Table | Purpose |
|-------|---------|
| `social_chats` | 1-to-1 DM channels |
| `social_chat_messages` | Messages in DM threads |
| `group_chats` | Multi-user chat rooms |
| `group_chat_messages` | Group chat messages |
| `conversations` | Agent ↔ user chat logs |

### Business
| Table | Purpose |
|-------|---------|
| `business_campaigns` | Advertiser campaigns (budget, reach, conversions) |
| `business_campaign_targets` | Creator targets per campaign (offer, stage, deliverable) |
| `business_campaign_events` | Campaign audit log |
| `supplier_products` | Supplier inventory (SKU, price, sales) |
| `supplier_creator_partnerships` | Supplier-creator relationships |
| `analytics_revenue` | Monthly revenue by source |
| `analytics_views` | Monthly views by platform |
| `ip_licenses` | IP license requests |
| `ip_infringements` | IP violation reports |

## Domain API Layer

Each domain has `api.ts` (public functions) + optional `data.ts` (low-level queries).

### consumer/api.ts
- `getConsumerExperience(templateKey, viewerName?, config?)` — UI copy/structure per template
- `getCommunityMembershipSnapshot(viewer?, creatorId?)` — Tiers, fans, stats
- `getCourseLibrarySnapshot(courseSlug?)` — Published courses list
- `getCourseSnapshotBySlug(slug)` — Single course detail with sections

### workspace/api.ts
- `ensureWorkspaceForUser(user)` — Get or create workspace + init modules/integrations
- `getWorkspaceSettingsForUser(user)` — Full settings (modules, permissions, integrations, billing, config)
- `getEnabledBusinessModulesForUser(user)` — Enabled module keys
- `getWorkspaceConsumerConfigForUser(user)` — Consumer template config
- `updateWorkspaceConsumerTemplateForUser(user, templateKey)` — Switch template
- `updateWorkspaceConsumerConfigForUser(user, updates)` — Update config JSONB
- `getUserWallet(userId)` / `getWorkspaceWalletForUser(user)` — Stablecoin wallets

### team/api.ts
- `getAgentTemplates()` — Active agent templates
- `getWorkspaceAgentsForUser(user)` / `getWorkspaceAgentsWithTasksForUser(user)` — Agents list
- `hireWorkspaceAgent(user, template, name?)` — Hire agent from template
- `getTeamEmployeesForUser(user)` — Human employees as EmployeeWithTasks
- `getWorkspaceTeamSnapshotForUser(user)` — All agents + humans + task counts
- `getWorkspaceGroupChatsForUser(userId)` / `getWorkspaceGroupMessages(groupChatId)` — Group chat
- `getAgentConversation(agentId)` / `postAgentConversationMessage(...)` — Agent DMs
- `uploadTeamChatImages(userId, scope, files)` — Upload chat attachments

### business/api.ts
- `getCreatorRevenueAnalytics(creatorId)` / `getCreatorViewsAnalytics(creatorId)` — Analytics
- `getCreatorCustomers(creatorId)` — Fans by spend
- `getCreatorStoreProducts(creatorId)` — Store inventory
- `getCreatorLicenses(creatorId)` / `getCreatorInfringements(creatorId)` — IP management
- `getSupplierCatalog(supplierId)` / `getSupplierCreatorLinks(supplierId)` — Supply chain

### campaign/api.ts
- `getLatestBusinessCampaignForAdvertiser(advertiserId)` — Campaign with targets & events
- `startBusinessCampaignDemo(advertiserId, creatorId)` — Create demo campaign
- `advanceBusinessCampaign(campaignId, advertiserId)` — Step through workflow
- `approveBusinessCampaignTarget(targetId, creatorId)` / `rejectBusinessCampaignTarget(...)` — Creator response

### social/api.ts
- `ensureDirectSocialChat(userId, withUserId)` — Get or create DM channel
- `getDirectSocialChats(userId)` / `getDirectSocialMessages(chatId)` — DM list & messages
- `postDirectSocialMessage(chatId, fromType, text)` — Send DM

### profile/api.ts
- `getProfileById(userId)` — User profile details
- `getPublicCreators()` — Listed creators

### integrations/api.ts & connectors/api.ts
- `getWorkspaceIntegrationSummariesForUser(user)` — Integration list with category & direction
- `getWorkspaceConnectorSummariesForUser(user)` — Connector (task target) list

## Pages

### Consumer Pages (`apps/consumer/pages/`)
| Page | Description |
|------|-------------|
| Home | Main landing |
| AppLanding | App storefront intro |
| Discover | Content discovery |
| Feed | Post feed with composer |
| Chat | Direct messaging |
| Gallery | Image/media gallery with albums |
| Topics | Community discussion topics |
| Membership | Tier comparison & join |
| Subscriptions | User's active memberships |
| Shop | Creator store |
| Courses | Course storefront hero |
| CourseCatalog | Course listing |
| ContentDetail | Single course with sections |
| Learn / LearningHub | Learning progress |
| Checkout | Purchase flow |
| Wallet | Stablecoin wallet |
| UserCenter | User profile settings |
| PublicProfile | Creator profile view |

### Business Pages (`apps/business/pages/`)
| Page | Description |
|------|-------------|
| BusinessWorkspace | Main workspace entry |
| Team | Agent & employee roster |
| TeamChat | Group chat interface |
| AIAgentConfig | Agent customization & hiring |
| EmployeeProfile | Agent/human employee detail |
| HumanEmployees | Human staff management |
| TaskCenter | Task management board |
| CreatorConsole | Creator business OS view |
| AdvertiserConsole | Advertiser campaign workbench |
| SupplierConsole | Supplier partner management |
| ApprovalCenter | Campaign approval workflows |
| CreatorStudio | Theme/layout/tabs editor with live preview |
| CourseEditor | Course builder (3-level: Course→Module→Lesson) |
| Connectors | Task target connectors config |
| AppManagement | Consumer template management |
| BusinessSettings | Workspace settings (modules, integrations, billing) |
| BusinessAccount | Business account settings |
| WalletPage | Workspace stablecoin wallet |

## Edge Functions (`supabase/functions/`)
- `agent-chat/` — Agent chat message processing
- `agent-webhook/` — Webhook receiver for agent events
- `approve-role/` — Role/module approval workflow
- `upgrade-role/` — Role upgrade flow

## Conventions

- **Module-based gating** — Use `hasModule('creator_ops')` etc., not roles
- **Backend data first** — If Supabase has a table for it, fetch from backend. Only mock data for types without a table
- **Domain layer** — All Supabase queries go through `domain/*/api.ts`, never call supabase directly from pages
- **Seed data consistency** — `supabase/seed.sql` and `scripts/create-demo-accounts.mjs` must stay in sync
- **Consumer templates** — Different app types render different UIs (community vs academy vs consulting). Defined in `templateConfig.tsx`
- **i18n** — All user-facing text uses `useTranslation()` with `consumer.*` and `creatorStudio.*` namespaces
- **CSS variables** — Use `--olu-*` for theming. Support both dark and light modes

## Development

```bash
npm run dev          # Start web dev server
npm run build        # Production build (web)
npm run test         # Run tests (web)
npm run dev:agent    # Start agent-runtime dev server
npx playwright test  # Run E2E screenshot tests (port 5199)
```

## Demo

- **Production URL**: `https://internal-demo.olu.tech`
- **Supabase**: Project ref `indiwmqxvnkzapsuvhyh`
- **Demo accounts**: Created by `scripts/create-demo-accounts.mjs`, password `Demo123!`
  - Luna Chen (`luna.demo@olu.app`) — Creator
  - Alex Park (`alex.demo@olu.app`) — Consumer
  - GameVerse Studios (`gameverse.demo@olu.app`) — Marketing
  - ArtisanCraft Co. (`artisancraft.demo@olu.app`) — Supply chain
- **Demo mode**: When `VITE_SUPABASE_URL` contains `demo-placeholder`, all auth/API calls are bypassed with mock data
