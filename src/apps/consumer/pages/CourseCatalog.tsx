import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { getCourseBySlug } from '../courseData'

export default function CourseCatalog() {
  const navigate = useNavigate()
  const { courseSlug } = useParams()
  const { consumerExperience } = useApp()
  const { catalog } = consumerExperience.courses
  const course = getCourseBySlug(courseSlug || '')

  if (!course) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Course not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <h1 className="font-black text-2xl mb-2">{course.title}</h1>
      <p className="text-olu-muted text-sm mb-6">{catalog.subtitle}</p>
      <div className="space-y-3">
        {course.sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => navigate(`/learn/${course.slug}/${section.id}`)}
            className="w-full rounded-[24px] border border-white/10 bg-[#111111] p-5 text-left hover:bg-[#151515] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-olu-muted mb-1">Lesson {index + 1}</p>
                <p className="font-semibold text-lg">{section.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{section.duration}</p>
                <p className="text-xs text-olu-muted">{section.preview ? 'Preview' : 'Locked after purchase'}</p>
              </div>
            </div>
            <p className="text-sm text-white/72 mt-3">{section.summary}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
