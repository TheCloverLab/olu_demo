-- ============================================================================
-- DEFAULT AGENT MARKETPLACE TEMPLATES
-- ============================================================================

INSERT INTO agent_templates (
  id,
  template_key,
  name,
  role,
  avatar_img,
  color,
  category,
  pricing_model,
  price_label,
  model,
  cost_per_1k,
  rating,
  reviews,
  description,
  status
)
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
  ('05700000-0000-0000-0000-000000000010', 'localization_agent', 'Localization Agent', 'Localization Agent', '/images/agents/localization.jpg', 'from-cyan-500 to-blue-600', 'Pro', 'subscription', '$4.99/mo', 'Gemini 3 Pro', 0.0003, 4.6, 430, 'Translates and localizes content for global audiences.', 'active')
ON CONFLICT (template_key) DO UPDATE
SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  avatar_img = EXCLUDED.avatar_img,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  pricing_model = EXCLUDED.pricing_model,
  price_label = EXCLUDED.price_label,
  model = EXCLUDED.model,
  cost_per_1k = EXCLUDED.cost_per_1k,
  rating = EXCLUDED.rating,
  reviews = EXCLUDED.reviews,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();
