-- Experience Course Hierarchy (Whop-style)
-- A "course" experience contains multiple courses, each with chapters and lessons.

-- ── Courses within a course-type experience ──────────────────────
CREATE TABLE IF NOT EXISTS experience_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES workspace_experiences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_courses_exp ON experience_courses(experience_id);

-- ── Chapters within a course ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_course_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES experience_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_course_chapters_course ON experience_course_chapters(course_id);

-- ── Lessons within a chapter ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES experience_course_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_course_lessons_chapter ON experience_course_lessons(chapter_id);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE experience_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY experience_courses_select ON experience_courses FOR SELECT USING (true);
CREATE POLICY experience_course_chapters_select ON experience_course_chapters FOR SELECT USING (true);
CREATE POLICY experience_course_lessons_select ON experience_course_lessons FOR SELECT USING (true);

-- Service role handles all writes (business-side operations)
CREATE POLICY experience_courses_all ON experience_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY experience_course_chapters_all ON experience_course_chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY experience_course_lessons_all ON experience_course_lessons FOR ALL USING (true) WITH CHECK (true);
