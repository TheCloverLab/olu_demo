import { BookOpen, Clock3, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { COURSE_LIBRARY } from '../courseData'

export default function LearningHub() {
  const navigate = useNavigate()
  const { consumerExperience } = useApp()
  const { learning } = consumerExperience.courses

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
        {COURSE_LIBRARY.map((course) => (
          <div key={course.id} className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{course.title}</p>
                <p className="text-xs text-olu-muted mt-1">{course.instructor}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-300">{course.stats.completionRate}</span>
            </div>
            <div className="rounded-full h-2 bg-white/10 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: course.stats.completionRate }} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 size={14} className="text-amber-300" />
                  <p className="text-xs text-olu-muted">Next lesson</p>
                </div>
                <p className="font-semibold text-sm mt-2">{course.sections[1]?.title || course.sections[0]?.title}</p>
              </div>
              <button
                onClick={() => navigate(`/learn/${course.slug}/${course.sections[0]?.id}`)}
                className="rounded-2xl bg-white text-black p-4 text-left hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle size={14} />
                  <p className="text-xs">Continue</p>
                </div>
                <p className="font-semibold text-sm mt-2">Resume learning</p>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
