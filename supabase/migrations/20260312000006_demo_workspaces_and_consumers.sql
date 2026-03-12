-- Add 4 new creator workspaces with full content + 10 consumer accounts
-- Each workspace uses a different homepage layout template

BEGIN;

-- ── 4 New Creator Users ──────────────────────────────────────────

INSERT INTO users (id, username, handle, email, role, name, bio, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000018', 'coachmika', '@coachmika', 'mika.demo@olu.app', 'creator', 'Coach Mika', 'Fitness coach & wellness advocate. Transform your body, transform your life.', 'from-rose-500 to-pink-600', 'CM', 185000, 420, 632, true),
  ('00000000-0000-0000-0000-000000000019', 'rentanaka', '@rentanaka', 'ren.demo@olu.app', 'creator', 'Ren Tanaka', 'Street & portrait photographer. Tokyo → NYC. Capturing moments that matter.', 'from-slate-500 to-zinc-700', 'RT', 142000, 310, 891, true),
  ('00000000-0000-0000-0000-000000000020', 'devsarah', '@devsarah', 'sarah.demo@olu.app', 'creator', 'Sarah Dev', 'Full-stack engineer & educator. Making code accessible to everyone.', 'from-violet-500 to-indigo-600', 'SD', 278000, 156, 445, true),
  ('00000000-0000-0000-0000-000000000021', 'chefmarco', '@chefmarco', 'marco.demo@olu.app', 'creator', 'Chef Marco Rossi', 'Italian chef & food storyteller. From Nonna''s kitchen to yours.', 'from-amber-500 to-orange-600', 'MR', 196000, 380, 723, true);

-- ── 4 New Workspaces ─────────────────────────────────────────────

INSERT INTO workspaces (id, owner_user_id, name, slug, icon, cover, headline, status)
VALUES
  ('05000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000018', 'FitLife Academy', 'coachmika-workspace', NULL, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80', 'Transform your body, transform your life', 'active'),
  ('05000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000019', 'Lens Studio', 'rentanaka-workspace', NULL, 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80', 'Capturing moments that matter', 'active'),
  ('05000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'CodeCraft Academy', 'devsarah-workspace', NULL, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80', 'Making code accessible to everyone', 'active'),
  ('05000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'Chef''s Table', 'chefmarco-workspace', NULL, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80', 'From Nonna''s kitchen to yours', 'active');

-- Workspace memberships
INSERT INTO workspace_memberships (id, workspace_id, user_id, membership_role, status)
VALUES
  ('05100000-0000-0000-0000-000000000008', '05000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000018', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000019', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000010', '05000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000011', '05000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'owner', 'active');

-- Workspace modules
INSERT INTO workspace_modules (id, workspace_id, module_key, enabled)
VALUES
  ('05200000-0000-0000-0000-000000000008', '05000000-0000-0000-0000-000000000008', 'creator_ops', true),
  ('05200000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000009', 'creator_ops', true),
  ('05200000-0000-0000-0000-000000000010', '05000000-0000-0000-0000-000000000010', 'creator_ops', true),
  ('05200000-0000-0000-0000-000000000011', '05000000-0000-0000-0000-000000000011', 'creator_ops', true);

-- Workspace permissions
INSERT INTO workspace_permissions (id, workspace_id, membership_role, resource, action, allowed)
VALUES
  ('05300000-0000-0000-0000-000000000015', '05000000-0000-0000-0000-000000000008', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000016', '05000000-0000-0000-0000-000000000008', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000017', '05000000-0000-0000-0000-000000000009', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000018', '05000000-0000-0000-0000-000000000009', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000019', '05000000-0000-0000-0000-000000000010', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000020', '05000000-0000-0000-0000-000000000010', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000021', '05000000-0000-0000-0000-000000000011', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000022', '05000000-0000-0000-0000-000000000011', 'owner', 'billing', 'manage', true);

-- Consumer configs (for discover page visibility)
INSERT INTO workspace_consumer_configs (workspace_id, template_key, config_json)
VALUES
  ('05000000-0000-0000-0000-000000000008', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"FitLife Academy","community_hero_description":"Transform your body with expert coaching, nutrition guides, and a supportive community.","cover_img":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"}'::jsonb),
  ('05000000-0000-0000-0000-000000000009', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Lens Studio","community_hero_description":"Master photography from street to studio. Learn composition, lighting, and editing.","cover_img":"https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80"}'::jsonb),
  ('05000000-0000-0000-0000-000000000010', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"CodeCraft Academy","community_hero_description":"Learn full-stack development from zero to deployed. Hands-on projects, real skills.","cover_img":"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"}'::jsonb),
  ('05000000-0000-0000-0000-000000000011', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Chef''s Table","community_hero_description":"Authentic Italian cooking. Recipes, techniques, and the stories behind every dish.","cover_img":"https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80"}'::jsonb);

-- ── Workspace Experiences ────────────────────────────────────────

-- Coach Mika (FitLife) — Magazine layout
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000011', '05000000-0000-0000-0000-000000000008', 'forum', 'Fitness Community', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 0, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000012', '05000000-0000-0000-0000-000000000008', 'forum', 'Nutrition Q&A', NULL, 1, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000013', '05000000-0000-0000-0000-000000000008', 'course', 'Strength Training Academy', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80', 2, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000014', '05000000-0000-0000-0000-000000000008', 'group_chat', 'Accountability Partners', NULL, 3, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000015', '05000000-0000-0000-0000-000000000008', 'support_chat', 'Support', NULL, 99, 'public', 'active');

-- Ren Tanaka (Lens Studio) — Storefront layout
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000016', '05000000-0000-0000-0000-000000000009', 'course', 'Photography Masterclass', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80', 0, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000017', '05000000-0000-0000-0000-000000000009', 'course', 'Street Photography Workshop', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80', 1, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000018', '05000000-0000-0000-0000-000000000009', 'forum', 'Photo Gallery', 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800&q=80', 2, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000019', '05000000-0000-0000-0000-000000000009', 'group_chat', 'Critique Circle', NULL, 3, 'public', 'active');

-- Sarah Dev (CodeCraft) — Minimal layout
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000020', '05000000-0000-0000-0000-000000000010', 'course', 'Full-Stack Web Dev', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', 0, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000021', '05000000-0000-0000-0000-000000000010', 'forum', 'Developer Community', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80', 1, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000022', '05000000-0000-0000-0000-000000000010', 'course', 'React & TypeScript Deep Dive', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', 2, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000023', '05000000-0000-0000-0000-000000000010', 'group_chat', 'Code Help Chat', NULL, 3, 'public', 'active');

-- Chef Marco (Chef's Table) — Community Hub layout
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000024', '05000000-0000-0000-0000-000000000011', 'forum', 'Recipe Exchange', 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80', 0, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000025', '05000000-0000-0000-0000-000000000011', 'forum', 'Kitchen Tips & Tricks', NULL, 1, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000026', '05000000-0000-0000-0000-000000000011', 'course', 'Italian Cooking Basics', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', 2, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000027', '05000000-0000-0000-0000-000000000011', 'group_chat', 'Cook Along Live', NULL, 3, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000028', '05000000-0000-0000-0000-000000000011', 'course', 'Pasta from Scratch', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80', 4, 'product_gated', 'active');

-- ── Workspace Products ───────────────────────────────────────────

-- Coach Mika products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000008', 'Free Community', 'Access fitness forums and group chat', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000008', '05000000-0000-0000-0000-000000000008', 'Pro Training Pass', 'Full access to courses, personalized plans, and accountability group', 'paid', 1, 'active');

-- Ren Tanaka products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000009', 'Gallery Access', 'Browse the photo gallery and join critique circle', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000010', '05000000-0000-0000-0000-000000000009', 'Photography Bundle', 'Both masterclass courses plus all community features', 'paid', 1, 'active');

-- Sarah Dev products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000011', '05000000-0000-0000-0000-000000000010', 'Community Access', 'Developer forum and code help chat', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000012', '05000000-0000-0000-0000-000000000010', 'Full Course Bundle', 'All courses plus community features', 'paid', 1, 'active');

-- Chef Marco products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000013', '05000000-0000-0000-0000-000000000011', 'Free Recipe Access', 'Recipe exchange, kitchen tips, and cook along chat', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000014', '05000000-0000-0000-0000-000000000011', 'Chef''s Pass', 'All cooking courses plus exclusive recipes', 'paid', 1, 'active');

-- ── Product Plans ────────────────────────────────────────────────

INSERT INTO workspace_product_plans (id, product_id, billing_type, price, currency, interval, status)
VALUES
  -- Coach Mika Pro Training
  ('08000000-0000-0000-0000-000000000006', '07000000-0000-0000-0000-000000000008', 'recurring', 14.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000007', '07000000-0000-0000-0000-000000000008', 'recurring', 129.99, 'USD', 'year', 'active'),
  -- Ren Photography Bundle
  ('08000000-0000-0000-0000-000000000008', '07000000-0000-0000-0000-000000000010', 'recurring', 19.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000009', '07000000-0000-0000-0000-000000000010', 'one_time', 199.00, 'USD', NULL, 'active'),
  -- Sarah Dev Full Course Bundle
  ('08000000-0000-0000-0000-000000000010', '07000000-0000-0000-0000-000000000012', 'recurring', 24.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000011', '07000000-0000-0000-0000-000000000012', 'one_time', 249.00, 'USD', NULL, 'active'),
  -- Chef Marco Chef's Pass
  ('08000000-0000-0000-0000-000000000012', '07000000-0000-0000-0000-000000000014', 'recurring', 12.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000013', '07000000-0000-0000-0000-000000000014', 'recurring', 99.99, 'USD', 'year', 'active');

-- ── Product ↔ Experience Linking ─────────────────────────────────

-- Coach Mika: Free → forums + group chat
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000007', '06000000-0000-0000-0000-000000000011'),
  ('07000000-0000-0000-0000-000000000007', '06000000-0000-0000-0000-000000000012'),
  ('07000000-0000-0000-0000-000000000007', '06000000-0000-0000-0000-000000000014');

-- Coach Mika: Pro → everything
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000011'),
  ('07000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000012'),
  ('07000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000013'),
  ('07000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000014');

-- Ren: Free → gallery + critique
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000009', '06000000-0000-0000-0000-000000000018'),
  ('07000000-0000-0000-0000-000000000009', '06000000-0000-0000-0000-000000000019');

-- Ren: Bundle → everything
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000010', '06000000-0000-0000-0000-000000000016'),
  ('07000000-0000-0000-0000-000000000010', '06000000-0000-0000-0000-000000000017'),
  ('07000000-0000-0000-0000-000000000010', '06000000-0000-0000-0000-000000000018'),
  ('07000000-0000-0000-0000-000000000010', '06000000-0000-0000-0000-000000000019');

-- Sarah: Free → forum + chat
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000011', '06000000-0000-0000-0000-000000000021'),
  ('07000000-0000-0000-0000-000000000011', '06000000-0000-0000-0000-000000000023');

-- Sarah: Bundle → everything
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000012', '06000000-0000-0000-0000-000000000020'),
  ('07000000-0000-0000-0000-000000000012', '06000000-0000-0000-0000-000000000021'),
  ('07000000-0000-0000-0000-000000000012', '06000000-0000-0000-0000-000000000022'),
  ('07000000-0000-0000-0000-000000000012', '06000000-0000-0000-0000-000000000023');

-- Chef Marco: Free → forums + chat
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000013', '06000000-0000-0000-0000-000000000024'),
  ('07000000-0000-0000-0000-000000000013', '06000000-0000-0000-0000-000000000025'),
  ('07000000-0000-0000-0000-000000000013', '06000000-0000-0000-0000-000000000027');

-- Chef Marco: Chef's Pass → everything
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000014', '06000000-0000-0000-0000-000000000024'),
  ('07000000-0000-0000-0000-000000000014', '06000000-0000-0000-0000-000000000025'),
  ('07000000-0000-0000-0000-000000000014', '06000000-0000-0000-0000-000000000026'),
  ('07000000-0000-0000-0000-000000000014', '06000000-0000-0000-0000-000000000027'),
  ('07000000-0000-0000-0000-000000000014', '06000000-0000-0000-0000-000000000028');

-- ── Workspace Home Configs (4 different layouts) ─────────────────

-- Coach Mika — Magazine template (featured hero + content grid)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80', 'Transform your body, transform your life. Expert coaching & community.', '[
    {"key": "training", "label": "Training", "experience_ids": ["06000000-0000-0000-0000-000000000013"], "display_mode": "featured", "position": 1},
    {"key": "community", "label": "Community", "experience_ids": ["06000000-0000-0000-0000-000000000011", "06000000-0000-0000-0000-000000000012"], "display_mode": "grid", "position": 2},
    {"key": "chat", "label": "Chat", "experience_ids": ["06000000-0000-0000-0000-000000000014"], "display_mode": "list", "position": 3}
  ]'::jsonb);

-- Ren Tanaka — Storefront template (product tiles front)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80', 'Master photography from street to studio.', '[
    {"key": "courses", "label": "Courses", "experience_ids": ["06000000-0000-0000-0000-000000000016", "06000000-0000-0000-0000-000000000017"], "display_mode": "tile", "position": 1},
    {"key": "gallery", "label": "Gallery", "experience_ids": ["06000000-0000-0000-0000-000000000018"], "display_mode": "featured", "position": 2},
    {"key": "critique", "label": "Critique", "experience_ids": ["06000000-0000-0000-0000-000000000019"], "display_mode": "list", "position": 3}
  ]'::jsonb);

-- Sarah Dev — Minimal template (clean single-column list)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80', 'Learn full-stack development. Build real projects.', '[
    {"key": "all", "label": "All Content", "experience_ids": ["06000000-0000-0000-0000-000000000020", "06000000-0000-0000-0000-000000000021", "06000000-0000-0000-0000-000000000022", "06000000-0000-0000-0000-000000000023"], "display_mode": "list", "position": 1}
  ]'::jsonb);

-- Chef Marco — Community Hub template (forums + chat + learn)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80', 'Authentic Italian cooking. Recipes, techniques, and stories.', '[
    {"key": "recipes", "label": "Recipes", "experience_ids": ["06000000-0000-0000-0000-000000000024", "06000000-0000-0000-0000-000000000025"], "display_mode": "list", "position": 1},
    {"key": "chat", "label": "Cook Along", "experience_ids": ["06000000-0000-0000-0000-000000000027"], "display_mode": "tile", "position": 2},
    {"key": "learn", "label": "Learn", "experience_ids": ["06000000-0000-0000-0000-000000000026", "06000000-0000-0000-0000-000000000028"], "display_mode": "grid", "position": 3}
  ]'::jsonb);

-- ── Forum Posts (sample content) ─────────────────────────────────

-- Coach Mika's forum
INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000004', '06000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000018', 'Welcome to FitLife! Share your fitness journey and let''s grow together 💪', 56, 4),
  ('0a000000-0000-0000-0000-000000000005', '06000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000018', 'Monday Meal Prep — what''s on your plate this week?', 34, 2);

-- Ren's gallery forum
INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000006', '06000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000019', 'Tokyo street series — shot on Fuji X-T5. Golden hour magic ✨', 89, 6);

-- Sarah's dev community
INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000007', '06000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000020', 'Welcome devs! Introduce yourself and tell us what you''re building 🚀', 72, 8);

-- Chef Marco's recipe exchange
INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000021', 'My nonna''s carbonara recipe — the real deal, no cream! 🍝', 124, 12),
  ('0a000000-0000-0000-0000-000000000009', '06000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000021', 'Pro tip: salt your pasta water like the sea. Trust me on this.', 67, 5);

-- ── 10 New Consumer Users ────────────────────────────────────────

INSERT INTO users (id, username, handle, email, role, name, bio, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000022', 'oliviakim', '@oliviakim', 'olivia.demo@olu.app', 'fan', 'Olivia Kim', 'Fitness enthusiast & foodie', 'from-pink-400 to-rose-500', 'OK', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000023', 'jameswu', '@jameswu', 'james.demo@olu.app', 'fan', 'James Wu', 'Amateur photographer', 'from-blue-400 to-indigo-500', 'JW', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000024', 'aishaali', '@aishaali', 'aisha.demo@olu.app', 'fan', 'Aisha Ali', 'Learning to code', 'from-emerald-400 to-teal-500', 'AA', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000025', 'carlosg', '@carlosg', 'carlos.demo@olu.app', 'fan', 'Carlos Garcia', 'Home cook & recipe collector', 'from-amber-400 to-orange-500', 'CG', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000026', 'hannahlee', '@hannahlee', 'hannah.demo@olu.app', 'fan', 'Hannah Lee', 'Yoga & wellness', 'from-violet-400 to-purple-500', 'HL', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000027', 'michaelb', '@michaelb', 'michael.demo@olu.app', 'fan', 'Michael Brown', 'Full-stack dev student', 'from-sky-400 to-blue-500', 'MB', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000028', 'priyasharma', '@priyasharma', 'priya.demo@olu.app', 'fan', 'Priya Sharma', 'Creative & photographer', 'from-rose-400 to-pink-500', 'PS', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000029', 'tomh', '@tomh', 'tom.demo@olu.app', 'fan', 'Tom Hernandez', 'Sports & nutrition', 'from-orange-400 to-red-500', 'TH', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000030', 'yukis', '@yukis', 'yukis.demo@olu.app', 'fan', 'Yuki Sato', 'Aspiring chef', 'from-cyan-400 to-blue-500', 'YS', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000031', 'emilyr', '@emilyr', 'emily.demo@olu.app', 'fan', 'Emily Roberts', 'Digital art & coding', 'from-fuchsia-400 to-pink-500', 'ER', 0, 0, 0, false);

-- ── Workspace Joins (consumers joined to workspaces) ─────────────

INSERT INTO workspace_joins (user_id, workspace_id) VALUES
  -- Olivia joins FitLife + Chef's Table
  ('00000000-0000-0000-0000-000000000022', '05000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000022', '05000000-0000-0000-0000-000000000011'),
  -- James joins Lens Studio + CodeCraft
  ('00000000-0000-0000-0000-000000000023', '05000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000023', '05000000-0000-0000-0000-000000000010'),
  -- Aisha joins CodeCraft + FitLife
  ('00000000-0000-0000-0000-000000000024', '05000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000024', '05000000-0000-0000-0000-000000000008'),
  -- Carlos joins Chef's Table + Lens Studio
  ('00000000-0000-0000-0000-000000000025', '05000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000025', '05000000-0000-0000-0000-000000000009'),
  -- Hannah joins FitLife + Chef's Table
  ('00000000-0000-0000-0000-000000000026', '05000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000026', '05000000-0000-0000-0000-000000000011'),
  -- Michael joins CodeCraft + Lens Studio
  ('00000000-0000-0000-0000-000000000027', '05000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000027', '05000000-0000-0000-0000-000000000009'),
  -- Priya joins Lens Studio + FitLife
  ('00000000-0000-0000-0000-000000000028', '05000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000028', '05000000-0000-0000-0000-000000000008'),
  -- Tom joins FitLife + Chef's Table
  ('00000000-0000-0000-0000-000000000029', '05000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000029', '05000000-0000-0000-0000-000000000011'),
  -- Yuki joins Chef's Table + CodeCraft
  ('00000000-0000-0000-0000-000000000030', '05000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000030', '05000000-0000-0000-0000-000000000010'),
  -- Emily joins CodeCraft + FitLife + Lens Studio (power user)
  ('00000000-0000-0000-0000-000000000031', '05000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000031', '05000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000031', '05000000-0000-0000-0000-000000000009');

-- Also join some existing consumers to the new workspaces
INSERT INTO workspace_joins (user_id, workspace_id) VALUES
  -- Alex joins FitLife + CodeCraft
  ('00000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000010'),
  -- Mia joins Chef's Table
  ('00000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000011'),
  -- Ryan joins Lens Studio
  ('00000000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000009');

-- Also join existing consumers to existing workspaces (Luna, Kai, Zara)
INSERT INTO workspace_joins (user_id, workspace_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000003');

-- ── Consumer Purchases ───────────────────────────────────────────

INSERT INTO consumer_purchases (id, user_id, product_id, plan_id, status, started_at)
VALUES
  -- Olivia bought Coach Mika Pro (monthly)
  ('09000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000022', '07000000-0000-0000-0000-000000000008', '08000000-0000-0000-0000-000000000006', 'active', NOW() - INTERVAL '30 days'),
  -- James bought Ren Photography Bundle (one-time)
  ('09000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000023', '07000000-0000-0000-0000-000000000010', '08000000-0000-0000-0000-000000000009', 'active', NOW() - INTERVAL '14 days'),
  -- Aisha bought Sarah Dev Course Bundle (monthly)
  ('09000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000024', '07000000-0000-0000-0000-000000000012', '08000000-0000-0000-0000-000000000010', 'active', NOW() - INTERVAL '60 days'),
  -- Carlos bought Chef Marco Chef's Pass (monthly)
  ('09000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000025', '07000000-0000-0000-0000-000000000014', '08000000-0000-0000-0000-000000000012', 'active', NOW() - INTERVAL '21 days'),
  -- Hannah bought Coach Mika Pro (yearly)
  ('09000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000026', '07000000-0000-0000-0000-000000000008', '08000000-0000-0000-0000-000000000007', 'active', NOW() - INTERVAL '90 days'),
  -- Michael bought Sarah Dev Course Bundle (one-time)
  ('09000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000027', '07000000-0000-0000-0000-000000000012', '08000000-0000-0000-0000-000000000011', 'active', NOW() - INTERVAL '7 days'),
  -- Priya bought Ren Photography Bundle (monthly)
  ('09000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000028', '07000000-0000-0000-0000-000000000010', '08000000-0000-0000-0000-000000000008', 'active', NOW() - INTERVAL '45 days'),
  -- Tom bought free community access (FitLife)
  ('09000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000029', '07000000-0000-0000-0000-000000000007', NULL, 'active', NOW() - INTERVAL '10 days'),
  -- Yuki bought Chef Marco Chef's Pass (yearly)
  ('09000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', '07000000-0000-0000-0000-000000000014', '08000000-0000-0000-0000-000000000013', 'active', NOW() - INTERVAL '35 days'),
  -- Emily bought CodeCraft Bundle (monthly) + FitLife Free
  ('09000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000031', '07000000-0000-0000-0000-000000000012', '08000000-0000-0000-0000-000000000010', 'active', NOW() - INTERVAL '55 days'),
  ('09000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000031', '07000000-0000-0000-0000-000000000007', NULL, 'active', NOW() - INTERVAL '40 days');

-- ── Forum Comments from consumers ────────────────────────────────

INSERT INTO forum_post_comments (id, post_id, author_id, content)
VALUES
  ('0a100000-0000-0000-0000-000000000004', '0a000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000022', 'So excited to join! Just did my first workout today.'),
  ('0a100000-0000-0000-0000-000000000005', '0a000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000026', 'Best fitness community ever! The accountability group is amazing.'),
  ('0a100000-0000-0000-0000-000000000006', '0a000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000023', 'Incredible shots Ren! What settings did you use?'),
  ('0a100000-0000-0000-0000-000000000007', '0a000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000024', 'Hi everyone! I am building a todo app as my first React project.'),
  ('0a100000-0000-0000-0000-000000000008', '0a000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000025', 'Tried this recipe last night — absolutely incredible! Grazie Marco!'),
  ('0a100000-0000-0000-0000-000000000009', '0a000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000030', 'The key really is quality guanciale. Chef Marco, where do you source yours?');

COMMIT;
