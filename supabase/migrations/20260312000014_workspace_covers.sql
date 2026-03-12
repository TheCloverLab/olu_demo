-- Set covers for all workspaces that don't have one yet

-- Luna Chen Workspace (digital artist & gamer)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000001' AND cover IS NULL;

-- Kai Vibe Workspace (lo-fi producer)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000002' AND cover IS NULL;

-- Zara Nova Workspace (fashion & lifestyle)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000003' AND cover IS NULL;

-- GameVerse Studios (gaming)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000004' AND cover IS NULL;

-- Marcus Chen Workspace (tech marketing)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000005' AND cover IS NULL;

-- ArtisanCraft Co. (crafts & supply chain)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1452860606245-08f6b189370a?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000006' AND cover IS NULL;

-- Yuki Draws Workspace (illustration)
UPDATE workspaces SET cover = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80'
WHERE id = '05000000-0000-0000-0000-000000000007' AND cover IS NULL;
