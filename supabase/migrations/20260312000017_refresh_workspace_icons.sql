-- Refresh workspace icons with known-good Unsplash URLs
-- Previous URLs may have become inaccessible

-- Luna's workspace: abstract digital art
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000001';
-- Kai's workspace: music/vinyl
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000002';
-- Zara's workspace: fashion/textiles
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000003';
-- FitLife Academy: gym
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000008';
-- Lens Studio: camera
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000009';
-- CodeCraft Academy: code
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000010';
-- TasteTrail: food/cooking
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000011';
