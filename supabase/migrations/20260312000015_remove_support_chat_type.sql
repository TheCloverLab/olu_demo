-- Remove support_chat from experience types
-- Support chat is a standalone feature, not an experience type

-- Delete any existing support_chat experiences
DELETE FROM workspace_experiences WHERE type = 'support_chat';

-- Update the CHECK constraint to remove support_chat
ALTER TABLE workspace_experiences DROP CONSTRAINT IF EXISTS workspace_experiences_type_check;
ALTER TABLE workspace_experiences ADD CONSTRAINT workspace_experiences_type_check
  CHECK (type IN ('forum', 'course', 'group_chat'));
