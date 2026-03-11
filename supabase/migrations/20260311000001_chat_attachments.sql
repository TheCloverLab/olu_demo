-- Chat attachments for agent conversations and group chats

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE group_chat_messages
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Chat attachments are publicly readable'
  ) THEN
    CREATE POLICY "Chat attachments are publicly readable"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'chat-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own chat attachments'
  ) THEN
    CREATE POLICY "Users can upload own chat attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'chat-attachments'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own chat attachments'
  ) THEN
    CREATE POLICY "Users can update own chat attachments"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'chat-attachments'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own chat attachments'
  ) THEN
    CREATE POLICY "Users can delete own chat attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;
