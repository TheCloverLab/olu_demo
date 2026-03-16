-- Fix chats_update policy: allow chat members to update (for last_message),
-- not just workspace owners.

DROP POLICY IF EXISTS "chats_update" ON chats;
CREATE POLICY "chats_update" ON chats FOR UPDATE USING (
  is_chat_member(id, current_user_id())
  OR is_workspace_owner(workspace_id, current_user_id())
);

NOTIFY pgrst, 'reload schema';
