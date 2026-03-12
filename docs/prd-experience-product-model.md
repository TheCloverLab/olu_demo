# PRD: Experience & Product Model

## Overview

Restructure OLU's consumer-facing architecture to adopt a modular Experience + Product model (inspired by Whop), replacing the current hardcoded template system.

**Goal:** Each Workspace becomes a customizable app where creators can add multiple content modules (Experiences), gate them behind paid Products, and present them via a customizable homepage with tabs.

---

## Concepts

### Workspace (= Whop's "Business")

The top-level business entity. Internal name stays "workspace"; users see it as their "app."

| Field | Description |
|-------|-------------|
| id | UUID |
| owner_user_id | Creator who owns it |
| name | Display name |
| slug | URL slug |
| icon | App icon image |
| cover | Cover/banner image |
| headline | Short tagline |
| status | active / paused / archived |

**Changes from current:**
- A user can **create multiple** workspaces (currently limited to 1)
- A user can **join multiple** workspaces as staff
- Creator of workspace = admin (transferable)
- Each workspace has its own isolated messaging (DMs + groups don't cross workspace boundaries, and business/consumer messaging is also separated)

**Sidebar (Business):** Workspace switcher replaces avatar position; avatar moves to top-right corner.

---

### Experience

A content module instance within a workspace. Each Experience type can be instantiated multiple times (e.g., 3 Forums, 2 Courses).

| Field | Description |
|-------|-------------|
| id | UUID |
| workspace_id | FK → workspaces |
| type | `forum` · `course` · `group_chat` · `support_chat` |
| name | Display name (e.g., "General Discussion", "Masterclass") |
| icon | Optional custom icon |
| cover | Optional cover image |
| config_json | Type-specific configuration |
| position | Sort order |
| visibility | `public` · `members_only` · `product_gated` |
| status | `active` · `archived` |
| created_at | Timestamp |

#### Experience Types (v1)

**Forum**
- Cover image + "What's on your mind?" composer
- Posts with: author, content (rich text), images, Like count, Comment count, Share
- Inline comments on each post
- Reference: Whop Forums UI

**Course**
- Chapter → Lesson structure
- Each lesson: video embed, file attachments, drip feeding settings, text content
- Student progress tracking (per-lesson completion)
- Reference: Whop Courses UI

**Group Chat**
- Real-time group messaging room
- Users join and chat freely within the group
- Supports text, images, reactions

**Support Chat (built-in)**
- 1-on-1 chat between consumer and workspace staff
- Automatically available in every workspace (no need to add)
- One conversation per consumer

---

### Product (= Whop's "Product")

A paid or free offering that gates access to Experiences.

| Field | Description |
|-------|-------------|
| id | UUID |
| workspace_id | FK → workspaces |
| name | Display name (e.g., "Free Community", "Pro Membership") |
| description | What's included |
| access_type | `free` · `paid` |
| status | `active` · `archived` |
| position | Sort order |
| created_at | Timestamp |

### Product Plan

Pricing options within a Product. A Product can have multiple Plans (e.g., monthly + annual).

| Field | Description |
|-------|-------------|
| id | UUID |
| product_id | FK → workspace_products |
| billing_type | `one_time` · `recurring` |
| price | Decimal |
| currency | `USD` · `CNY` · etc. |
| interval | `month` · `year` · `week` · null (for one-time) |
| trial_days | Optional free trial period |
| status | `active` · `archived` |
| created_at | Timestamp |

### Product ↔ Experience (many-to-many)

| Field | Description |
|-------|-------------|
| product_id | FK → workspace_products |
| experience_id | FK → workspace_experiences |

A free Experience can be accessed by anyone. A product-gated Experience requires the user to own a purchase for a Product that includes it.

---

### Purchase

A consumer's access record.

| Field | Description |
|-------|-------------|
| id | UUID |
| user_id | FK → users |
| product_id | FK → workspace_products |
| plan_id | FK → workspace_product_plans |
| status | `active` · `cancelled` · `expired` · `refunded` |
| started_at | When access began |
| expires_at | For recurring: next billing date; for one-time: null |
| created_at | Timestamp |

---

### Home Page (Consumer)

Each workspace has a customizable consumer-facing homepage — **not** a simple list of Experiences.

#### Homepage Structure

```
┌──────────────────────────────────────┐
│  Cover Image (full width)            │
│  [Icon]  App Name                    │
│  Headline                            │
├──────────────────────────────────────┤
│  [About] [Tab 1] [Tab 2] [Tab 3]    │
├──────────────────────────────────────┤
│  Tab content area                    │
│                                      │
│  Experiences displayed per tab       │
│  (list / tile / grid / featured)     │
│                                      │
└──────────────────────────────────────┘
```

#### Home Config

| Field | Description |
|-------|-------------|
| workspace_id | FK → workspaces |
| cover | Cover image URL |
| headline | Tagline text |
| tabs | JSON array of tab definitions |

Each tab:
```json
{
  "key": "courses",
  "label": "Courses",
  "experience_ids": ["exp-1", "exp-2"],
  "display_mode": "tile",
  "position": 1
}
```

Display modes: `list`, `tile`, `grid`, `featured` (hero card + list).

**About tab** is always present (shows workspace description, staff, products).

---

## Consumer Sidebar

The consumer-side sidebar shows the **workspaces the user has joined** (not a list of experiences within a single workspace).

```
┌─────────────┐
│ [WS Icon 1] │  ← Workspace 1
│ [WS Icon 2] │  ← Workspace 2
│ [WS Icon 3] │  ← Workspace 3
│     +        │  ← Discover / Add
├─────────────┤
│ [Avatar]     │  ← User profile
└─────────────┘
```

Tapping a workspace → opens that workspace's homepage (cover, tabs, experiences).

---

## Database Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `workspace_experiences` | Experience instances (forum, course, group_chat, support_chat) |
| `workspace_products` | Products/offerings per workspace |
| `workspace_product_plans` | Pricing plans per product |
| `workspace_product_experiences` | Product ↔ Experience access mapping |
| `consumer_purchases` | User purchase records (replaces memberships + course purchases) |
| `forum_posts` | Posts within a Forum experience |
| `forum_post_comments` | Comments on forum posts |
| `forum_post_likes` | Like records (for dedup) |
| `workspace_home_configs` | Homepage customization (tabs, cover, headline) |

### Modified Tables

| Table | Change |
|-------|--------|
| `workspaces` | Add `icon`, `cover`, `headline` columns |
| `consumer_courses` | Add `experience_id` FK (link course to experience) |
| `consumer_course_sections` | No change (still linked to course) |
| `consumer_lesson_progress` | No change |
| `group_chat_messages` | Add `experience_id` FK option (for experience-scoped group chats) |

### Tables to Remove

| Table | Replacement |
|-------|-------------|
| `membership_tiers` | → `workspace_products` + `workspace_product_plans` |
| `consumer_memberships` | → `consumer_purchases` |
| `consumer_course_purchases` | → `consumer_purchases` |
| `fans` | → derived from `consumer_purchases` (active purchasers) |
| `posts` | → `forum_posts` (scoped to experience) |
| `workspace_consumer_configs` | → `workspace_home_configs` + experience config |

### Tables Unchanged

All workspace, agent, campaign, social, integration, and business tables remain as-is.

---

## Access Control Logic

```
canAccessExperience(userId, experienceId):
  1. If experience.visibility == 'public' → allow
  2. If experience.visibility == 'members_only'
     → check user has ANY active purchase in this workspace
  3. If experience.visibility == 'product_gated'
     → check user has active purchase for a product that includes this experience
     → query: consumer_purchases JOIN workspace_product_experiences
```

---

## API Changes

### New Domain: `domain/experience/`

```typescript
// CRUD
createExperience(workspaceId, type, name, config)
updateExperience(experienceId, updates)
deleteExperience(experienceId)
listExperiences(workspaceId)

// Access
getAccessibleExperiences(userId, workspaceId)
canAccessExperience(userId, experienceId)
```

### New Domain: `domain/product/`

```typescript
// CRUD
createProduct(workspaceId, name, accessType)
updateProduct(productId, updates)
createPlan(productId, billingType, price, interval)
updatePlan(planId, updates)
linkExperienceToProduct(productId, experienceId)
unlinkExperienceFromProduct(productId, experienceId)

// Purchases
purchaseProduct(userId, planId)
cancelPurchase(purchaseId)
getUserPurchases(userId, workspaceId)
```

### Modified: `domain/consumer/`

```typescript
// Replace old functions
getConsumerExperience → deprecated
getCommunityMembershipSnapshot → replaced by getProductsForWorkspace
getCourseLibrarySnapshot → replaced by listExperiences(type='course')
```

---

## UI Changes

### Business Side

1. **Workspace Switcher** — Left sidebar: switch between owned/joined workspaces
2. **Experience Manager** — Add/remove/configure experiences (like Whop's Apps tab)
3. **Product Manager** — Create products, add plans, link experiences
4. **Home Page Editor** — Customize tabs, cover, headline, experience display modes

### Consumer Side

1. **Sidebar** — Show joined workspaces (icons), tap to enter
2. **Workspace Home** — Cover + icon + name + headline + tabs
3. **Tab Content** — Experiences displayed per tab in chosen mode (list/tile/grid)
4. **Forum View** — Cover + composer + post feed + comments
5. **Course View** — Chapter sidebar + lesson content (video + files + text)
6. **Group Chat View** — Real-time messaging room
7. **Support Chat** — 1-on-1 with workspace staff
8. **Purchase Flow** — Product selection → plan choice → checkout

---

## Migration Strategy

### Phase 1: Schema + Core API
1. Create new tables (experiences, products, plans, purchases, forum_posts, etc.)
2. Add icon/cover/headline to workspaces
3. Build domain/experience and domain/product API layers
4. Migrate seed data (convert old membership_tiers → products, old courses → course experiences)

### Phase 2: Business UI
1. Experience Manager (add/remove/configure)
2. Product Manager (create products, plans, link experiences)
3. Home Page Editor (tabs, display modes)
4. Workspace switcher sidebar

### Phase 3: Consumer UI
1. Workspace sidebar (joined workspaces)
2. Workspace homepage (cover, tabs, experience display)
3. Forum experience view
4. Course experience view (update existing)
5. Group Chat experience view
6. Support Chat experience view
7. Purchase flow

### Phase 4: Cleanup
1. Remove deprecated tables (membership_tiers, consumer_memberships, etc.)
2. Remove deprecated API functions
3. Update seed.sql
4. Update AGENTS.md and ARCHITECTURE.md

---

## Workspace Presets

When creating a new workspace, the creator can choose a preset to auto-populate experiences and homepage tabs. Presets reduce onboarding friction — the creator gets a working app immediately, then customizes from there.

| Preset | Auto-created Experiences | Default Tabs |
|--------|------------------------|--------------|
| Community | Forum, Group Chat | About, Discussion, Chat |
| Academy | Course | About, Courses |
| Hybrid | Forum, Course, Group Chat | About, Community, Courses, Chat |
| Blank | (none) | About |

**Implementation notes:**
- Presets are a **UI convenience**, not a database concept — they just call `createExperience()` + `updateHomeConfig()` in sequence
- Creator can always add/remove experiences and tabs after creation
- Preset selection is optional; "Blank" starts with only the About tab
- Presets live in frontend code (no new table needed)

---

## Decisions

1. **Multiple workspaces per user** — Yes, supported from day 1.
2. **Discovery/Marketplace** — Discover page for consumers to find workspaces.
3. **Support Chat** — Multi-person: multiple staff members (or AI agents) can respond to the same user.
4. **Drip feeding** — Deferred, not in v1.
5. **Payment integration** — Stripe integration.
6. **Existing data** — Delete all, recreate seed demo data from scratch.
7. **Workspace Presets** — Yes, provide presets (Community/Academy/Hybrid/Blank) to streamline workspace creation.

## Business Dashboard Sidebar

Grouped layout:

```
── Dashboard ──
  Analytics (sub-tabs: Users, Payments/Invoices, Balances)

── Experiences ──
  Experiences (manage forum/course/chat instances + home editor)
  Products (products, plans, checkout links)
  Support chats

── Operations ──
  Team (agents + humans + AI marketplace tab)
  Tasks
  Approvals

── Modules ──
  Creator Operations
  Marketing
  Supply Chain
  Connectors
```

## Non-functional Requirements

- **Dark / Light** theme support (CSS variables `--olu-*`)
- **i18n** — All text via `useTranslation()` (EN/ZH)
- **Mobile responsive** — Consumer home page must work on mobile (tabs scrollable, single-column layout)
- **Checkout links** — Single route `/checkout/:product-slug`
