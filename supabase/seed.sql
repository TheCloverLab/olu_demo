-- Seed data derived from src/data/mock.ts

BEGIN;

-- Clean existing seed rows (safe ordering for FK constraints)
TRUNCATE TABLE
  campaign_creators,
  campaigns,
  supplier_creator_partnerships,
  supplier_products,
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

-- Users
INSERT INTO users (id, username, handle, email, role, name, bio, avatar_img, cover_img, avatar_color, initials, followers, following, posts, verified, social_links)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'luna', '@lunachen', 'luna@example.com', 'creator', 'Luna Chen', 'Digital artist & gamer | Creating worlds one pixel at a time', '/images/avatars/luna.jpg', '/images/covers/lunachen.jpg', 'from-zinc-600 to-zinc-500', 'LC', 234000, 312, 847, true, '{"youtube":"youtube.com/@lunachen","tiktok":"@lunachen","instagram":"@luna.creates","twitch":"lunachen"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'alex', '@alexpark', 'alex@example.com', 'fan', 'Alex Park', 'Superfan of Luna Chen', '/images/avatars/alex.jpg', '/images/covers/alexpark.jpg', 'from-pink-500 to-rose-600', 'AP', 1240, 89, 43, false, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'gameverse', '@gameverse', 'gameverse@example.com', 'advertiser', 'GameVerse Studios', 'Leading indie game studio', '/images/avatars/gameverse.jpg', '/images/covers/gameverse.jpg', 'from-blue-500 to-cyan-600', 'GV', 89000, 234, 156, true, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000004', 'artisan', '@artisancraft', 'artisan@example.com', 'supplier', 'ArtisanCraft Co.', 'Premium creator merch manufacturing', '/images/avatars/artisancraft.jpg', '/images/covers/artisancraft.jpg', 'from-emerald-500 to-teal-600', 'AC', 12000, 567, 89, true, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000005', 'kai', '@kaivibe', 'kai@example.com', 'creator', 'Kai Vibe', 'Lo-fi producer and creator', '/images/avatars/kai.jpg', '/images/covers/kaivibe.jpg', 'from-amber-500 to-orange-600', 'KV', 167000, 201, 512, true, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000006', 'yuki', '@yukidraws', 'yuki@example.com', 'creator', 'Yuki Draws', 'Character illustrator', '/images/avatars/yuki.jpg', '/images/covers/yukidraws.jpg', 'from-pink-400 to-rose-600', 'YD', 89000, 140, 377, false, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000007', 'marcus', '@techmarkus', 'marcus@example.com', 'creator', 'Marcus Chen', 'Tech and gaming reviews', '/images/avatars/marcus.jpg', '/images/covers/marcus.jpg', 'from-blue-400 to-blue-600', 'MC', 412000, 290, 903, true, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000008', 'zara', '@zaranova', 'zara@example.com', 'creator', 'Zara Nova', 'Fashion and lifestyle creator', '/images/avatars/zara.jpg', '/images/covers/zara.jpg', 'from-purple-400 to-pink-600', 'ZN', 201000, 411, 601, true, '{}'::jsonb);

-- Posts
INSERT INTO posts (id, creator_id, type, title, preview, cover_img, gradient_bg, emoji, likes, comments, tips, locked, lock_price, allow_fan_creation, fan_creation_fee, sponsored, sponsored_by, tags)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'image', 'Neon City fan art drop', 'New pixel series is live.', '/images/covers/neoncity.jpg', 'from-zinc-800 to-zinc-900', '🎨', 8920, 345, 234, false, NULL, true, 0.30, false, NULL, ARRAY['Art','Pixel','Cyberpunk']),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'music', 'Midnight Drift — Unreleased Track Preview', '30 second preview for subscribers.', '/images/covers/midnightdrift.jpg', 'from-amber-800 via-orange-700 to-red-800', '🎵', 5670, 189, 412, true, 2.99, false, NULL, false, NULL, ARRAY['Music','Lo-fi','Original']),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'video', 'My gaming setup tour 2025', 'Full setup tour including studio corner.', '/images/covers/gamingsetup.jpg', 'from-zinc-800 to-zinc-900', '🎮', 12300, 567, 89, false, NULL, true, 0.30, false, NULL, ARRAY['Gaming','Setup','Tour']),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'video', 'Galaxy Quest Review — Honest Take', 'Unfiltered review after 20 hours of gameplay.', '/images/covers/galaxyquest.jpg', 'from-blue-900 to-slate-800', '🚀', 23400, 1240, 156, false, NULL, false, NULL, true, 'GameVerse Studios', ARRAY['Gaming','Review','Sponsored']);

-- Creator shop products
INSERT INTO products (id, creator_id, name, description, price, image, category, stock, sold_count, status)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Neon City Hoodie', 'Premium hoodie with Neon City artwork.', 59.99, '/images/products/neon-city-hoodie.jpg', 'physical', 45, 234, 'active'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Luna Chan Digital Art Pack', 'Monthly digital art bundle.', 14.99, '/images/products/luna-art-pack.jpg', 'digital', 0, 1240, 'active'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Pixel World Enamel Pin Set', 'Collector enamel pin set.', 24.99, '/images/products/pixel-pin-set.jpg', 'physical', 12, 567, 'active');

-- AI agents
INSERT INTO ai_agents (id, user_id, agent_key, name, role, icon, avatar_img, color, status, description, last_message, last_time)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'lisa', 'Lisa', 'IP Manager', '⚖️', '/images/agents/lisa.jpg', 'from-zinc-600 to-zinc-500', 'online', 'Manages and licenses creator IP.', 'Received 3 new IP licensing requests.', '12m ago'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'eric', 'Eric', 'Data Analyst', '📊', '/images/agents/eric.jpg', 'from-blue-500 to-blue-700', 'online', 'Analyzes performance and growth metrics.', 'Weekly report ready.', '2h ago'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'max', 'Max', 'Marketing Manager', '📣', '/images/agents/max.jpg', 'from-blue-500 to-cyan-500', 'online', 'Plans influencer campaigns end-to-end.', 'Luna team responded positively.', '15m ago'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'chan', 'Chan', 'Channel Manager', '🏭', '/images/agents/chan.jpg', 'from-emerald-500 to-green-600', 'online', 'Manages supplier/creator partnerships.', 'Hoodie design approved.', '20m ago');

INSERT INTO agent_tasks (id, agent_id, task_key, title, status, priority, due, progress)
VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 't1', 'Review GameVerse IP proposal', 'pending', 'high', 'Today', 0),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 't2', 'Renew voice licensing terms', 'in_progress', 'medium', 'This week', 45),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 't3', 'Weekly performance report', 'done', 'high', 'Done', 100),
  ('31000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 't4', 'Negotiate with Luna IP Manager', 'in_progress', 'high', 'Today', 60),
  ('31000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 't5', 'List Luna hoodie in creator shop', 'in_progress', 'high', 'Today', 70);

INSERT INTO conversations (id, agent_id, from_type, text, time)
VALUES
  ('32000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'agent', 'Good morning, Luna. Three new licensing requests arrived today.', '9:00 AM'),
  ('32000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'user', 'Great, tell me more.', '9:05 AM'),
  ('32000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'agent', 'Weekly performance report: TikTok up 34 percent.', '8:00 AM'),
  ('32000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'agent', 'Campaign created and outreach started.', '9:11 AM');

-- Group chat + messages
INSERT INTO group_chats (id, user_id, chat_key, name, participants, icons, last_message, last_time)
VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'grp1', 'Strategy: Me + Eric + Nova', ARRAY['Luna','Eric','Nova'], ARRAY['👤','📊','✨'], 'Nova: Based on Eric data, we should pivot to cozy content.', '1h ago');

INSERT INTO group_chat_messages (id, group_chat_id, from_name, avatar, text, time)
VALUES
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Eric', '📊', 'Cozy content is getting 2.3x engagement.', '9:00 AM'),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Nova', '✨', 'I drafted six cozy-themed ideas.', '9:05 AM'),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'user', NULL, 'Love it. Let us run top three ideas this week.', '9:20 AM');

-- Membership tiers
INSERT INTO membership_tiers (id, creator_id, tier_key, name, price, description, perks, subscriber_count)
VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'free', 'Free', 0.00, 'Basic free tier', ARRAY['Access to public posts','Comment on posts','Join community Discord'], 180000),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'creator_club', 'Creator Club', 9.99, 'Popular monthly membership', ARRAY['Early access','Exclusive art pack','Members-only channels','10 percent shop discount'], 42000),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'vip', 'VIP Collective', 29.99, 'High-touch premium membership', ARRAY['Everything in Creator Club','1-on-1 feedback','Early merch access','25 percent shop discount'], 12000);

-- Fans CRM
INSERT INTO fans (id, creator_id, name, handle, tier, joined_date, total_spend, status, color, initials, last_seen, avatar_img)
VALUES
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Alex Park', '@alexpark', 'vip', '2024-01-15', 1240, 'active', 'from-pink-500 to-rose-600', 'AP', '2h ago', '/images/fans/AlexPark.png'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Jordan Lee', '@jordanlee', 'creator_club', '2024-02-20', 380, 'active', 'from-blue-500 to-blue-700', 'JL', '1d ago', '/images/fans/JordanLee.png'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Aria Patel', '@ariapatel', 'vip', '2023-06-14', 5600, 'active', 'from-yellow-500 to-amber-600', 'AP', '20m ago', '/images/fans/AriaPatel.png');

-- IP records
INSERT INTO ip_licenses (id, creator_id, requester, type, status, fee_type, amount, approved_by, date)
VALUES
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ArtisanCraft Co.', 'Merchandise (Hoodie Design)', 'approved', 'royalty', '$340/mo', 'Lisa (AI)', '2025-06-10'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'IndieSound Studio', 'Voice Acting (NPC)', 'negotiating', 'flat', '$8,000', 'Pending', '2025-06-18'),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'GameVerse Studios', 'Influencer Sponsorship', 'approved', 'performance', '$12,000 + CPV', 'Lisa (AI) + Luna', '2025-06-17');

INSERT INTO ip_infringements (id, creator_id, platform, offender, content, status, action, result, date)
VALUES
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TikTok', '@copypaste99', 'Repost of Neon City art without credit', 'resolved', 'DMCA takedown sent', 'Content removed', '2025-06-18'),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Etsy', 'PirateStore88', 'Selling prints without license', 'in_progress', 'Cease and desist sent', 'Awaiting response', '2025-06-15');

-- Analytics
INSERT INTO analytics_revenue (id, user_id, month, subscriptions, tips, shop, ip)
VALUES
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Jan', 6200, 1200, 980, 400),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Feb', 7100, 1450, 1200, 600),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Mar', 7800, 1800, 1450, 800),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Apr', 8200, 1600, 1800, 1200),
  ('80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'May', 9100, 2100, 2100, 900),
  ('80000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Jun', 8200, 2100, 1400, 700);

INSERT INTO analytics_views (id, user_id, month, tiktok, youtube, instagram)
VALUES
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Jan', 520000, 280000, 120000),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Feb', 680000, 310000, 140000),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Mar', 890000, 340000, 160000),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Apr', 1100000, 290000, 180000),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'May', 950000, 360000, 210000),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Jun', 1200000, 340000, 230000);

-- Advertiser campaigns
INSERT INTO campaigns (id, advertiser_id, name, status, budget, spent, start_date, end_date, agent_key, reach, target_reach, conversions, target_conversions)
VALUES
  ('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Galaxy Quest Launch', 'active', 50000, 31500, '2025-06-10', '2025-07-10', 'max', 2100000, 3200000, 8400, 15000),
  ('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Summer Sale Blast', 'completed', 20000, 19800, '2025-05-01', '2025-05-31', 'max', 4500000, 3000000, 22000, 15000);

INSERT INTO campaign_creators (id, campaign_id, creator_id, status, stage, budget, views, conversions)
VALUES
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'live', 'Content Live', 8500, 890000, 4200),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'production', 'Content in Production', 12000, 0, 0),
  ('91000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'completed', 'Completed', 8000, 2100000, 12000);

-- Supplier tables
INSERT INTO supplier_creator_partnerships (id, supplier_id, creator_id, status, products_count, monthly_sales, ip_approved, channel_manager)
VALUES
  ('92000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'active', 4, 45600, true, 'Chan'),
  ('92000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'negotiating', 0, 0, false, 'Chan');

INSERT INTO supplier_products (id, supplier_id, creator_id, name, sku, price, sold_today, sold_week, sold_month, revenue_month, status)
VALUES
  ('93000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Neon City Hoodie (Luna Chen)', 'NC-HOOD-001', 59.99, 12, 78, 234, 14036, 'active'),
  ('93000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Pixel Pin Set (Luna Chen)', 'PP-PIN-001', 24.99, 8, 45, 189, 4723, 'active'),
  ('93000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Chibi Luna Plushie', 'CL-PLU-001', 44.99, 5, 31, 78, 3509, 'low_stock');

COMMIT;
