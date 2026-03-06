-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_infringements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_creator_partnerships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================
-- Anyone can view public user profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================
-- Anyone can view posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Creators can insert their own posts
CREATE POLICY "Creators can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = posts.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Creators can update their own posts
CREATE POLICY "Creators can update own posts"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = posts.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Creators can delete their own posts
CREATE POLICY "Creators can delete own posts"
  ON posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = posts.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
-- Anyone can view products
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Creators can manage their own products
CREATE POLICY "Creators can manage own products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = products.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- AI AGENTS POLICIES
-- ============================================================================
-- Users can view their own agents
CREATE POLICY "Users can view own agents"
  ON ai_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = ai_agents.user_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Users can manage their own agents
CREATE POLICY "Users can manage own agents"
  ON ai_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = ai_agents.user_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- AGENT TASKS POLICIES
-- ============================================================================
-- Users can view tasks for their agents
CREATE POLICY "Users can view own agent tasks"
  ON agent_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents
      JOIN users ON users.id = ai_agents.user_id
      WHERE ai_agents.id = agent_tasks.agent_id
      AND users.auth_id = auth.uid()
    )
  );

-- Users can manage tasks for their agents
CREATE POLICY "Users can manage own agent tasks"
  ON agent_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents
      JOIN users ON users.id = ai_agents.user_id
      WHERE ai_agents.id = agent_tasks.agent_id
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================
-- Users can view conversations with their agents
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents
      JOIN users ON users.id = ai_agents.user_id
      WHERE ai_agents.id = conversations.agent_id
      AND users.auth_id = auth.uid()
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agents
      JOIN users ON users.id = ai_agents.user_id
      WHERE ai_agents.id = conversations.agent_id
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- ANALYTICS POLICIES
-- ============================================================================
-- Users can view their own analytics
CREATE POLICY "Users can view own revenue analytics"
  ON analytics_revenue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = analytics_revenue.user_id 
      AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own views analytics"
  ON analytics_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = analytics_views.user_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- CAMPAIGNS POLICIES (Advertisers)
-- ============================================================================
-- Advertisers can view their own campaigns
CREATE POLICY "Advertisers can view own campaigns"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.advertiser_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Advertisers can manage their own campaigns
CREATE POLICY "Advertisers can manage own campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = campaigns.advertiser_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- FANS POLICIES
-- ============================================================================
-- Creators can view their own fans
CREATE POLICY "Creators can view own fans"
  ON fans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = fans.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- IP LICENSES POLICIES
-- ============================================================================
-- Creators can view their own IP licenses
CREATE POLICY "Creators can view own IP licenses"
  ON ip_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = ip_licenses.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Creators can manage their own IP licenses
CREATE POLICY "Creators can manage own IP licenses"
  ON ip_licenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = ip_licenses.creator_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- SUPPLIER POLICIES
-- ============================================================================
-- Suppliers can view their own products
CREATE POLICY "Suppliers can view own products"
  ON supplier_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = supplier_products.supplier_id 
      AND users.auth_id = auth.uid()
    )
  );

-- Suppliers can manage their own products
CREATE POLICY "Suppliers can manage own products"
  ON supplier_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = supplier_products.supplier_id 
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================================
-- SOCIAL CHATS POLICIES
-- ============================================================================
-- Users can view chats they're part of
CREATE POLICY "Users can view own social chats"
  ON social_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = social_chats.user_id OR users.id = social_chats.with_user_id)
      AND users.auth_id = auth.uid()
    )
  );

-- Users can view messages in their chats
CREATE POLICY "Users can view own social chat messages"
  ON social_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_chats
      JOIN users ON (users.id = social_chats.user_id OR users.id = social_chats.with_user_id)
      WHERE social_chats.id = social_chat_messages.social_chat_id
      AND users.auth_id = auth.uid()
    )
  );
