-- ============================================================================
-- CONSUMER ENGAGEMENT STATE
-- ============================================================================

CREATE TABLE consumer_memberships (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_key TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

CREATE TABLE consumer_course_purchases (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES consumer_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'purchased' CHECK (status IN ('purchased', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE consumer_lesson_progress (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES consumer_courses(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, section_key)
);

CREATE INDEX idx_consumer_memberships_user_id ON consumer_memberships(user_id);
CREATE INDEX idx_consumer_course_purchases_user_id ON consumer_course_purchases(user_id);
CREATE INDEX idx_consumer_lesson_progress_user_id ON consumer_lesson_progress(user_id);

ALTER TABLE consumer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consumer memberships"
  ON consumer_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_memberships.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own consumer memberships"
  ON consumer_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_memberships.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_memberships.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own course purchases"
  ON consumer_course_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_course_purchases.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own course purchases"
  ON consumer_course_purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_course_purchases.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_course_purchases.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own lesson progress"
  ON consumer_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_lesson_progress.user_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own lesson progress"
  ON consumer_lesson_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_lesson_progress.user_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = consumer_lesson_progress.user_id
        AND users.auth_id = auth.uid()
    )
  );
