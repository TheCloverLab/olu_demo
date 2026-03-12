-- Sora Kim (@sorakim) — K-beauty & Skincare Creator
-- Run against production Supabase

-- User
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_color, initials, followers, following, posts, verified)
VALUES
  ('00000000-0000-0000-0000-000000000032', 'sorakim', '@sorakim', 'sora.demo@olu.app', 'creator', 'Sora Kim', 'Skincare scientist & K-beauty educator. Your skin journey starts here.', 'from-rose-400 to-pink-500', 'SK', 289000, 245, 534, true)
ON CONFLICT (id) DO NOTHING;

-- Workspace
INSERT INTO workspaces (id, owner_user_id, name, slug, icon, cover, headline, status)
VALUES
  ('05000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000032', 'Glow Lab', 'sorakim-workspace', NULL, 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=80', 'Skincare scientist & K-beauty educator', 'active')
ON CONFLICT (id) DO NOTHING;

-- Workspace membership (owner)
INSERT INTO workspace_memberships (id, workspace_id, user_id, membership_role, status)
VALUES
  ('05100000-0000-0000-0000-000000000012', '05000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000032', 'owner', 'active')
ON CONFLICT (id) DO NOTHING;

-- Workspace module
INSERT INTO workspace_modules (id, workspace_id, module_key, enabled)
VALUES
  ('05200000-0000-0000-0000-000000000012', '05000000-0000-0000-0000-000000000012', 'creator_ops', true)
ON CONFLICT (id) DO NOTHING;

-- Workspace permissions
INSERT INTO workspace_permissions (id, workspace_id, membership_role, resource, action, allowed)
VALUES
  ('05300000-0000-0000-0000-000000000023', '05000000-0000-0000-0000-000000000012', 'owner', 'campaign', 'publish', true),
  ('05300000-0000-0000-0000-000000000024', '05000000-0000-0000-0000-000000000012', 'owner', 'billing', 'manage', true)
ON CONFLICT (id) DO NOTHING;

-- Consumer config
INSERT INTO workspace_consumer_configs (workspace_id, template_key, config_json)
VALUES
  ('05000000-0000-0000-0000-000000000012', 'fan_community', '{"featured_template":"fan_community","community_hero_title":"Glow Lab","community_hero_description":"Master the art of K-beauty. Science-backed skincare routines, product deep-dives, and a community that glows together.","cover_img":"https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=80"}'::jsonb)
ON CONFLICT (workspace_id) DO NOTHING;

-- Experiences (5)
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES
  ('06000000-0000-0000-0000-000000000029', '05000000-0000-0000-0000-000000000012', 'forum', 'Skin Diaries', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80', 0, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000030', '05000000-0000-0000-0000-000000000012', 'forum', 'Product Reviews', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80', 1, 'public', 'active'),
  ('06000000-0000-0000-0000-000000000031', '05000000-0000-0000-0000-000000000012', 'course', 'K-Beauty Essentials', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80', 2, 'product_gated', 'active'),
  ('06000000-0000-0000-0000-000000000032', '05000000-0000-0000-0000-000000000012', 'group_chat', 'Morning Routine Club', NULL, 3, 'public', 'active')
ON CONFLICT (id) DO NOTHING;

-- Products (2)
INSERT INTO workspace_products (id, workspace_id, name, description, access_type, position, status)
VALUES
  ('07000000-0000-0000-0000-000000000015', '05000000-0000-0000-0000-000000000012', 'Free Community', 'Access Skin Diaries, Product Reviews, and Morning Routine Club', 'free', 0, 'active'),
  ('07000000-0000-0000-0000-000000000016', '05000000-0000-0000-0000-000000000012', 'Glow Pass', 'Full access to all content including K-Beauty Essentials course', 'paid', 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Product plans (Glow Pass: monthly + yearly)
INSERT INTO workspace_product_plans (id, product_id, billing_type, price, currency, interval, status)
VALUES
  ('08000000-0000-0000-0000-000000000014', '07000000-0000-0000-0000-000000000016', 'recurring', 11.99, 'USD', 'month', 'active'),
  ('08000000-0000-0000-0000-000000000015', '07000000-0000-0000-0000-000000000016', 'recurring', 99.99, 'USD', 'year', 'active')
ON CONFLICT (id) DO NOTHING;

-- Product ↔ Experience linking
INSERT INTO workspace_product_experiences (product_id, experience_id) VALUES
  ('07000000-0000-0000-0000-000000000015', '06000000-0000-0000-0000-000000000029'),
  ('07000000-0000-0000-0000-000000000015', '06000000-0000-0000-0000-000000000030'),
  ('07000000-0000-0000-0000-000000000015', '06000000-0000-0000-0000-000000000032'),
  ('07000000-0000-0000-0000-000000000016', '06000000-0000-0000-0000-000000000029'),
  ('07000000-0000-0000-0000-000000000016', '06000000-0000-0000-0000-000000000030'),
  ('07000000-0000-0000-0000-000000000016', '06000000-0000-0000-0000-000000000031'),
  ('07000000-0000-0000-0000-000000000016', '06000000-0000-0000-0000-000000000032')
ON CONFLICT DO NOTHING;

-- Course: K-Beauty Essentials
INSERT INTO consumer_courses (id, creator_id, slug, title, subtitle, instructor, price, level, hero, headline, description, outcomes, lessons_count, students_count, completion_rate, status)
VALUES
  ('20500000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000032', 'k-beauty-essentials', 'K-Beauty Essentials', 'The complete guide to Korean skincare — from double cleanse to glass skin.', 'Sora Kim', 39.00, 'Beginner', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80', 'Your complete K-beauty starter guide', 'Learn the science behind Korean skincare routines, ingredient selection, and building a personalized regimen.', ARRAY['Master the double cleanse method','Understand layering for maximum absorption','Choose actives based on your skin type','Build a sustainable daily routine'], 16, 2200, '85%', 'published')
ON CONFLICT (id) DO NOTHING;

-- Link course to experience
UPDATE consumer_courses SET experience_id = '06000000-0000-0000-0000-000000000031' WHERE id = '20500000-0000-0000-0000-000000000004';

-- Course sections (4)
INSERT INTO consumer_course_sections (id, course_id, section_key, title, duration, summary, preview, position)
VALUES
  ('20600000-0000-0000-0000-000000000013', '20500000-0000-0000-0000-000000000004', 'kbe-1', 'The Double Cleanse', '18 min', 'Oil cleanse + water cleanse — why two steps change everything.', true, 1),
  ('20600000-0000-0000-0000-000000000014', '20500000-0000-0000-0000-000000000004', 'kbe-2', 'Layering Like a Pro', '22 min', 'Toner, essence, serum, moisturizer — the correct order and why it matters.', false, 2),
  ('20600000-0000-0000-0000-000000000015', '20500000-0000-0000-0000-000000000004', 'kbe-3', 'Actives & Ingredients', '20 min', 'Niacinamide, retinol, AHA/BHA — what works and how to combine them safely.', false, 3),
  ('20600000-0000-0000-0000-000000000016', '20500000-0000-0000-0000-000000000004', 'kbe-4', 'Building Your Routine', '15 min', 'Create a morning and evening routine tailored to your skin type and goals.', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Home config
INSERT INTO workspace_home_configs (workspace_id, cover, headline, tabs)
VALUES
  ('05000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=80', 'Skincare scientist & K-beauty educator. Your skin journey starts here.', '[
    {"key": "community", "label": "Community", "experience_ids": ["06000000-0000-0000-0000-000000000029", "06000000-0000-0000-0000-000000000030"], "display_mode": "grid", "position": 1},
    {"key": "courses", "label": "Courses", "experience_ids": ["06000000-0000-0000-0000-000000000031"], "display_mode": "featured", "position": 2},
    {"key": "chat", "label": "Chat", "experience_ids": ["06000000-0000-0000-0000-000000000032"], "display_mode": "list", "position": 3}
  ]'::jsonb)
ON CONFLICT (workspace_id) DO NOTHING;

-- Workspace agents
INSERT INTO workspace_agents (id, workspace_id, template_id, hired_by_user_id, agent_key, name, role, avatar_img, color, status, description, last_message, last_time)
VALUES
  ('05800000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000012', '05700000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000032', 'aria', 'Aria', 'Community Manager', '/images/agents/aria.jpg', 'from-pink-500 to-rose-500', 'online', 'Runs community events and rewards top members.', 'Skincare Sunday event scheduled for this weekend.', '30m ago'),
  ('05800000-0000-0000-0000-000000000006', '05000000-0000-0000-0000-000000000012', '05700000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000032', 'zephyr', 'Zephyr', 'Growth Officer', '/images/agents/zephyr.jpg', 'from-emerald-500 to-teal-600', 'online', 'Drives follower and subscriber growth.', 'Instagram Reels driving +18% new followers this week.', '1h ago')
ON CONFLICT (id) DO NOTHING;

-- Forum posts
INSERT INTO forum_posts (id, experience_id, author_id, content, like_count, comment_count)
VALUES
  ('0a000000-0000-0000-0000-000000000010', '06000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000032', 'Welcome to Skin Diaries! Share your skincare journey, ask questions, and let''s glow together. Drop your current routine below!', 67, 2),
  ('0a000000-0000-0000-0000-000000000011', '06000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000005', 'Just started the double cleanse method after watching Sora''s course preview — my skin has never felt this clean! Any oil cleanser recs for oily skin?', 23, 1),
  ('0a000000-0000-0000-0000-000000000012', '06000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000003', 'Has anyone tried the new COSRX Snail Mucin 97? I''ve been using it for 2 weeks and the hydration is incredible.', 31, 1)
ON CONFLICT (id) DO NOTHING;

-- Forum comments
INSERT INTO forum_post_comments (id, post_id, author_id, content)
VALUES
  ('0a100000-0000-0000-0000-000000000010', '0a000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000007', 'So glad I found this community! Currently doing a 7-step routine and loving it.'),
  ('0a100000-0000-0000-0000-000000000011', '0a000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Sora your ingredient breakdown videos are the best — finally understand what niacinamide actually does!'),
  ('0a100000-0000-0000-0000-000000000012', '0a000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000032', 'For oily skin, try a lightweight oil like grape seed or jojoba — they won''t clog pores. Avoid coconut oil!'),
  ('0a100000-0000-0000-0000-000000000013', '0a000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000032', 'The new COSRX 97 is amazing! Great for layering under heavier creams. Snail mucin is an absolute staple.')
ON CONFLICT (id) DO NOTHING;

-- Workspace joins
INSERT INTO workspace_joins (user_id, workspace_id) VALUES
  ('00000000-0000-0000-0000-000000000003', '05000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000005', '05000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000007', '05000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000009', '05000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000022', '05000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000026', '05000000-0000-0000-0000-000000000012')
ON CONFLICT DO NOTHING;

-- Consumer purchases
INSERT INTO consumer_purchases (id, user_id, product_id, plan_id, status, started_at)
VALUES
  ('09000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005', '07000000-0000-0000-0000-000000000016', '08000000-0000-0000-0000-000000000014', 'active', NOW() - INTERVAL '20 days'),
  ('09000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000022', '07000000-0000-0000-0000-000000000016', '08000000-0000-0000-0000-000000000015', 'active', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;
