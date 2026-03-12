import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, BookOpen, Play, Check, Lock, Clock, ChevronRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import type { WorkspaceExperience, ExperienceCourseLesson } from '../../../lib/supabase'
import { getExperience } from '../../../domain/experience/api'
import { listCourses } from '../../../domain/experience/course-api'
import type { CourseTree } from '../../../domain/experience/course-api'
import { getCourseTree } from '../../../domain/experience/course-api'

type ChapterWithLessons = CourseTree['chapters'][number]

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function LessonRow({ lesson, active, onClick }: { lesson: ExperienceCourseLesson; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-xl',
        active
          ? 'bg-cyan-300/10 border border-cyan-300/30'
          : 'hover:bg-[var(--olu-card-hover)]'
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        active
          ? 'bg-cyan-300 text-[#04111f]'
          : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)]'
      )}>
        <Play size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', active && 'text-cyan-700 dark:text-cyan-300')}>{lesson.title}</p>
        {lesson.video_url && (
          <p className="text-xs text-[var(--olu-muted)] flex items-center gap-1">
            <Play size={10} /> Video
          </p>
        )}
      </div>
      <ChevronRight size={14} className="text-[var(--olu-muted)] flex-shrink-0" />
    </button>
  )
}

function LessonContent({ lesson }: { lesson: ExperienceCourseLesson }) {
  const embedUrl = lesson.video_url ? getYouTubeEmbedUrl(lesson.video_url) : null

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="aspect-video rounded-2xl overflow-hidden border border-[var(--olu-card-border)]">
          <iframe
            src={embedUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-[var(--olu-card-bg)] to-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-cyan-300/20 flex items-center justify-center mx-auto">
              <Play size={24} className="text-cyan-700 dark:text-cyan-300 ml-1" />
            </div>
            <p className="text-sm text-[var(--olu-text-secondary)]">{lesson.title}</p>
          </div>
        </div>
      )}

      {lesson.content && (
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
          <h3 className="font-semibold text-sm">{lesson.title}</h3>
          <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
            {lesson.content}
          </p>
        </div>
      )}

      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-2">
          <h4 className="font-semibold text-xs text-[var(--olu-muted)]">Attachments</h4>
          {lesson.attachments.map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-cyan-600 dark:text-cyan-400 hover:underline">
              {att.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourseView() {
  const { experienceId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [courseTrees, setCourseTrees] = useState<CourseTree[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [activeCourseIdx, setActiveCourseIdx] = useState(0)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      if (!experienceId) return
      try {
        const exp = await getExperience(experienceId)
        setExperience(exp)

        const courses = await listCourses(experienceId)
        const trees = (await Promise.all(
          courses.map((c) => getCourseTree(c.id))
        )).filter(Boolean) as CourseTree[]

        setCourseTrees(trees)

        // Auto-select first lesson
        if (trees.length > 0 && trees[0].chapters.length > 0 && trees[0].chapters[0].lessons.length > 0) {
          setActiveLesson(trees[0].chapters[0].lessons[0].id)
          setExpandedChapters(new Set([trees[0].chapters[0].id]))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [experienceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  const currentCourse = courseTrees[activeCourseIdx]
  const allLessons = currentCourse?.chapters.flatMap((ch) => ch.lessons) || []
  const currentLesson = allLessons.find((l) => l.id === activeLesson)

  function toggleChapter(chapterId: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  function selectLesson(lesson: ExperienceCourseLesson, chapterId: string) {
    setActiveLesson(lesson.id)
    setExpandedChapters((prev) => new Set(prev).add(chapterId))
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-xl truncate">{experience?.name || 'Course'}</h1>
          <p className="text-[var(--olu-muted)] text-xs">{allLessons.length} lessons</p>
        </div>
      </div>

      {/* Cover */}
      {experience?.cover && (
        <div className="mx-4 h-40 rounded-2xl overflow-hidden mb-4">
          <img src={experience.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Course tabs if multiple courses */}
      {courseTrees.length > 1 && (
        <div className="px-4 mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {courseTrees.map((tree, idx) => (
            <button
              key={tree.id}
              onClick={() => {
                setActiveCourseIdx(idx)
                if (tree.chapters[0]?.lessons[0]) {
                  setActiveLesson(tree.chapters[0].lessons[0].id)
                  setExpandedChapters(new Set([tree.chapters[0].id]))
                }
              }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0',
                activeCourseIdx === idx
                  ? 'bg-cyan-300 text-[#04111f]'
                  : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)] hover:bg-[var(--olu-card-hover)]'
              )}
            >
              {tree.name}
            </button>
          ))}
        </div>
      )}

      {courseTrees.length === 0 ? (
        <div className="mx-4 rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
          <BookOpen size={32} className="text-[var(--olu-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--olu-muted)]">No course content yet.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 px-4">
          {/* Sidebar: chapters & lessons */}
          <div className="md:w-80 flex-shrink-0 space-y-2">
            {currentCourse?.chapters.map((chapter) => (
              <div key={chapter.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[var(--olu-card-hover)] transition-colors"
                >
                  <BookOpen size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="font-semibold text-sm flex-1 text-left">{chapter.title}</h3>
                  <span className="text-xs text-[var(--olu-muted)]">{chapter.lessons.length}</span>
                  <ChevronDown size={14} className={clsx('text-[var(--olu-muted)] transition-transform', expandedChapters.has(chapter.id) && 'rotate-180')} />
                </button>
                {expandedChapters.has(chapter.id) && (
                  <div className="p-1 border-t border-[var(--olu-card-border)]">
                    {chapter.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        active={lesson.id === activeLesson}
                        onClick={() => selectLesson(lesson, chapter.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {currentLesson ? (
              <LessonContent lesson={currentLesson} />
            ) : (
              <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-8 text-center">
                <BookOpen size={32} className="text-[var(--olu-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--olu-muted)]">Select a lesson to start learning.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
