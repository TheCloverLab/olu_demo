-- Remove 'members_only' from experience visibility
-- Whop-style access: no linked products = free, has linked products = needs purchase

-- Update any existing members_only experiences to public
UPDATE workspace_experiences SET visibility = 'public' WHERE visibility = 'members_only';

-- Drop and recreate the CHECK constraint without members_only
ALTER TABLE workspace_experiences DROP CONSTRAINT IF EXISTS workspace_experiences_visibility_check;
ALTER TABLE workspace_experiences ADD CONSTRAINT workspace_experiences_visibility_check
  CHECK (visibility IN ('public', 'product_gated'));
