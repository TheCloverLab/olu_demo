-- gen_random_uuid() is built-in to Postgres 13+, no extension needed

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('creator', 'fan', 'advertiser', 'supplier')),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_img TEXT,
  cover_img TEXT,
  avatar_color TEXT,
  initials TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social links as JSONB
ALTER TABLE users ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'music', 'text')),
  title TEXT NOT NULL,
  preview TEXT,
  cover_img TEXT,
  gradient_bg TEXT,
  emoji TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  tips INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT false,
  lock_price DECIMAL(10,2),
  allow_fan_creation BOOLEAN DEFAULT false,
  fan_creation_fee DECIMAL(10,2),
  sponsored BOOLEAN DEFAULT false,
  sponsored_by TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE (Shop items)
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'low_stock', 'out_of_stock')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI AGENTS TABLE
-- ============================================================================
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL, -- lisa, michael, aria, etc.
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  icon TEXT,
  avatar_img TEXT,
  color TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy')),
  description TEXT,
  last_message TEXT,
  last_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_key)
);

-- ============================================================================
-- AGENT TASKS TABLE
-- ============================================================================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATIONS TABLE (Agent chats)
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL CHECK (from_type IN ('agent', 'user')),
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GROUP CHATS TABLE
-- ============================================================================
CREATE TABLE group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_key TEXT NOT NULL,
  name TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  icons TEXT[] NOT NULL,
  last_message TEXT,
  last_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GROUP CHAT MESSAGES TABLE
-- ============================================================================
CREATE TABLE group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL CHATS TABLE (User-to-user)
-- ============================================================================
CREATE TABLE social_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_time TEXT,
  unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL CHAT MESSAGES TABLE
-- ============================================================================
CREATE TABLE social_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_chat_id UUID REFERENCES social_chats(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL CHECK (from_type IN ('user', 'other')),
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMBERSHIP TIERS TABLE
-- ============================================================================
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier_key TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, tier_key)
);

-- ============================================================================
-- FANS/CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE fans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- if they're also a platform user
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'creator_club', 'vip')),
  joined_date DATE NOT NULL,
  total_spend DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'new', 'churned')),
  color TEXT,
  initials TEXT,
  last_seen TEXT,
  avatar_img TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- IP LICENSES TABLE
-- ============================================================================
CREATE TABLE ip_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requester TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'negotiating')),
  fee_type TEXT CHECK (fee_type IN ('flat', 'royalty', 'performance', 'free')),
  amount TEXT,
  approved_by TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- IP INFRINGEMENTS TABLE
-- ============================================================================
CREATE TABLE ip_infringements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  offender TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  action TEXT,
  result TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS DATA TABLE (Revenue & Views)
-- ============================================================================
CREATE TABLE analytics_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  subscriptions DECIMAL(10,2) DEFAULT 0,
  tips DECIMAL(10,2) DEFAULT 0,
  shop DECIMAL(10,2) DEFAULT 0,
  ip DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  tiktok INTEGER DEFAULT 0,
  youtube INTEGER DEFAULT 0,
  instagram INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAMPAIGNS TABLE (Advertiser)
-- ============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  agent_key TEXT,
  reach INTEGER DEFAULT 0,
  target_reach INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAMPAIGN CREATORS TABLE (Many-to-many)
-- ============================================================================
CREATE TABLE campaign_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'outreach' CHECK (status IN ('outreach', 'negotiating', 'production', 'live', 'completed')),
  stage TEXT,
  budget DECIMAL(10,2) DEFAULT 0,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPLIER PRODUCTS TABLE
-- ============================================================================
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sold_today INTEGER DEFAULT 0,
  sold_week INTEGER DEFAULT 0,
  sold_month INTEGER DEFAULT 0,
  revenue_month DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'low_stock', 'out_of_stock')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPLIER CREATOR PARTNERSHIPS TABLE
-- ============================================================================
CREATE TABLE supplier_creator_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'outreach' CHECK (status IN ('outreach', 'negotiating', 'active', 'past')),
  products_count INTEGER DEFAULT 0,
  monthly_sales DECIMAL(10,2) DEFAULT 0,
  ip_approved BOOLEAN DEFAULT false,
  channel_manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_posts_creator ON posts(creator_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_products_creator ON products(creator_id);
CREATE INDEX idx_ai_agents_user ON ai_agents(user_id);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_group_chats_user ON group_chats(user_id);
CREATE INDEX idx_social_chats_user ON social_chats(user_id);
CREATE INDEX idx_fans_creator ON fans(creator_id);
CREATE INDEX idx_ip_licenses_creator ON ip_licenses(creator_id);
CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
