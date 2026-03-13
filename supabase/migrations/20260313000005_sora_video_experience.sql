-- Add video experience for Sora Kim's Glow Lab workspace
INSERT INTO workspace_experiences (id, workspace_id, type, name, cover, position, visibility, status)
VALUES (
  '06000000-0000-0000-0000-000000000033',
  '05000000-0000-0000-0000-000000000012',
  'video',
  'Skincare Tutorials',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  4,
  'public',
  'active'
);

-- Seed video items (K-beauty themed YouTube videos)
INSERT INTO experience_video_items (experience_id, title, video_url, description, position) VALUES
  ('06000000-0000-0000-0000-000000000033', '10-Step Korean Skincare Routine', 'https://www.youtube.com/watch?v=_wjFahULCK8', 'The complete guide to the famous 10-step routine', 0),
  ('06000000-0000-0000-0000-000000000033', 'Glass Skin Tutorial', 'https://www.youtube.com/watch?v=S99ZEU7k4X0', 'How to achieve the coveted glass skin look', 1),
  ('06000000-0000-0000-0000-000000000033', 'Sunscreen Guide: Chemical vs Physical', 'https://www.youtube.com/watch?v=UPpUVbwUozY', 'Understanding SPF and choosing the right sunscreen', 2);

-- Update home config to add Videos tab with inline mode
UPDATE workspace_home_configs
SET tabs = '[
  {"key":"community","label":"Community","position":1,"display_mode":"grid","experience_ids":["06000000-0000-0000-0000-000000000029","06000000-0000-0000-0000-000000000030"]},
  {"key":"courses","label":"Courses","position":2,"display_mode":"inline","experience_ids":["06000000-0000-0000-0000-000000000031"]},
  {"key":"videos","label":"Videos","position":3,"display_mode":"inline","experience_ids":["06000000-0000-0000-0000-000000000033"]},
  {"key":"chat","label":"Chat","position":4,"display_mode":"inline","experience_ids":["06000000-0000-0000-0000-000000000032"]}
]'::jsonb
WHERE workspace_id = '05000000-0000-0000-0000-000000000012';

NOTIFY pgrst, 'reload schema';
