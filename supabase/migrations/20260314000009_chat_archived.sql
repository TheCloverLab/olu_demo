-- Add is_archived column to chats for archive/unarchive feature
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
