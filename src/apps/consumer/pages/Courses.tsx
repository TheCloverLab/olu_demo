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
        <div className={`rounded-[28px] p-6 md:p-8 bg-gradient-to-br ${selected.hero}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-xs text-black/70 mb-4">
            <GraduationCap size={13} />
            {selected.level}
          </div>
          <h1 className="font-black text-4xl leading-tight text-black max-w-2xl">{selected.title}</h1>
          <p className="text-black/70 text-base mt-3 max-w-2xl">{selected.subtitle}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-black/10 p-4">
              <p className="font-black text-2xl text-black">{selected.stats.lessons}</p>
              <p className="text-xs text-black/65 mt-1">Lessons</p>
            </div>
            <div className="rounded-2xl bg-black/10 p-4">
              <p className="font-black text-2xl text-black">{selected.stats.students}</p>
              <p className="text-xs text-black/65 mt-1">Students</p>
            </div>
            <div className="rounded-2xl bg-black/10 p-4">
              <p className="font-black text-2xl text-black">${selected.price}</p>
              <p className="text-xs text-black/65 mt-1">Price</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4 mt-6">
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-bold text-xl mb-3">{courses.detail.learnTitle}</h2>
            <div className="space-y-3">
              {selected.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-white/78">
                  {outcome}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <h2 className="font-bold text-xl mb-3">{courses.detail.actionsTitle}</h2>
            <div className="space-y-3">
              <button onClick={() => navigate(`/courses/${selected.slug}/catalog`)} className="w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity">
                {courses.detail.catalogLabel}
              </button>
              <button
                onClick={() => navigate(purchased ? `/learn/${selected.slug}/${selected.sections[0]?.id}` : `/checkout/${selected.slug}`)}
                className="w-full py-3 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 transition-colors"
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
            className="rounded-[24px] overflow-hidden border border-white/10 bg-[#111111] text-left hover:bg-[#151515] transition-colors"
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
