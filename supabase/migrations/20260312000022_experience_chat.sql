-- Experience group chat messages (consumer multi-person chat)
CREATE TABLE experience_chat_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id   UUID NOT NULL REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name     TEXT NOT NULL,
  author_avatar   TEXT,
  author_color    TEXT,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exp_chat_experience ON experience_chat_messages(experience_id);
CREATE INDEX idx_exp_chat_created ON experience_chat_messages(experience_id, created_at);

-- RLS
ALTER TABLE experience_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages in experiences they have access to
CREATE POLICY "experience_chat_read" ON experience_chat_messages
  FOR SELECT USING (true);

-- Users can insert their own messages
CREATE POLICY "experience_chat_insert" ON experience_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'experience_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE experience_chat_messages;
  END IF;
END $$;
