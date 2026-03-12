-- Set workspace icons to creator avatars so they have distinct icons
UPDATE workspaces SET icon = '/images/avatars/luna.jpg' WHERE id = '05000000-0000-0000-0000-000000000001';
UPDATE workspaces SET icon = '/images/avatars/kai.jpg' WHERE id = '05000000-0000-0000-0000-000000000002';
UPDATE workspaces SET icon = '/images/avatars/zara.jpg' WHERE id = '05000000-0000-0000-0000-000000000003';

-- New workspaces use Unsplash images as icons
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000008';
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000009';
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000010';
UPDATE workspaces SET icon = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop&q=80' WHERE id = '05000000-0000-0000-0000-000000000011';
