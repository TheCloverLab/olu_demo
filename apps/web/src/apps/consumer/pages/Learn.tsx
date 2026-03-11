import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import type { Course } from '../courseData'
import { getCourseSnapshotBySlug } from '../../../domain/consumer/api'
import {
  computeCourseProgress,
  getProgressForCourse,
  hasPurchasedCourse,
  markLessonComplete,
} from '../../../domain/consumer/engagement'
import type { ConsumerLessonProgress } from '../../../lib/supabase'

export default function Learn() {
  const navigate = useNavigate()
  const { courseSlug, sectionId } = useParams()
  const { consumerConfig, consumerExperience } = useApp()
  const { user } = useAuth()
  const { detail } = consumerExperience.courses
  const [course, setCourse] = useState<Course | null | undefined>(undefined)
  const [progress, setProgress] = useState<ConsumerLessonProgress[]>([])
  const [purchased, setPurchased] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      if (!courseSlug) return
      const data = await getCourseSnapshotBySlug(courseSlug, consumerConfig.featured_course_slug)
      if (!cancelled) {
        setCourse(data)
        if (data) {
          const [courseProgress, enrolled] = await Promise.all([
            getProgressForCourse(user as any, data),
            hasPurchasedCourse(user as any, data),
          ])
          setProgress(courseProgress)
          setPurchased(enrolled)
        }
      }
    }

    loadCourse()
    return () => {
      cancelled = true
    }
  }, [courseSlug])

  const section = course?.sections.find((item) => item.id === sectionId)
  const courseProgress = course ? computeCourseProgress(course, progress) : null

  if (course === undefined) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading lesson...</div>
  }

  if (!course || !section) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Lesson not found.</div>
  }

  if (!section.preview && !purchased) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-[24px] border border-olu-border bg-olu-surface p-6">
          <p className="font-bold text-xl mb-2">Purchase required</p>
          <p className="text-olu-muted text-sm mb-4">This lesson is locked until you buy the course.</p>
          <button
            onClick={() => navigate(`/checkout/${course.slug}`)}
            className="px-4 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity"
          >
            Go to checkout
          </button>
        </div>
      </div>
    )
  }

  async function handleMarkComplete() {
    setMarkingComplete(true)
    try {
      await markLessonComplete(user as any, course, section.id)
      const nextProgress = await getProgressForCourse(user as any, course)
      setProgress(nextProgress)
    } catch (error) {
      console.error('Failed to mark lesson complete', error)
    } finally {
      setMarkingComplete(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <button onClick={() => navigate(`/courses/${course.slug}/catalog`)} className="inline-flex items-center gap-2 text-sm text-olu-muted hover:text-white transition-colors mb-5">
        <ChevronLeft size={15} />
        {detail.catalogLabel}
      </button>
      <div className="grid lg:grid-cols-[1.15fr,0.85fr] gap-4">
        <div className="rounded-[28px] border border-olu-border bg-olu-surface overflow-hidden">
          <div className={`h-64 bg-gradient-to-br ${course.hero} p-6 flex items-end`}>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/60 mb-2">{course.title}</p>
              <h1 className="font-black text-3xl text-black">{section.title}</h1>
            </div>
          </div>
          <div className="p-6">
            <p className="text-olu-text leading-relaxed">{section.summary}</p>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4 mt-5">
              <p className="text-sm text-olu-muted">Learning surface placeholder</p>
              <p className="font-semibold mt-1">This is where the video / audio / article lesson player goes.</p>
            </div>
            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="mt-5 px-4 py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {markingComplete ? 'Saving...' : 'Mark lesson complete'}
            </button>
          </div>
        </div>
        <div className="rounded-[28px] border border-olu-border bg-olu-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-sky-300" />
            <p className="font-semibold">{consumerExperience.courses.learning.title}</p>
          </div>
          {courseProgress && (
            <p className="text-xs text-olu-muted mb-3">
              {courseProgress.completedCount}/{course.sections.length} lessons completed
            </p>
          )}
          <div className="space-y-3">
            {course.sections.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/learn/${course.slug}/${item.id}`)}
                className="w-full rounded-2xl border border-olu-border bg-[var(--olu-card-bg)] p-4 text-left hover:bg-[var(--olu-card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-olu-muted mt-1">{item.duration}</p>
                  </div>
                  {(courseProgress?.completedKeys.has(item.id) || item.id === section.id) && <CheckCircle2 size={16} className="text-emerald-300" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
