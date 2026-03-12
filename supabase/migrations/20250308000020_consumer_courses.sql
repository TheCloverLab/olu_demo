-- ============================================================================
-- CONSUMER COURSES
-- ============================================================================

CREATE TABLE consumer_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  instructor TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  hero TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  lessons_count INTEGER NOT NULL DEFAULT 0,
  students_count INTEGER NOT NULL DEFAULT 0,
  completion_rate TEXT NOT NULL DEFAULT '0%',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consumer_course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES consumer_courses(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  summary TEXT NOT NULL,
  preview BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, section_key)
);

CREATE INDEX idx_consumer_courses_creator_id ON consumer_courses(creator_id);
CREATE INDEX idx_consumer_course_sections_course_id ON consumer_course_sections(course_id);

ALTER TABLE consumer_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumer courses are viewable by everyone"
  ON consumer_courses FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can manage own consumer courses"
  ON consumer_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = consumer_courses.creator_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = consumer_courses.creator_id
        AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Consumer course sections are viewable by everyone"
  ON consumer_course_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM consumer_courses
      WHERE consumer_courses.id = consumer_course_sections.course_id
        AND consumer_courses.status = 'published'
    )
  );

CREATE POLICY "Creators can manage own consumer course sections"
  ON consumer_course_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM consumer_courses
      JOIN users ON users.id = consumer_courses.creator_id
      WHERE consumer_courses.id = consumer_course_sections.course_id
        AND users.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM consumer_courses
      JOIN users ON users.id = consumer_courses.creator_id
      WHERE consumer_courses.id = consumer_course_sections.course_id
        AND users.auth_id = auth.uid()
    )
  );
