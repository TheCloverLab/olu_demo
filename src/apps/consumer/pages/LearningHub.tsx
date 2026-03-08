import { useEffect, useState } from 'react'
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
        <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
          <BookOpen size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">{learning.title}</h1>
          <p className="text-olu-muted text-sm">{learning.subtitle}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {courseLibrary.length === 0 && (
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5 text-sm text-olu-muted">
            No purchased courses yet. Buy a course to unlock your learning dashboard.
          </div>
        )}
        {courseLibrary.map((course) => (
          <div key={course.id} className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            {(() => {
              const computed = computeCourseProgress(course, progressBySlug[course.slug] || [])
              return (
                <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{course.title}</p>
                <p className="text-xs text-olu-muted mt-1">{course.instructor}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-300">{computed.percent}%</span>
            </div>
            <div className="rounded-full h-2 bg-white/10 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${computed.percent}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 size={14} className="text-amber-300" />
                  <p className="text-xs text-olu-muted">Next lesson</p>
                </div>
                <p className="font-semibold text-sm mt-2">{computed.nextSection?.title || course.sections[0]?.title}</p>
              </div>
              <button
                onClick={() => navigate(`/learn/${course.slug}/${computed.nextSection?.id || course.sections[0]?.id}`)}
                className="rounded-2xl bg-white text-black p-4 text-left hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle size={14} />
                  <p className="text-xs">Continue</p>
                </div>
                <p className="font-semibold text-sm mt-2">Resume learning</p>
              </button>
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
