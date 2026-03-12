import { supabase } from '../../lib/supabase'
import type {
  ExperienceCourse,
  ExperienceCourseChapter,
  ExperienceCourseLesson,
} from '../../lib/supabase'

// ── Courses ──────────────────────────────────────────────────────

export async function listCourses(experienceId: string): Promise<ExperienceCourse[]> {
  const { data, error } = await supabase
    .from('experience_courses')
    .select('*')
    .eq('experience_id', experienceId)
    .order('position')

  if (error) throw error
  return (data || []) as ExperienceCourse[]
}

export async function createCourse(experienceId: string, name: string): Promise<ExperienceCourse> {
  const { data: maxPos } = await supabase
    .from('experience_courses')
    .select('position')
    .eq('experience_id', experienceId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (maxPos?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('experience_courses')
    .insert({ experience_id: experienceId, name, position })
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourse
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Pick<ExperienceCourse, 'name' | 'description' | 'cover' | 'status' | 'position'>>
): Promise<ExperienceCourse> {
  const { data, error } = await supabase
    .from('experience_courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourse
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('experience_courses')
    .delete()
    .eq('id', courseId)

  if (error) throw error
}

// ── Chapters ─────────────────────────────────────────────────────

export async function listChapters(courseId: string): Promise<ExperienceCourseChapter[]> {
  const { data, error } = await supabase
    .from('experience_course_chapters')
    .select('*')
    .eq('course_id', courseId)
    .order('position')

  if (error) throw error
  return (data || []) as ExperienceCourseChapter[]
}

export async function createChapter(courseId: string, title: string): Promise<ExperienceCourseChapter> {
  const { data: maxPos } = await supabase
    .from('experience_course_chapters')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (maxPos?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('experience_course_chapters')
    .insert({ course_id: courseId, title, position })
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourseChapter
}

export async function updateChapter(
  chapterId: string,
  updates: Partial<Pick<ExperienceCourseChapter, 'title' | 'position'>>
): Promise<ExperienceCourseChapter> {
  const { data, error } = await supabase
    .from('experience_course_chapters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chapterId)
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourseChapter
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const { error } = await supabase
    .from('experience_course_chapters')
    .delete()
    .eq('id', chapterId)

  if (error) throw error
}

// ── Lessons ──────────────────────────────────────────────────────

export async function listLessons(chapterId: string): Promise<ExperienceCourseLesson[]> {
  const { data, error } = await supabase
    .from('experience_course_lessons')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('position')

  if (error) throw error
  return (data || []) as ExperienceCourseLesson[]
}

export async function createLesson(chapterId: string, title: string): Promise<ExperienceCourseLesson> {
  const { data: maxPos } = await supabase
    .from('experience_course_lessons')
    .select('position')
    .eq('chapter_id', chapterId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (maxPos?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('experience_course_lessons')
    .insert({ chapter_id: chapterId, title, position })
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourseLesson
}

export async function updateLesson(
  lessonId: string,
  updates: Partial<Pick<ExperienceCourseLesson, 'title' | 'content' | 'video_url' | 'attachments' | 'position'>>
): Promise<ExperienceCourseLesson> {
  const { data, error } = await supabase
    .from('experience_course_lessons')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', lessonId)
    .select('*')
    .single()

  if (error) throw error
  return data as ExperienceCourseLesson
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const { error } = await supabase
    .from('experience_course_lessons')
    .delete()
    .eq('id', lessonId)

  if (error) throw error
}

// ── Full course tree ─────────────────────────────────────────────

export type CourseTree = ExperienceCourse & {
  chapters: (ExperienceCourseChapter & { lessons: ExperienceCourseLesson[] })[]
}

export async function getCourseTree(courseId: string): Promise<CourseTree | null> {
  const { data: course, error: courseErr } = await supabase
    .from('experience_courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseErr || !course) return null

  const chapters = await listChapters(courseId)
  const chaptersWithLessons = await Promise.all(
    chapters.map(async (ch) => ({
      ...ch,
      lessons: await listLessons(ch.id),
    }))
  )

  return { ...(course as ExperienceCourse), chapters: chaptersWithLessons }
}
