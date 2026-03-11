import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import type { Course } from '../courseData'
import { getCourseLibrarySnapshot, getCourseSnapshotBySlug } from '../../../domain/consumer/api'
import { hasPurchasedCourse } from '../../../domain/consumer/engagement'

export default function Courses() {
  const navigate = useNavigate()
  const { courseSlug } = useParams()
  const { consumerConfig, consumerExperience } = useApp()
  const { user } = useAuth()
  const { courses } = consumerExperience
  const [selected, setSelected] = useState<Course | null | undefined>(courseSlug ? undefined : null)
  const [courseLibrary, setCourseLibrary] = useState<Course[]>([])
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      if (courseSlug) {
        const course = await getCourseSnapshotBySlug(courseSlug, consumerConfig.featured_course_slug)
        if (!cancelled) {
          setSelected(course)
          if (course) {
            const enrolled = await hasPurchasedCourse(user as any, course)
            setPurchased(enrolled)
          }
        }
        return
      }

      const snapshot = await getCourseLibrarySnapshot(consumerConfig.featured_course_slug)
      if (!cancelled) {
        setCourseLibrary(snapshot.courses)
      }
    }

    loadCourses()
    return () => {
      cancelled = true
    }
  }, [courseSlug])

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="rounded-[28px] border border-olu-border bg-olu-surface p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-olu-muted mb-2">Academy</p>
          <h1 className="font-black text-2xl md:text-3xl">{selected.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-olu-muted">
            <button
              onClick={() => selected.creator_id && navigate(`/people/${selected.creator_id}`)}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-bold text-white text-[10px]">
                {selected.instructor.split(' ').map(w => w[0]).join('')}
              </div>
              Hosted by {selected.instructor}
            </button>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--olu-card-bg)] text-xs">
              <GraduationCap size={12} />
              {selected.level}
            </div>
          </div>
          {selected.description && (
            <p className="text-sm text-olu-muted mt-3 leading-relaxed max-w-2xl">{selected.description}</p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4">
              <p className="font-black text-2xl">{selected.stats.lessons}</p>
              <p className="text-xs text-olu-muted mt-1">Lessons</p>
            </div>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4">
              <p className="font-black text-2xl">{selected.stats.students}</p>
              <p className="text-xs text-olu-muted mt-1">Students</p>
            </div>
            <div className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4">
              <p className="font-black text-2xl">${selected.price}</p>
              <p className="text-xs text-olu-muted mt-1">Price</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4 mt-4">
          <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5">
            <h2 className="font-bold text-xl mb-3">{courses.detail.learnTitle}</h2>
            <div className="space-y-3">
              {selected.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border p-4 text-sm text-olu-text">
                  {outcome}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-olu-border bg-olu-surface p-5">
            <h2 className="font-bold text-xl mb-3">{courses.detail.actionsTitle}</h2>
            <div className="space-y-3">
              <button onClick={() => navigate(`/courses/${selected.slug}/catalog`)} className="w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity">
                {courses.detail.catalogLabel}
              </button>
              <button
                onClick={() => navigate(purchased ? `/learn/${selected.slug}/${selected.sections[0]?.id}` : `/checkout/${selected.slug}`)}
                className="w-full py-3 rounded-2xl bg-[var(--olu-card-bg)] border border-olu-border font-semibold hover:bg-[var(--olu-card-hover)] transition-colors"
              >
                {purchased ? 'Continue learning' : courses.detail.buyLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (courseSlug && selected === undefined) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-olu-muted">Loading course...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
          <GraduationCap size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">{courses.catalog.title}</h1>
          <p className="text-olu-muted text-sm">{courses.catalog.subtitle}</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {courseLibrary.map((course) => (
          <button
            key={course.id}
            onClick={() => navigate(`/courses/${course.slug}`)}
            className="rounded-[24px] overflow-hidden border border-olu-border bg-olu-surface text-left hover:bg-olu-card transition-colors"
          >
            <div className={`h-36 bg-gradient-to-br ${course.hero} p-5`}>
              <p className="text-xs uppercase tracking-[0.16em] text-black/60">{course.instructor}</p>
              <h2 className="font-black text-2xl text-black mt-3">{course.title}</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-olu-muted">{course.subtitle}</p>
              <p className="font-black text-xl mt-4">${course.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
