-- RLS policies for Experience & Product model tables

-- ── workspace_experiences ──────────────────────────────────────
ALTER TABLE workspace_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active experiences"
  ON workspace_experiences FOR SELECT
  USING (status = 'active');

CREATE POLICY "Workspace owners can manage experiences"
  ON workspace_experiences FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- ── workspace_products ─────────────────────────────────────────
ALTER TABLE workspace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON workspace_products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Workspace owners can manage products"
  ON workspace_products FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

-- ── workspace_product_plans ────────────────────────────────────
ALTER TABLE workspace_product_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON workspace_product_plans FOR SELECT
  USING (status = 'active');

CREATE POLICY "Product owners can manage plans"
  ON workspace_product_plans FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM workspace_products p
      JOIN workspaces w ON w.id = p.workspace_id
      WHERE w.owner_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ── workspace_product_experiences ──────────────────────────────
ALTER TABLE workspace_product_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product-experience links"
  ON workspace_product_experiences FOR SELECT
  USING (true);

CREATE POLICY "Product owners can manage links"
  ON workspace_product_experiences FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM workspace_products p
      JOIN workspaces w ON w.id = p.workspace_id
      WHERE w.owner_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ── consumer_purchases ─────────────────────────────────────────
ALTER TABLE consumer_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON consumer_purchases FOR SELECT
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can create purchases"
  ON consumer_purchases FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can cancel own purchases"
  ON consumer_purchases FOR UPDATE
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ── forum_posts ────────────────────────────────────────────────
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum posts"
  ON forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (
    author_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE
  USING (
    author_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ── forum_post_comments ────────────────────────────────────────
ALTER TABLE forum_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON forum_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON forum_post_comments FOR INSERT
  WITH CHECK (
    author_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ── forum_post_likes ───────────────────────────────────────────
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON forum_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can toggle own likes"
  ON forum_post_likes FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can remove own likes"
  ON forum_post_likes FOR DELETE
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ── workspace_home_configs ─────────────────────────────────────
ALTER TABLE workspace_home_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view home configs"
  ON workspace_home_configs FOR SELECT
  USING (true);

CREATE POLICY "Workspace owners can manage home config"
  ON workspace_home_configs FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );
