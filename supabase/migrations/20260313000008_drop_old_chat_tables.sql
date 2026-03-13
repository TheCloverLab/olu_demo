-- Drop old chat tables replaced by unified chats/chat_members/chat_messages
-- Old data was migrated in 20260313000006_unified_chat.sql

-- Drop old support auto-reply trigger (references social_chat_messages)
DROP TRIGGER IF EXISTS support_auto_reply_trigger ON social_chat_messages;
DROP FUNCTION IF EXISTS handle_support_auto_reply();

-- Drop old realtime publications
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS experience_chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS group_chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS social_chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS conversations;

-- Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS experience_chat_messages CASCADE;
DROP TABLE IF EXISTS social_chat_messages CASCADE;
DROP TABLE IF EXISTS social_chats CASCADE;
DROP TABLE IF EXISTS group_chat_messages CASCADE;
DROP TABLE IF EXISTS group_chats CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

NOTIFY pgrst, 'reload schema';
