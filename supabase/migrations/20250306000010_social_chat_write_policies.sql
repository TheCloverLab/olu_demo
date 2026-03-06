-- Enable write policies for social chats and messages

DROP POLICY IF EXISTS "Users can insert own social chats" ON social_chats;
CREATE POLICY "Users can insert own social chats"
  ON social_chats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = social_chats.user_id
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own social chats" ON social_chats;
CREATE POLICY "Users can update own social chats"
  ON social_chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = social_chats.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = social_chats.user_id
        AND users.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own social chat messages" ON social_chat_messages;
CREATE POLICY "Users can insert own social chat messages"
  ON social_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM social_chats
      JOIN users ON users.id = social_chats.user_id
      WHERE social_chats.id = social_chat_messages.social_chat_id
        AND users.auth_id = auth.uid()
    )
  );
