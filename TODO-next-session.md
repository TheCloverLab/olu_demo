# OLU Demo — Next Session Prompt

> Copy this entire file as the prompt for the next Claude Code session.

## Context

OLU is a multi-tenant SaaS platform (React + TypeScript + Vite + Supabase). We just completed the Experience & Product model — modular content (forum/course/group_chat/support_chat) per workspace, products with pricing plans, consumer purchase flow, and a business-side Members page. All code is on the `main` branch. Production deploys automatically from main to Vercel at `internal-demo.olu.tech`.

Read `AGENTS.md` for full architecture reference. Read `ARCHITECTURE.md` for diagrams.

## Priority 1: Simplify Membership Model (Whop-style) — DONE

**Completed:** Removed `members_only` visibility. Access is now purely Whop-style:
- No linked products → free for all joined members
- Has linked products → need to purchase any linked product
- Migration `20260312000003` drops `members_only` from DB CHECK constraint
- `ExperienceVisibility` type simplified to `'public' | 'product_gated'`
- `canAccessExperience()` and `getAccessibleExperiences()` rewritten to use product-experience linking
- Seed data and ExperienceManager UI updated

### Still TODO:
- Add `workspace_joins` table for "Join Workspace" concept (sidebar display)
- Add "Join" button on WorkspaceHome for non-joined users
- Consumer sidebar: show list of joined workspaces

## Priority 2: Fix Production Error

`internal-demo.olu.tech/discover` shows a blank page or `{"error":"requested path is invalid"}`. The Vercel deploy succeeds (status: success) and env vars point to real Supabase (`indiwmqxvnkzapsuvhyh.supabase.co`). Likely causes:
- Runtime JS error in the React app (check browser console)
- Vercel rewrite conflict in `vercel.json` (the `/api/agent-runtime/*` rewrite may interfere)
- Missing or broken route in the SPA

Debug by opening the site in Chrome DevTools and checking for errors.

## Priority 3: Consumer-side Auth Integration

The WorkspaceHome purchase button currently hardcodes `userId = 'demo-consumer'` in demo mode. For real Supabase mode:
- Get `userId` from AuthContext
- Show login prompt if not authenticated
- After purchase, refresh the page to show "Joined" state

## Priority 4: i18n Completeness

Hardcoded English strings that need i18n keys:
- MembersPage: "Active Members", "Free", "Paid", "Churned", "Purchase Records", "No purchases yet"
- Onboarding presets: "Community", "Academy", "Hybrid", "Blank" and their descriptions
- WorkspaceHome: "Join Free", "Get Access", "Joined"

## Priority 5: Seed Data Consistency

Ensure `seed.sql` and `create-demo-accounts.mjs` both produce consistent data:
- Each creator workspace should have experiences, products, plans, and a home config
- The Supabase production DB already has this data (seeded via API), but `seed.sql` should match for `db reset`

## Priority 6: Tests

- Unit tests for MembersPage, WorkspaceHome purchase flow, Onboarding presets
- Update E2E Playwright screenshots for new pages

## Key Files

- `apps/web/src/domain/experience/api.ts` — Experience CRUD + forum + access control
- `apps/web/src/domain/product/api.ts` — Product/plan CRUD + purchases + home config
- `apps/web/src/apps/consumer/pages/WorkspaceHome.tsx` — Consumer workspace homepage with join buttons
- `apps/web/src/apps/business/pages/MembersPage.tsx` — Business-side purchase records
- `apps/web/src/pages/Onboarding.tsx` — Two-step onboarding with preset selection
- `apps/web/src/lib/supabase.ts` — All TypeScript types (search for `ExperienceVisibility`)
- `supabase/migrations/` — 35+ migrations, latest is `20260312000002_experience_product_rls.sql`
- `vercel.json` — Vercel deployment config with rewrites

## Supabase

- Project ref: `indiwmqxvnkzapsuvhyh`
- Service role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZGl3bXF4dm5remFwc3V2aHloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc3OTE2OCwiZXhwIjoyMDg4MzU1MTY4fQ.ukPQrpYO9sj8MBr6vGRUaDvuY_TWu1jytoex03MX5SE`
- Demo accounts: password `Demo123!`, emails like `luna.demo@olu.app`, `alex.demo@olu.app`
