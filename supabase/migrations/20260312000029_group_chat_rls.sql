-- RLS policies for group_chats and group_chat_messages
-- group_chats.user_id links to the workspace owner via users.id

-- Owners can do everything with their group chats
CREATE POLICY "Users can manage own group chats"
  ON group_chats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = group_chats.user_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = group_chats.user_id
        AND u.auth_id = auth.uid()
    )
  );

-- Group chat messages: same owner check via group_chats
CREATE POLICY "Users can manage own group chat messages"
  ON group_chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN users u ON u.id = gc.user_id
      WHERE gc.id = group_chat_messages.group_chat_id
        AND u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN users u ON u.id = gc.user_id
      WHERE gc.id = group_chat_messages.group_chat_id
        AND u.auth_id = auth.uid()
    )
  );
