# OLU Demo — Agent Instructions

## Project Overview

OLU is a multi-tenant SaaS platform with two sides:

- **Consumer side** — Native apps for fan communities, courses, consulting, and knowledge products
- **Business side** — AI-Agent Business OS with hybrid workforce (AI + human), collaboration, task management

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Deployment**: Vercel (auto-deploys from `main`)
- **Testing**: Vitest + React Testing Library
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Architecture

### Product Layers (4 layers)

1. **OLU Native Apps** — Fan communities, Courses, Consulting, Knowledge products (we build consumer UI)
2. **Existing Apps** — Shopify, Temu, Shein (agents operate ON platforms, no consumer UI from us)
3. **Business OS** — Hybrid workforce (AI + human), module-based gating (not role-based)
4. **Third-Party Integrations** — Slack, TG, WhatsApp, ZenDesk, Mixpanel

### Key Domain Insight: HR Metaphor

AI agents and human employees share one Employee model: position, JD, skills, qualifications, performance, salary (token cost).

### Directory Structure (Monorepo)

```
apps/
  web/                   # React SPA (Vite + Tailwind)
    src/
      apps/consumer/     # Consumer-facing pages (Shop, Courses, Discover, etc.)
      apps/business/     # Business-facing pages (Team, TeamChat, Settings, etc.)
      domain/            # Domain layer (consumer, profile, social, team, connectors, agent, workspace)
      context/           # React contexts (AppContext — global state)
      lib/               # Supabase client, types, utilities
    api/                 # Vercel serverless functions
  agent-runtime/         # LangGraph JS agent backend (multi-agent orchestration)
packages/
  shared/                # Shared domain types used by web + agent-runtime
scripts/                 # Seed scripts, ops tools
supabase/                # Migrations, seed.sql, edge functions, config
```

### Data Flow

Pages → `domain/*/api.ts` → `lib/supabase.ts` → Supabase

Consumer pages use `useApp()` context for:
- `consumerConfig` — per-app config (featured_creator_id, etc.)
- `hasModule(key)` — module-based feature gating
- `appType` — 'community' | 'academy' | etc.
- `consumerTemplate` — template variant

## Conventions

- **Module-based gating** — Use `hasModule('creator_ops')` etc., not roles
- **Backend data first** — If Supabase has a table for it, fetch from backend. Only use mock data for types that have no backend table (e.g., Wallet balance, ContentDetail comments)
- **Domain layer** — All Supabase queries go through `src/domain/*/api.ts`, never call supabase directly from pages
- **Seed data consistency** — `supabase/seed.sql` and `scripts/create-demo-accounts.mjs` must stay in sync. The demo script uses dynamic UUIDs; seed.sql uses fixed UUIDs
- **Consumer templates** — Different app types render different UIs (community vs academy vs consulting)

## Development

```bash
npm run dev          # Start web dev server
npm run build        # Production build (web)
npm run test         # Run tests (web)
npm run dev:agent    # Start agent-runtime dev server
```

## Demo Accounts

Created by `scripts/create-demo-accounts.mjs`. Password: `Demo123!`

Key accounts:
- **Luna Chen** (`luna.demo@olu.app`) — Creator with community, courses, products
- **Alex Park** (`alex.demo@olu.app`) — Consumer / fan
- **GameVerse Studios** (`gameverse.demo@olu.app`) — Marketing business
- **ArtisanCraft Co.** (`artisancraft.demo@olu.app`) — Supply chain business

## Deployment

- **Frontend**: Vercel, auto-deploys from `main` branch
- **Production URL**: `https://internal-demo.olu.tech`
- **Database**: Supabase (project ref: `indiwmqxvnkzapsuvhyh`)
- **Seed data**: Run `create-demo-accounts.mjs` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars
