import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowLeft, BookOpen, Play, Check, Lock, Clock, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../../context/AuthContext'
import type { WorkspaceExperience } from '../../../lib/supabase'
import { getExperience } from '../../../domain/experience/api'

type CourseChapter = {
  id: string
  title: string
  lessons: CourseLesson[]
}

type CourseLesson = {
  id: string
  title: string
  duration: string
  completed: boolean
  locked: boolean
}

const IS_DEMO = import.meta.env.VITE_SUPABASE_URL?.includes('demo-placeholder')

const DEMO_CHAPTERS: CourseChapter[] = [
  {
    id: 'ch-1',
    title: 'Getting Started',
    lessons: [
      { id: 'l-1', title: 'Welcome & Course Overview', duration: '5 min', completed: true, locked: false },
      { id: 'l-2', title: 'Setting Up Your Workspace', duration: '12 min', completed: true, locked: false },
      { id: 'l-3', title: 'Understanding Digital Color Theory', duration: '18 min', completed: false, locked: false },
    ],
  },
  {
    id: 'ch-2',
    title: 'Core Techniques',
    lessons: [
      { id: 'l-4', title: 'Layering & Blending Modes', duration: '22 min', completed: false, locked: false },
      { id: 'l-5', title: 'Light & Shadow Fundamentals', duration: '25 min', completed: false, locked: false },
      { id: 'l-6', title: 'Creating Depth with Gradients', duration: '20 min', completed: false, locked: false },
    ],
  },
  {
    id: 'ch-3',
    title: 'Advanced Projects',
    lessons: [
      { id: 'l-7', title: 'Cyberpunk Cityscape Project', duration: '45 min', completed: false, locked: true },
      { id: 'l-8', title: 'Character Portrait Workshop', duration: '40 min', completed: false, locked: true },
      { id: 'l-9', title: 'Final Project: Full Scene Composition', duration: '60 min', completed: false, locked: true },
    ],
  },
]

function LessonRow({ lesson, active, onClick }: { lesson: CourseLesson; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={lesson.locked}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-xl',
        active
          ? 'bg-cyan-300/10 border border-cyan-300/30'
          : lesson.locked
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-[var(--olu-card-hover)]'
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        lesson.completed
          ? 'bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
          : lesson.locked
            ? 'bg-[var(--olu-card-bg)] text-[var(--olu-muted)]'
            : active
              ? 'bg-cyan-300 text-[#04111f]'
              : 'bg-[var(--olu-card-bg)] text-[var(--olu-text-secondary)]'
      )}>
        {lesson.completed ? <Check size={14} /> : lesson.locked ? <Lock size={12} /> : <Play size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', active && 'text-cyan-700 dark:text-cyan-300')}>{lesson.title}</p>
        <p className="text-xs text-[var(--olu-muted)] flex items-center gap-1">
          <Clock size={10} /> {lesson.duration}
        </p>
      </div>
      <ChevronRight size={14} className="text-[var(--olu-muted)] flex-shrink-0" />
    </button>
  )
}

function LessonContent({ lesson }: { lesson: CourseLesson }) {
  return (
    <div className="space-y-4">
      {/* Video placeholder */}
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-[var(--olu-card-bg)] to-[var(--olu-section-bg)] border border-[var(--olu-card-border)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-cyan-300/20 flex items-center justify-center mx-auto">
            <Play size={24} className="text-cyan-700 dark:text-cyan-300 ml-1" />
          </div>
          <p className="text-sm text-[var(--olu-text-secondary)]">{lesson.title}</p>
          <p className="text-xs text-[var(--olu-muted)]">{lesson.duration}</p>
        </div>
      </div>

      {/* Lesson description */}
      <div className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] p-4 space-y-3">
        <h3 className="font-semibold text-sm">{lesson.title}</h3>
        <p className="text-sm text-[var(--olu-text-secondary)] leading-relaxed">
          This lesson covers the key concepts and techniques you need to master.
          Follow along with the video and practice the exercises to build your skills.
        </p>
      </div>

      {/* Mark complete button */}
      <button className={clsx(
        'w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
        lesson.completed
          ? 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20'
          : 'bg-cyan-300 text-[#04111f] hover:bg-cyan-200'
      )}>
        <Check size={16} />
        {lesson.completed ? 'Completed' : 'Mark as Complete'}
      </button>
    </div>
  )
}

export default function CourseView() {
  const { experienceId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [experience, setExperience] = useState<WorkspaceExperience | null>(null)
  const [chapters, setChapters] = useState<CourseChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!experienceId) return
      try {
        const exp = await getExperience(experienceId)
        setExperience(exp)
        // TODO: load real course chapters from DB
        if (IS_DEMO) {
          setChapters(DEMO_CHAPTERS)
          setActiveLesson('l-3')
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

  const allLessons = chapters.flatMap((ch) => ch.lessons)
  const completedCount = allLessons.filter((l) => l.completed).length
  const totalCount = allLessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const currentLesson = allLessons.find((l) => l.id === activeLesson)

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-xl truncate">{experience?.name || 'Course'}</h1>
          <p className="text-[var(--olu-muted)] text-xs">{completedCount}/{totalCount} lessons completed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-olu-border/40 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{progressPct}%</span>
        </div>
      </div>

      {/* Cover */}
      {experience?.cover && (
        <div className="mx-4 h-40 rounded-2xl overflow-hidden mb-4">
          <img src={experience.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 px-4">
        {/* Sidebar: chapters & lessons */}
        <div className="md:w-80 flex-shrink-0 space-y-2">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--olu-card-border)]">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-sm">{chapter.title}</h3>
                </div>
                <p className="text-xs text-[var(--olu-muted)] mt-0.5">
                  {chapter.lessons.filter((l) => l.completed).length}/{chapter.lessons.length} completed
                </p>
              </div>
              <div className="p-1">
                {chapter.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    active={lesson.id === activeLesson}
                    onClick={() => !lesson.locked && setActiveLesson(lesson.id)}
                  />
                ))}
              </div>
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
    </div>
  )
}
