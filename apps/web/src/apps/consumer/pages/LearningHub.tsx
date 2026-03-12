import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Clock3, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import type { Course } from '../courseData'
import { getCourseLibrarySnapshot } from '../../../domain/consumer/api'
import {
  computeCourseProgress,
  getProgressForCourse,
  getPurchasedCourseSlugs,
} from '../../../domain/consumer/engagement'
import type { ConsumerLessonProgress } from '../../../lib/supabase'

export default function LearningHub() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { consumerConfig, consumerExperience } = useApp()
  const { user } = useAuth()
  const { learning } = consumerExperience.courses
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [progressBySlug, setProgressBySlug] = useState<Record<string, ConsumerLessonProgress[]>>({})

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      const snapshot = await getCourseLibrarySnapshot(consumerConfig.featured_course_slug)
      const purchasedSlugs = await getPurchasedCourseSlugs(user as any, snapshot.courses)
      const purchasedCourses = snapshot.courses.filter((course) => purchasedSlugs.includes(course.slug))
      const progressEntries = await Promise.all(
        purchasedCourses.map(async (course) => [course.slug, await getProgressForCourse(user as any, course)] as const)
      )
      if (!cancelled) {
        setCourseLibrary(purchasedCourses)
        setProgressBySlug(Object.fromEntries(progressEntries))
      }
    }

    loadCourses()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
          <BookOpen size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">{learning.title}</h1>
          <p className="text-olu-muted text-sm">
            {courseLibrary.length > 0
              ? t('consumer.coursesInLibrary', { count: courseLibrary.length })
              : t('consumer.coursesShowUpHere')}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {courseLibrary.length === 0 && (
          <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5 text-sm text-olu-muted">
            {t('consumer.noCoursesInLibrary')}
          </div>
        )}
        {courseLibrary.map((course) => (
          <div key={course.id} className="rounded-[24px] overflow-hidden border border-olu-border bg-olu-surface">
            {(() => {
              const computed = computeCourseProgress(course, progressBySlug[course.slug] || [])
              return (
                <>
            <div className={`h-36 bg-gradient-to-br ${course.hero} p-5 flex flex-col justify-end`}>
              <p className="text-xs uppercase tracking-[0.16em] text-black/60">{course.instructor}</p>
              <p className="font-black text-2xl text-black mt-2">{course.title}</p>
            </div>
            <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-olu-muted">{course.subtitle}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{computed.percent}%</span>
            </div>
            <div className="rounded-full h-2 bg-olu-border/40 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${computed.percent}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4">
                <div className="flex items-center gap-2">
                  <Clock3 size={14} className="text-amber-600 dark:text-amber-300" />
                  <p className="text-xs text-olu-muted">{t('consumer.nextLesson')}</p>
                </div>
                <p className="font-semibold text-sm mt-2">{computed.nextSection?.title || course.sections[0]?.title}</p>
              </div>
              <button
                onClick={() => navigate(`/learn/${course.slug}/${computed.nextSection?.id || course.sections[0]?.id}`)}
                className="rounded-2xl bg-white text-black p-4 text-left hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle size={14} />
                  <p className="text-xs">{t('consumer.continue')}</p>
                </div>
                <p className="font-semibold text-sm mt-2">{t('consumer.resumeLearning')}</p>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.sections.slice(0, 2).map((section) => (
                <span key={section.id} className="rounded-full border border-olu-border bg-[var(--olu-card-bg)] px-2.5 py-1 text-[11px] text-olu-muted">
                  {section.title}
                </span>
              ))}
            </div>
            </div>
                </>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}
