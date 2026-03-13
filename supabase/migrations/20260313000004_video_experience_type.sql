-- Add 'video' to experience types
ALTER TABLE workspace_experiences DROP CONSTRAINT IF EXISTS workspace_experiences_type_check;
ALTER TABLE workspace_experiences ADD CONSTRAINT workspace_experiences_type_check
  CHECK (type IN ('forum', 'course', 'group_chat', 'video'));

-- Video items table — stores YouTube links per experience
CREATE TABLE IF NOT EXISTS experience_video_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_video_items_exp ON experience_video_items(experience_id);

-- RLS
ALTER TABLE experience_video_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_items_select" ON experience_video_items FOR SELECT USING (true);

CREATE POLICY "video_items_manage" ON experience_video_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspace_experiences we
    JOIN workspace_memberships wm ON wm.workspace_id = we.workspace_id
    WHERE we.id = experience_video_items.experience_id
      AND wm.user_id = auth.uid()
      AND wm.membership_role IN ('owner', 'admin')
  )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
