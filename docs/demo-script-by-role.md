# OLU Demo Script (By Role)

This script is designed for live demos with realistic data and minimal switching friction.

## 0) Pre-demo checklist (2 mins)

- Open app: `http://localhost:5175/`
- Confirm key pages load: Home, Chat, Team, Profile, Settings
- Keep these accounts ready:
  - Creator: `luna.demo@olu.app` / `Demo123!Creator`
  - Fan: `alex.demo@olu.app` / `Demo123!Fan`
  - Advertiser: `gameverse.demo@olu.app` / `Demo123!Ads`
  - Supplier: `artisan.demo@olu.app` / `Demo123!Supply`
  - Multi-role: `maya.demo@olu.app` / `Demo123!Hybrid`

---

## 1) Creator flow (Luna) — 3 to 4 mins

Login with:
- `luna.demo@olu.app` / `Demo123!Creator`

Show in order:
1. **Sidebar identity + role**
   - Show creator identity in sidebar.
2. **Home feed with real posts**
   - Open a Luna post, point out real engagement numbers.
3. **Creator Console**
   - Revenue, views, IP, customer sections are loaded from Supabase.
4. **Team**
   - AI agents, active tasks, and direct/group chat entries.
5. **Wallet (sidebar preview -> wallet page)**
   - Show total balance, USDC, transactions, payout section.

Talk track:
- "Creator data is no longer mocked in frontend; these are real database records with role-gated surfaces."

---

## 2) Fan flow (Alex) — 2 to 3 mins

Sign out in Settings, then login:
- `alex.demo@olu.app` / `Demo123!Fan`

Show in order:
1. **No creator-only console entries in sidebar**
   - Role-specific UI is hidden.
2. **Creator profile -> Message**
   - Open Luna profile, click `Message`.
   - Chat opens via deep link (`/chat?with=...`).
3. **Social Chat list and thread**
   - Send a message and show it appears in thread and chat list preview.

Talk track:
- "Fan experience is clean: no creator controls, but full engagement and messaging journey."

---

## 3) Advertiser flow (GameVerse) — 2 to 3 mins

Login with:
- `gameverse.demo@olu.app` / `Demo123!Ads`

Show in order:
1. **Advertiser Console**
   - Campaign list, spend vs budget, reach and conversion metrics.
2. **Role guard behavior**
   - Try visiting creator console route directly; confirm redirect/guard.

Talk track:
- "Campaign ops are role-scoped with RLS and route guards."

---

## 4) Supplier flow (ArtisanCraft) — 2 to 3 mins

Login with:
- `artisan.demo@olu.app` / `Demo123!Supply`

Show in order:
1. **Supplier Console dashboard**
   - Product rankings, creator partnerships, monthly revenue.
2. **Creator relationship records**
   - Show status tags and sales summaries.

Talk track:
- "Supplier side has distinct operational metrics and partnership workflow."

---

## 5) Multi-role flow (Maya) — 2 mins

Login with:
- `maya.demo@olu.app` / `Demo123!Hybrid`

Show in order:
1. **Switch Role visible only for multi-role users**
   - Use sidebar switch role entry.
2. **Switch Fan -> Creator -> Advertiser**
   - Show nav and consoles adapt per active role.

Talk track:
- "Single account can carry multiple role capabilities without separate logins."

---

## 6) Role application workflow (optional, 2 mins)

Use a fan-only account (or create a new one):
1. Go to **Settings -> Roles**
2. Click **Apply** for Creator/Advertiser/Supplier
3. Show `pending` state in UI
4. Mention admin approval path:
   - `npm run ops:role-apps`
   - `npm run ops:role-review -- <applicationId> approved "approved by ops"`

Talk track:
- "Role elevation is controlled, not self-serve mutation."

---

## 7) Q&A backup points

If asked "Is this real backend?"
- Supabase Auth + Postgres + Storage + Edge Functions are in use.
- RLS policies enforce per-role data access.

If asked "Why this architecture?"
- Fast iteration, low ops overhead, real data model, and production-ready auth/security primitives.

---

## 8) Fast recovery actions during demo

- Refresh page if stale session state appears.
- Re-login with the role account for deterministic screens.
- Use Home -> creator profile -> content detail as safe fallback path.

