import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import type { Course } from '../courseData'
import { getCourseSnapshotBySlug } from '../../../domain/consumer/api'

export default function Learn() {
  const navigate = useNavigate()
  const { courseSlug, sectionId } = useParams()
  const { consumerExperience } = useApp()
  const { detail } = consumerExperience.courses
  const [course, setCourse] = useState<Course | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      if (!courseSlug) return
      const data = await getCourseSnapshotBySlug(courseSlug)
      if (!cancelled) {
        setCourse(data)
      }
    }

    loadCourse()
    return () => {
      cancelled = true
    }
  }, [courseSlug])

  const section = course?.sections.find((item) => item.id === sectionId)

  if (course === undefined) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Loading lesson...</div>
  }

  if (!course || !section) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Lesson not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <button onClick={() => navigate(`/courses/${course.slug}/catalog`)} className="inline-flex items-center gap-2 text-sm text-olu-muted hover:text-white transition-colors mb-5">
        <ChevronLeft size={15} />
        {detail.catalogLabel}
      </button>
      <div className="grid lg:grid-cols-[1.15fr,0.85fr] gap-4">
        <div className="rounded-[28px] border border-white/10 bg-[#111111] overflow-hidden">
          <div className={`h-64 bg-gradient-to-br ${course.hero} p-6 flex items-end`}>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/60 mb-2">{course.title}</p>
              <h1 className="font-black text-3xl text-black">{section.title}</h1>
            </div>
          </div>
          <div className="p-6">
            <p className="text-white/78 leading-relaxed">{section.summary}</p>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mt-5">
              <p className="text-sm text-olu-muted">Learning surface placeholder</p>
              <p className="font-semibold mt-1">This is where the video / audio / article lesson player goes.</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-sky-300" />
            <p className="font-semibold">{consumerExperience.courses.learning.title}</p>
          </div>
          <div className="space-y-3">
            {course.sections.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/learn/${course.slug}/${item.id}`)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-olu-muted mt-1">{item.duration}</p>
                  </div>
                  {item.id === section.id && <CheckCircle2 size={16} className="text-emerald-300" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
