-- Experience & Product Model
-- Adds workspace experiences, products, plans, purchases, forum, and home config tables.

-- ── Workspace columns ────────────────────────────────────────────
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS cover TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT;

-- ── Workspace Experiences ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('forum', 'course', 'group_chat', 'support_chat')),
  name TEXT NOT NULL,
  icon TEXT,
  cover TEXT,
  config_json JSONB DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'product_gated')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_experiences_workspace ON workspace_experiences(workspace_id);

-- ── Workspace Products ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'paid')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_products_workspace ON workspace_products(workspace_id);

-- ── Product Plans ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES workspace_products(id) ON DELETE CASCADE,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('one_time', 'recurring')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT CHECK (interval IN ('week', 'month', 'year')),
  trial_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_plans_product ON workspace_product_plans(product_id);

-- ── Product ↔ Experience (many-to-many) ──────────────────────────
CREATE TABLE IF NOT EXISTS workspace_product_experiences (
  product_id UUID NOT NULL REFERENCES workspace_products(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, experience_id)
);

-- ── Consumer Purchases ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumer_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES workspace_products(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES workspace_product_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'refunded')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumer_purchases_user ON consumer_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_consumer_purchases_product ON consumer_purchases(product_id);

-- ── Forum Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_experience ON forum_posts(experience_id);

-- ── Forum Post Comments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_post_comments_post ON forum_post_comments(post_id);

-- ── Forum Post Likes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_post_likes (
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- ── Workspace Home Configs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_home_configs (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  cover TEXT,
  headline TEXT,
  tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Link courses to experiences ──────────────────────────────────
ALTER TABLE consumer_courses
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES workspace_experiences(id);

-- ── Link group chats to experiences ──────────────────────────────
ALTER TABLE group_chats
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES workspace_experiences(id);
