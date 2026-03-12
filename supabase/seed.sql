-- Seed data for OLU Demo
-- 10 consumers, 3 creator_ops, 2 marketing, 2 supply_chain
-- All demo accounts use password: Demo123!

BEGIN;

-- Clean existing seed rows (safe ordering for FK constraints)
TRUNCATE TABLE
  workspace_agent_tasks,
  workspace_agents,
  agent_templates,
  consumer_lesson_progress,
  consumer_course_purchases,
  consumer_memberships,
  consumer_purchases,
  workspace_product_experiences,
  workspace_product_plans,
  workspace_products,
  forum_post_likes,
  forum_post_comments,
  forum_posts,
  workspace_home_configs,
  workspace_experiences,
  workspace_billing,
  workspace_consumer_configs,
  workspace_policies,
  workspace_integrations,
  workspace_permissions,
  workspace_modules,
  workspace_memberships,
  workspaces,
  business_campaign_events,
  business_campaign_targets,
  business_campaigns,
  campaign_creators,
  campaigns,
  supplier_creator_partnerships,
  supplier_products,
  consumer_course_sections,
  consumer_courses,
  analytics_views,
  analytics_revenue,
  ip_infringements,
  ip_licenses,
  fans,
  membership_tiers,
  social_chat_messages,
  social_chats,
  group_chat_messages,
  group_chats,
  conversations,
  agent_tasks,
  ai_agents,
  products,
  posts,
  users
RESTART IDENTITY CASCADE;

-- ── Users ──────────────────────────────────────────────────────────

-- Consumers (10)
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alexpark', '@alexpark', 'alex.demo@olu.app', 'fan', 'Alex Park', '', 'from-pink-500 to-rose-600', 'AP', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000002', 'jordanlee', '@jordanlee', 'jordan.demo@olu.app', 'fan', 'Jordan Lee', '', 'from-blue-500 to-blue-700', 'JL', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000003', 'miazhang', '@miazhang', 'mia.demo@olu.app', 'fan', 'Mia Zhang', '', 'from-violet-500 to-purple-600', 'MZ', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000004', 'ryankim', '@ryankim', 'ryan.demo@olu.app', 'fan', 'Ryan Kim', '', 'from-amber-500 to-orange-600', 'RK', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000005', 'sofiamartinez', '@sofiamartinez', 'sofia.demo@olu.app', 'fan', 'Sofia Martinez', '', 'from-rose-500 to-pink-600', 'SM', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000006', 'davidchen', '@davidchen', 'david.demo@olu.app', 'fan', 'David Chen', '', 'from-emerald-500 to-green-600', 'DC', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000007', 'emmawilson', '@emmawilson', 'emma.demo@olu.app', 'fan', 'Emma Wilson', '', 'from-sky-500 to-blue-600', 'EW', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000008', 'lucasbrown', '@lucasbrown', 'lucas.demo@olu.app', 'fan', 'Lucas Brown', '', 'from-orange-500 to-red-600', 'LB', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000009', 'ninapatel', '@ninapatel', 'nina.demo@olu.app', 'fan', 'Nina Patel', '', 'from-yellow-500 to-amber-600', 'NP', 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000010', 'tylerwang', '@tylerwang', 'tyler.demo@olu.app', 'fan', 'Tyler Wang', '', 'from-teal-500 to-cyan-600', 'TW', 0, 0, 0, false);

-- Creator Ops (3)
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_img, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'lunachen', '@lunachen', 'luna.demo@olu.app', 'creator', 'Luna Chen', 'Digital artist & gamer | Creating worlds one pixel at a time', '/images/avatars/luna.jpg', 'from-zinc-600 to-zinc-500', 'LC', 234000, 312, 847, true),
  ('00000000-0000-0000-0000-000000000012', 'kaivibe', '@kaivibe', 'kai.demo@olu.app', 'creator', 'Kai Vibe', 'Lo-fi producer and creator', '/images/avatars/kai.jpg', 'from-amber-500 to-orange-600', 'KV', 167000, 201, 512, true),
  ('00000000-0000-0000-0000-000000000013', 'zaranova', '@zaranova', 'zara.demo@olu.app', 'creator', 'Zara Nova', 'Fashion and lifestyle creator', '/images/avatars/zara.jpg', 'from-purple-400 to-pink-600', 'ZN', 201000, 411, 601, true);

-- Marketing (2)
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_img, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000014', 'gameverse', '@gameverse', 'gameverse.demo@olu.app', 'advertiser', 'GameVerse Studios', 'Leading indie game studio', '/images/avatars/gameverse.jpg', 'from-blue-500 to-cyan-600', 'GV', 89000, 234, 156, true),
  ('00000000-0000-0000-0000-000000000015', 'techmarkus', '@techmarkus', 'marcus.demo@olu.app', 'advertiser', 'Marcus Chen', 'Tech and gaming reviews', '/images/avatars/marcus.jpg', 'from-blue-400 to-blue-600', 'MC', 412000, 290, 903, true);

-- Supply Chain (2)
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_img, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000016', 'artisancraft', '@artisancraft', 'artisan.demo@olu.app', 'supplier', 'ArtisanCraft Co.', 'Premium creator merch manufacturing', '/images/avatars/artisancraft.jpg', 'from-emerald-500 to-teal-600', 'AC', 12000, 567, 89, true),
  ('00000000-0000-0000-0000-000000000017', 'yukidraws', '@yukidraws', 'yuki.demo@olu.app', 'supplier', 'Yuki Draws', 'Character illustrator', '/images/avatars/yuki.jpg', 'from-pink-400 to-rose-600', 'YD', 89000, 140, 377, false);

-- ── Workspaces (only for business users) ──────────────────────────

-- Creator Ops workspaces
INSERT INTO workspaces (id, owner_user_id, name, slug, status)
VALUES
  ('05000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Luna Chen Workspace', 'lunachen-workspace', 'active'),
  ('05000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'Kai Vibe Workspace', 'kaivibe-workspace', 'active'),
  ('05000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013', 'Zara Nova Workspace', 'zaranova-workspace', 'active');

-- Marketing workspaces
INSERT INTO workspaces (id, owner_user_id, name, slug, status)
VALUES
  ('05000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000014', 'GameVerse Studios Workspace', 'gameverse-workspace', 'active'),
  ('05000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000015', 'Marcus Chen Workspace', 'techmarkus-workspace', 'active');

-- Supply Chain workspaces
INSERT INTO workspaces (id, owner_user_id, name, slug, status)
VALUES
  ('05000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000016', 'ArtisanCraft Co. Workspace', 'artisancraft-workspace', 'active'),
  ('05000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000017', 'Yuki Draws Workspace', 'yukidraws-workspace', 'active');

-- Workspace memberships
INSERT INTO workspace_memberships (id, workspace_id, user_id, membership_role, status)
VALUES
  ('05100000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000014', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000015', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000016', 'owner', 'active'),
  ('05100000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000017', 'owner', 'active');

-- Workspace modules (only the specific module each user needs)
INSERT INTO workspace_modules (id, workspace_id, module_key, enabled)
VALUES
  -- Creator Ops users get creator_ops
  ('05200000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'creator_ops', true),
  ('05200000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000002', 'creator_ops', true),
  ('05200000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000003', 'creator_ops', true),
  -- Marketing users get marketing
  ('05200000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000004', 'marketing', true),
  ('05200000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000005', 'marketing', true),
  -- Supply Chain users get supply_chain
  ('05200000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000006', 'supply_chain', true),
  ('05200000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000007', 'supply_chain', true);

-- Workspace permissions
INSERT INTO workspace_permissions (id, workspace_id, membership_role, resource, action, allowed)
VALUES
  ('05300000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000002', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000002', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000003', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000003', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000004', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000008', '05000000-0000-0000-0000-000000000004', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000005', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000010', '05000000-0000-0000-0000-000000000005', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000011', '05000000-0000-0000-0000-000000000006', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000012', '05000000-0000-0000-0000-000000000006', 'owner', 'billing', 'manage', true),
  ('05300000-0000-0000-0000-000000000013', '05000000-0000-0000-0000-000000000007', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000014', '05000000-0000-0000-0000-000000000007', 'owner', 'billing', 'manage', true);

-- Workspace integrations (for business users)
INSERT INTO workspace_integrations (id, workspace_id, provider, status, config_json, last_sync_at)
VALUES
  ('05400000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'Shopify', 'connected', '{"shop":"luna-merch"}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('05400000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001', 'Mixpanel', 'planned', '{}'::jsonb, NULL),
  ('05400000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000001', 'Zendesk', 'planned', '{}'::jsonb, NULL),
  ('05400000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000004', 'Shopify', 'connected', '{"shop":"gameverse-store"}'::jsonb, NOW() - INTERVAL '30 minutes'),
  ('05400000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000004', 'Mixpanel', 'connected', '{"project":"gameverse-growth"}'::jsonb, NOW() - INTERVAL '1 day');

-- Workspace policies
INSERT INTO workspace_policies (id, workspace_id, approval_policy, sandbox_policy, notification_policy)
VALUES
  ('05500000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', '{"publish_requires_marketer_approval":true,"budget_change_review_threshold":500}'::jsonb, '{"takeover_mode":"manual","high_risk_actions_require_review":true}'::jsonb, '{"route_creator_approvals_to_workspace":true,"route_publish_events_to_workspace":true}'::jsonb),
  ('05500000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000004', '{"publish_requires_marketer_approval":true,"budget_change_review_threshold":750}'::jsonb, '{"takeover_mode":"manual","high_risk_actions_require_review":true}'::jsonb, '{"route_creator_approvals_to_workspace":true,"route_publish_events_to_workspace":true}'::jsonb);

-- Workspace billing
INSERT INTO workspace_billing (id, workspace_id, plan, status, billing_email)
VALUES
  ('05600000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'starter', 'trial', 'luna.demo@olu.app'),
  ('05600000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000004', 'growth', 'active', 'gameverse.demo@olu.app'),
  ('05600000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000006', 'starter', 'active', 'artisan.demo@olu.app');

-- Consumer configs (community discovery)
INSERT INTO workspace_consumer_configs (workspace_id, template_key, config_json)
VALUES
  ('05000000-0000-0000-0000-000000000001', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Pixel Realm","cover_img":"/images/covers/dragonart.jpg"}'::jsonb),
  ('05000000-0000-0000-0000-000000000002', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"The Listening Room","cover_img":"/images/covers/midnightdrift.jpg"}'::jsonb),
  ('05000000-0000-0000-0000-000000000003', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Nova Style Lab","cover_img":"/images/covers/neoncity.jpg"}'::jsonb),
  ('05000000-0000-0000-0000-000000000004', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"GameVerse Arena","cover_img":"/images/covers/gameverse.jpg"}'::jsonb),
  ('05000000-0000-0000-0000-000000000005', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Tech & Gaming Hub","cover_img":"/images/covers/marcuschen.jpg"}'::jsonb),
  ('05000000-0000-0000-0000-000000000006', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Artisan Workshop","cover_img":"/images/covers/artisancraft.jpg"}'::jsonb);

-- ── Workspace Experiences (Luna = Community preset, Kai = Academy preset) ──

-- Luna's experiences (Community + Course)
INSERT INTO workspace_experiences (id, workspace_id, type, name, icon, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'forum', 'General Discussion', NULL, '/images/covers/dragonart.jpg', 0, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001', 'forum', 'Art Critique Room', NULL, NULL, 1, 'members_only', 'active'),
  ('06000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000001', 'course', 'Digital Art Academy', NULL, '/images/covers/gamingsetup.jpg', 2, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000001', 'group_chat', 'Pixel Realm Lounge', NULL, NULL, 3, 'members_only', 'active'),
  ('06000000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000001', 'support_chat', 'Support', NULL, NULL, 99, 'public', 'active');

-- Kai's experiences (Academy preset)
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000002', 'course', 'Lo-fi Production Academy', '/images/covers/galaxyquest.jpg', 0, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000002', 'forum', 'Producer Talk', NULL, 1, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000008', '05000000-0000-0000-0000-000000000002', 'group_chat', 'The Listening Room', NULL, 2, 'members_only', 'active');

-- Zara's experiences
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000003', 'course', 'Sustainable Fashion Lab', '/images/covers/alexpark.jpg', 0, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000010', '05000000-0000-0000-0000-000000000003', 'forum', 'Style Community', NULL, 1, 'public', 'active');

-- Link existing courses to experiences
UPDATE consumer_courses SET experience_id = '06000000-0000-0000-0000-000000000003' WHERE id = '20500000-0000-0000-0000-000000000001';
UPDATE consumer_courses SET experience_id = '06000000-0000-0000-0000-000000000006' WHERE id = '20500000-0000-0000-0000-000000000002';
UPDATE consumer_courses SET experience_id = '06000000-0000-0000-0000-000000000009' WHERE id = '20500000-0000-0000-0000-000000000003';

-- ── Workspace Products ──────────────────────────────────────────

-- Luna's products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', 'Free Community', 'Access public forums and community features', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001', 'Pro Membership', 'Full access to all forums, courses, and group chat', 'paid', 1, 'active');

-- Kai's products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000002', 'Free Access', 'Access the community forum', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000002', 'Producer Pass', 'Full access to courses and listening room', 'paid', 1, 'active');

-- Zara's products
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000003', 'Fashion Starter', 'Community access', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000003', 'Design Lab Access', 'Full access to courses and community', 'paid', 1, 'active');

-- ── Product Plans ───────────────────────────────────────────────

-- Luna Pro Membership plans
INSERT INTO workspace_product_plans (id, product_id, billing_type, price, currency, interval, status)
VALUES
  ('08000000-0000-0000-0000-000000000001', '07000000-0000-0000-0000-000000000002', 'recurring', 9.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000002', '07000000-0000-0000-0000-000000000002', 'recurring', 89.99, 'USD', 'year', 'active');

-- Kai Producer Pass plans
INSERT INTO workspace_product_plans (id, product_id, billing_type, price, currency, interval, status)
VALUES
  ('08000000-0000-0000-0000-000000000003', '07000000-0000-0000-0000-000000000004', 'recurring', 14.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000004', '07000000-0000-0000-0000-000000000004', 'one_time', 149.00, 'USD', NULL, 'active');

-- Zara Design Lab plans
INSERT INTO workspace_product_plans (id, product_id, billing_type, price, currency, interval, status)
VALUES
  ('08000000-0000-0000-0000-000000000005', '07000000-0000-0000-0000-000000000006', 'recurring', 19.99, 'USD', 'month', 'active');

-- ── Product ↔ Experience Linking ────────────────────────────────

-- Luna: Free Community → public forum only
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000001', '06000000-0000-0000-0000-000000000001');

-- Luna: Pro Membership → all experiences
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000001'),
  ('07000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000002'),
  ('07000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000003'),
  ('07000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000004');

-- Kai: Free → forum only
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000003', '06000000-0000-0000-0000-000000000007');

-- Kai: Producer Pass → courses + listening room + forum
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000004', '06000000-0000-0000-0000-000000000006'),
  ('07000000-0000-0000-0000-000000000004', '06000000-0000-0000-0000-000000000007'),
  ('07000000-0000-0000-0000-000000000004', '06000000-0000-0000-0000-000000000008');

-- Zara: Free → community forum
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000005', '06000000-0000-0000-0000-000000000010');

-- Zara: Design Lab → course + community
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000006', '06000000-0000-0000-0000-000000000009'),
  ('07000000-0000-0000-0000-000000000006', '06000000-0000-0000-0000-000000000010');

-- ── Consumer Purchases (Alex has Luna Pro) ──────────────────────

INSERT INTO consumer_purchases (id, user_id, product_id, plan_id, status, started_at)
VALUES
  ('09000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '07000000-0000-0000-0000-000000000002', '08000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '45 days');

-- ── Forum Posts (Luna's General Discussion) ─────────────────────

INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000001', '06000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Welcome to Pixel Realm! Share your latest pixel art here. 🎨', 42, 3),
  ('0a000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Just finished my first pixel portrait! What do you all think?', 18, 2),
  ('0a000000-0000-0000-0000-000000000003', '06000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Anyone doing the weekly challenge? I am in for this week!', 8, 1);

INSERT INTO forum_post_comments (id, post_id, author_id, content)
VALUES
  ('0a100000-0000-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'So excited to be here! Love the community vibes.'),
  ('0a100000-0000-0000-0000-000000000002', '0a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'This is amazing, Luna! Can not wait for the next drop.'),
  ('0a100000-0000-0000-0000-000000000003', '0a000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Looks great Alex! Love the color palette.');

-- ── Workspace Home Configs ──────────────────────────────────────

-- Luna's home page (Community preset: About + Discussion + Courses + Chat)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000001', '/images/covers/dragonart.jpg', 'Digital artist & gamer. Creating worlds one pixel at a time.', '[
    {"key": "discussion", "label": "Discussion", "experience_ids": ["06000000-0000-0000-0000-000000000001", "06000000-0000-0000-0000-000000000002"], "display_mode": "list", "position": 1},
    {"key": "courses", "label": "Courses", "experience_ids": ["06000000-0000-0000-0000-000000000003"], "display_mode": "featured", "position": 2},
    {"key": "chat", "label": "Chat", "experience_ids": ["06000000-0000-0000-0000-000000000004"], "display_mode": "list", "position": 3}
  ]'::jsonb);

-- Kai's home page (Academy preset: About + Courses + Community)
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000002', '/images/covers/midnightdrift.jpg', 'Lo-fi producer and creator. Craft chill beats with me.', '[
    {"key": "courses", "label": "Courses", "experience_ids": ["06000000-0000-0000-0000-000000000006"], "display_mode": "featured", "position": 1},
    {"key": "community", "label": "Community", "experience_ids": ["06000000-0000-0000-0000-000000000007"], "display_mode": "list", "position": 2},
    {"key": "chat", "label": "Chat", "experience_ids": ["06000000-0000-0000-0000-000000000008"], "display_mode": "list", "position": 3}
  ]'::jsonb);

-- Zara's home page
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000003', '/images/covers/neoncity.jpg', 'Fashion and lifestyle creator. Sustainability meets style.', '[
    {"key": "courses", "label": "Courses", "experience_ids": ["06000000-0000-0000-0000-000000000009"], "display_mode": "featured", "position": 1},
    {"key": "community", "label": "Community", "experience_ids": ["06000000-0000-0000-0000-000000000010"], "display_mode": "list", "position": 2}
  ]'::jsonb);

-- Add icon/cover/headline to workspaces
UPDATE workspaces SET icon = '/images/avatars/luna.jpg', cover = '/images/covers/dragonart.jpg', headline = 'Digital artist & gamer' WHERE id = '05000000-0000-0000-0000-000000000001';
UPDATE workspaces SET icon = '/images/avatars/kai.jpg', cover = '/images/covers/midnightdrift.jpg', headline = 'Lo-fi producer' WHERE id = '05000000-0000-0000-0000-000000000002';
UPDATE workspaces SET icon = '/images/avatars/zara.jpg', cover = '/images/covers/neoncity.jpg', headline = 'Sustainable fashion' WHERE id = '05000000-0000-0000-0000-000000000003';

-- ── Agent Templates ───────────────────────────────────────────────

INSERT INTO agent_templates (id, template_key, name, role, avatar_img, color, category, pricing_model, price_label, model, cost_per_1k, rating, reviews, description, status)
VALUES
  ('05700000-0000-0000-0000-000000000001', 'ip_manager', 'IP Manager', 'IP Manager', '/images/agents/lisa.jpg', 'from-zinc-600 to-zinc-500', 'Creator', 'free', 'Free', 'GPT-5.2', 0.0050, 4.9, 1240, 'Manages IP licensing, authorizations, and royalty collection.', 'active'),
  ('05700000-0000-0000-0000-000000000002', 'legal_officer', 'Legal Officer', 'Legal Officer', '/images/agents/debian.jpg', 'from-red-500 to-rose-600', 'Creator', 'free', 'Free', 'Claude Opus 4.6', 0.0030, 4.8, 890, 'Monitors unauthorized use and sends DMCA takedowns.', 'active'),
  ('05700000-0000-0000-0000-000000000003', 'community_manager', 'Community Manager', 'Community Manager', '/images/agents/aria.jpg', 'from-pink-500 to-rose-500', 'Creator', 'free', 'Free', 'Gemini 3 Flash', 0.0001, 4.7, 2100, 'Runs community events and rewards top customers.', 'active'),
  ('05700000-0000-0000-0000-000000000004', 'growth_officer', 'Growth Officer', 'Growth Officer', '/images/agents/zephyr.jpg', 'from-emerald-500 to-teal-600', 'Creator', 'free', 'Free', 'Claude Sonnet 4.5', 0.0030, 4.6, 1560, 'Drives follower and subscriber growth across platforms.', 'active'),
  ('05700000-0000-0000-0000-000000000005', 'data_analyst', 'Data Analyst', 'Data Analyst', '/images/agents/eric.jpg', 'from-blue-500 to-indigo-600', 'Creator', 'free', 'Free', 'GPT-5.2', 0.0050, 4.9, 3200, 'Deep analytics across all platforms with actionable insights.', 'active'),
  ('05700000-0000-0000-0000-000000000006', 'creativity_officer', 'Creativity Officer', 'Creativity Officer', '/images/agents/nova.jpg', 'from-orange-400 to-amber-500', 'Creator', 'free', 'Free', 'Gemini 3.1 Pro', 0.0002, 4.8, 2800, 'Content ideation based on trends and audience behavior.', 'active'),
  ('05700000-0000-0000-0000-000000000007', 'marketing_manager', 'Marketing Manager', 'Marketing Manager', '/images/agents/max.jpg', 'from-blue-500 to-cyan-500', 'Advertiser', 'free', 'Free', 'GPT-5.1', 0.0040, 4.7, 980, 'End-to-end influencer campaign planning and execution.', 'active'),
  ('05700000-0000-0000-0000-000000000008', 'channel_manager', 'Channel Manager', 'Channel Manager', '/images/agents/chan.jpg', 'from-emerald-500 to-green-600', 'Supplier', 'free', 'Free', 'Claude Haiku 4.x', 0.0001, 4.5, 560, 'Connects creators and suppliers for merch partnerships.', 'active'),
  ('05700000-0000-0000-0000-000000000009', 'finance_officer', 'Finance Officer', 'Finance Officer', '/images/agents/finance.jpg', 'from-yellow-500 to-amber-600', 'Pro', 'subscription', '$9.99/mo', 'GPT-5.2-Codex', 0.0060, 4.9, 1100, 'Cross-border payments, invoicing, and financial reporting.', 'active'),
  ('05700000-0000-0000-0000-000000000010', 'localization_agent', 'Localization Agent', 'Localization Agent', '/images/agents/localization.jpg', 'from-cyan-500 to-blue-600', 'Pro', 'subscription', '$4.99/mo', 'Gemini 3 Pro', 0.0003, 4.6, 430, 'Translates and localizes content for global audiences.', 'active');

-- ── Workspace Agents (Luna's workspace) ───────────────────────────

INSERT INTO workspace_agents (id, workspace_id, template_id, hired_by_user_id, agent_key, name, role, avatar_img, color, status, description, last_message, last_time, lark_app_id, lark_app_secret)
VALUES
  ('05800000-0000-0000-0000-000000000001', '05000000-0000-0000-0000-000000000001', '05700000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'lisa', 'Lisa', 'IP Manager', '/images/agents/lisa.jpg', 'from-zinc-600 to-zinc-500', 'online', 'Manages and licenses creator IP.', 'Received 3 new IP licensing requests.', '12m ago', 'cli_a93a6cd212b89ed4', 'Xabt1Z2xWK7KP1vqZ9kJzbD5Z2vpUVXO'),
  ('05800000-0000-0000-0000-000000000002', '05000000-0000-0000-0000-000000000001', '05700000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000011', 'eric', 'Eric', 'Data Analyst', '/images/agents/eric.jpg', 'from-blue-500 to-blue-700', 'online', 'Analyzes performance and growth metrics.', 'Weekly report ready.', '2h ago', 'cli_a93a74d7aab99ed1', 'J9fS4RqN0Ts6lEaYTNKMFbDHAmOTcroX'),
  ('05800000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000004', '05700000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000014', 'max', 'Max', 'Marketing Manager', '/images/agents/max.jpg', 'from-blue-500 to-cyan-500', 'online', 'Plans influencer campaigns end-to-end.', 'Luna team responded positively.', '15m ago', 'cli_a93a70897d789ed0', 'XnZiZ5VltpRk7EvGXGxgmcxT4M5mGSgX'),
  ('05800000-0000-0000-0000-000000000004', '05000000-0000-0000-0000-000000000006', '05700000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000016', 'chan', 'Chan', 'Channel Manager', '/images/agents/chan.jpg', 'from-emerald-500 to-green-600', 'online', 'Manages supplier and creator partnerships.', 'Hoodie design approved.', '20m ago', 'cli_a93a71cc64789ed3', 'tEmmHMpP01fG3xmhg0FSrbTzzVgsUS6A');

INSERT INTO workspace_agent_tasks (id, workspace_agent_id, task_key, title, status, priority, due, progress)
VALUES
  ('05900000-0000-0000-0000-000000000001', '05800000-0000-0000-0000-000000000001', 't1', 'Review GameVerse IP proposal', 'pending', 'high', 'Today', 0),
  ('05900000-0000-0000-0000-000000000002', '05800000-0000-0000-0000-000000000001', 't2', 'Renew voice licensing terms', 'in_progress', 'medium', 'This week', 45),
  ('05900000-0000-0000-0000-000000000003', '05800000-0000-0000-0000-000000000002', 't3', 'Weekly performance report', 'done', 'high', 'Done', 100),
  ('05900000-0000-0000-0000-000000000004', '05800000-0000-0000-0000-000000000003', 't4', 'Negotiate with Luna IP Manager', 'in_progress', 'high', 'Today', 60),
  ('05900000-0000-0000-0000-000000000005', '05800000-0000-0000-0000-000000000004', 't5', 'List Luna hoodie in creator shop', 'in_progress', 'high', 'Today', 70);

-- ── Posts (Luna's content) ────────────────────────────────────────

INSERT INTO posts (id, creator_id, type, title, preview, gradient_bg, emoji, likes, comments, tips, locked, allow_fan_creation, fan_creation_fee, sponsored, tags)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'image', 'Neon City fan art drop', 'New pixel series is live.', 'from-zinc-800 to-zinc-900', '🎨', 8920, 345, 234, false, true, 0.30, false, ARRAY['Art','Pixel','Cyberpunk']),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'music', 'Midnight Drift — Unreleased Track Preview', '30 second preview for subscribers.', 'from-amber-800 via-orange-700 to-red-800', '🎵', 5670, 189, 412, true, false, NULL, false, ARRAY['Music','Lo-fi','Original']),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'video', 'My gaming setup tour 2025', 'Full setup tour including studio corner.', 'from-zinc-800 to-zinc-900', '🎮', 12300, 567, 89, false, true, 0.30, false, ARRAY['Gaming','Setup','Tour']),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000015', 'video', 'Galaxy Quest Review — Honest Take', 'Unfiltered review after 20 hours of gameplay.', 'from-blue-900 to-slate-800', '🚀', 23400, 1240, 156, false, false, NULL, true, ARRAY['Gaming','Review','Sponsored']);

-- ── Membership tiers (Luna) ───────────────────────────────────────

INSERT INTO membership_tiers (id, creator_id, tier_key, name, price, description, perks, subscriber_count)
VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'free', 'Free', 0.00, 'Basic free tier', ARRAY['Access to public posts','Comment on posts','Join community Discord'], 180000),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'creator_club', 'Creator Club', 9.99, 'Popular monthly membership', ARRAY['Early access','Exclusive art pack','Members-only channels','10 percent shop discount'], 42000),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'vip', 'VIP Collective', 29.99, 'High-touch premium membership', ARRAY['Everything in Creator Club','1-on-1 feedback','Early merch access','25 percent shop discount'], 12000);

-- Products (Luna's merch)
INSERT INTO products (id, creator_id, name, description, price, image, category, stock, sold_count, status)
VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Neon City Hoodie', 'Premium streetwear hoodie with Luna''s Neon City artwork.', 59.99, '/images/products/hoodie.jpg', 'apparel', 45, 234, 'active'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Pixel Pin Set', 'Collectible enamel pin set featuring pixel art characters.', 24.99, '/images/products/pins.jpg', 'accessories', 120, 189, 'active'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'Luna Acrylic Stand', 'High-quality acrylic standee of Luna''s signature character.', 34.99, '/images/products/stand.jpg', 'collectibles', 67, 156, 'active'),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011', 'Chibi Luna Plushie', 'Soft plushie of chibi Luna, limited edition.', 44.99, '/images/products/plushie.jpg', 'collectibles', 12, 78, 'low_stock');

-- Consumer memberships (Alex is VIP of Luna)
INSERT INTO consumer_memberships (id, user_id, creator_id, tier_key, tier_name, status, joined_at)
VALUES
  ('20650000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'vip', 'VIP Collective', 'active', NOW() - INTERVAL '45 days');

-- ── Courses (Luna + Kai) ──────────────────────────────────────────

INSERT INTO consumer_courses (id, creator_id, slug, title, subtitle, instructor, price, level, hero, headline, description, outcomes, lessons_count, students_count, completion_rate, status)
VALUES
  ('20500000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'digital-art-masterclass', 'Digital Art Masterclass', 'From sketch to stunning — learn digital painting from zero to portfolio-ready.', 'Luna Chen', 49.00, 'Beginner', '/images/covers/gamingsetup.jpg', 'The complete guide to digital illustration', 'Learn professional digital painting techniques, color theory, and composition.', ARRAY['Master digital brushwork and layering','Build a polished art portfolio','Sell prints and commissions'], 24, 3400, '78%', 'published'),
  ('20500000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'lofi-production-101', 'Lo-fi Production 101', 'Craft chill beats from scratch using free tools and analog textures.', 'Kai Vibe', 39.00, 'Beginner', '/images/covers/galaxyquest.jpg', 'Make your first lo-fi track in a weekend', 'Step-by-step music production for lo-fi, chillhop, and ambient beats.', ARRAY['Set up a free production environment','Layer samples and synths','Publish on streaming platforms'], 18, 5100, '82%', 'published'),
  ('20500000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013', 'sustainable-fashion-design', 'Sustainable Fashion Design', 'Design, source, and launch an eco-conscious clothing line.', 'Zara Nova', 59.00, 'Intermediate', '/images/covers/alexpark.jpg', 'Build a fashion brand that respects the planet', 'From fabric sourcing to brand identity — launch sustainable fashion.', ARRAY['Source ethical materials','Create a capsule collection','Build a brand story that sells'], 20, 1800, '71%', 'published');

INSERT INTO consumer_course_sections (id, course_id, section_key, title, duration, summary, preview, position)
VALUES
  ('20600000-0000-0000-0000-000000000001', '20500000-0000-0000-0000-000000000001', 'dam-1', 'Getting Started with Digital Tools', '15 min', 'Set up your workspace and pick the right brushes.', true, 1),
  ('20600000-0000-0000-0000-000000000002', '20500000-0000-0000-0000-000000000001', 'dam-2', 'Color Theory & Palettes', '20 min', 'Understand hue, saturation, and value for digital painting.', false, 2),
  ('20600000-0000-0000-0000-000000000003', '20500000-0000-0000-0000-000000000001', 'dam-3', 'Layering & Composition', '22 min', 'Build depth with layers and frame your subject.', false, 3),
  ('20600000-0000-0000-0000-000000000004', '20500000-0000-0000-0000-000000000001', 'dam-4', 'Building Your Portfolio', '18 min', 'Curate and present your work for clients and prints.', false, 4),
  ('20600000-0000-0000-0000-000000000005', '20500000-0000-0000-0000-000000000002', 'lf-1', 'Your First Beat', '12 min', 'Build a simple lo-fi loop from scratch.', true, 1),
  ('20600000-0000-0000-0000-000000000006', '20500000-0000-0000-0000-000000000002', 'lf-2', 'Sampling & Textures', '18 min', 'Layer vinyl crackle, tape hiss, and ambient pads.', false, 2),
  ('20600000-0000-0000-0000-000000000007', '20500000-0000-0000-0000-000000000002', 'lf-3', 'Mixing & Mastering', '16 min', 'Balance your track for streaming platforms.', false, 3),
  ('20600000-0000-0000-0000-000000000008', '20500000-0000-0000-0000-000000000002', 'lf-4', 'Publishing Your Music', '14 min', 'Distribute to Spotify, Apple Music, and Bandcamp.', false, 4),
  ('20600000-0000-0000-0000-000000000009', '20500000-0000-0000-0000-000000000003', 'sfd-1', 'Ethical Sourcing', '16 min', 'Find sustainable fabric suppliers and verify certifications.', true, 1),
  ('20600000-0000-0000-0000-000000000010', '20500000-0000-0000-0000-000000000003', 'sfd-2', 'Capsule Collection Design', '22 min', 'Design a cohesive 5-piece collection from concept to tech pack.', false, 2),
  ('20600000-0000-0000-0000-000000000011', '20500000-0000-0000-0000-000000000003', 'sfd-3', 'Brand Story & Identity', '18 min', 'Build a brand narrative that resonates with conscious consumers.', false, 3),
  ('20600000-0000-0000-0000-000000000012', '20500000-0000-0000-0000-000000000003', 'sfd-4', 'Launch & Marketing', '20 min', 'Pre-launch strategy, pricing, and first drop execution.', false, 4);

-- ── Campaigns (GameVerse) ─────────────────────────────────────────

INSERT INTO campaigns (id, advertiser_id, name, status, budget, spent, start_date, end_date, agent_key, reach, target_reach, conversions, target_conversions)
VALUES
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'Galaxy Quest Launch', 'active', 50000, 31500, '2025-06-10', '2025-07-10', 'max', 2100000, 3200000, 8400, 15000),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000014', 'Summer Sale Blast', 'completed', 20000, 19800, '2025-05-01', '2025-05-31', 'max', 4500000, 3000000, 22000, 15000);

INSERT INTO campaign_creators (id, campaign_id, creator_id, status, stage, budget, views, conversions)
VALUES
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000015', 'live', 'Content Live', 8500, 890000, 4200),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'production', 'Content in Production', 12000, 0, 0),
  ('91000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000015', 'completed', 'Completed', 8000, 2100000, 12000);

-- ── Supplier data (ArtisanCraft) ──────────────────────────────────

INSERT INTO supplier_creator_partnerships (id, supplier_id, creator_id, status, products_count, monthly_sales, ip_approved, channel_manager)
VALUES
  ('92000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000011', 'active', 4, 45600, true, 'Chan'),
  ('92000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000012', 'negotiating', 0, 0, false, 'Chan');

INSERT INTO supplier_products (id, supplier_id, creator_id, name, sku, price, sold_today, sold_week, sold_month, revenue_month, status)
VALUES
  ('93000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000011', 'Neon City Hoodie (Luna Chen)', 'NC-HOOD-001', 59.99, 12, 78, 234, 14036, 'active'),
  ('93000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000011', 'Pixel Pin Set (Luna Chen)', 'PP-PIN-001', 24.99, 8, 45, 189, 4723, 'active'),
  ('93000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000011', 'Chibi Luna Plushie', 'CL-PLU-001', 44.99, 5, 31, 78, 3509, 'low_stock');

-- ── Analytics (Luna) ──────────────────────────────────────────────

INSERT INTO analytics_revenue (id, user_id, month, subscriptions, tips, shop, ip)
VALUES
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Jan', 6200, 1200, 980, 400),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Feb', 7100, 1450, 1200, 600),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'Mar', 7800, 1800, 1450, 800),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011', 'Apr', 8200, 1600, 1800, 1200),
  ('80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000011', 'May', 9100, 2100, 2100, 900),
  ('80000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011', 'Jun', 8200, 2100, 1400, 700);

INSERT INTO analytics_views (id, user_id, month, tiktok, youtube, instagram)
VALUES
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Jan', 520000, 280000, 120000),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Feb', 680000, 310000, 140000),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'Mar', 890000, 340000, 160000),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011', 'Apr', 1100000, 290000, 180000),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000011', 'May', 950000, 360000, 210000),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011', 'Jun', 1200000, 340000, 230000);

COMMIT;
