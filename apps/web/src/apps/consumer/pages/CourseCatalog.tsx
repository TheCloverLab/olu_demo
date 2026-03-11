import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import type { Course } from '../courseData'
import { getCourseSnapshotBySlug } from '../../../domain/consumer/api'
import { hasPurchasedCourse } from '../../../domain/consumer/engagement'

export default function CourseCatalog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { courseSlug } = useParams()
  const { consumerConfig, consumerExperience } = useApp()
  const { user } = useAuth()
  const { catalog } = consumerExperience.courses
  const [course, setCourse] = useState<Course | null | undefined>(undefined)
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      if (!courseSlug) return
      const data = await getCourseSnapshotBySlug(courseSlug, consumerConfig.featured_course_slug)
      if (!cancelled) {
        setCourse(data)
        if (data) {
          const enrolled = await hasPurchasedCourse(user as any, data)
          setPurchased(enrolled)
        }
      }
    }

    loadCourse()
    return () => {
      cancelled = true
    }
  }, [courseSlug])

  if (course === undefined) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">{t('consumer.loadingCourse')}</div>
  }

  if (!course) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">{t('consumer.courseNotFound')}</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <h1 className="font-black text-2xl mb-2">{course.title}</h1>
      <p className="text-olu-muted text-sm mb-6">{catalog.subtitle}</p>
      <div className="space-y-3">
        {course.sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => navigate(section.preview || purchased ? `/learn/${course.slug}/${section.id}` : `/checkout/${course.slug}`)}
            className="w-full rounded-[24px] border border-olu-border bg-olu-surface p-5 text-left hover:bg-olu-card transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-olu-muted mb-1">{t('consumer.lesson', { n: index + 1 })}</p>
                <p className="font-semibold text-lg">{section.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{section.duration}</p>
                <p className="text-xs text-olu-muted">{section.preview ? t('consumer.preview') : t('consumer.lockedAfterPurchase')}</p>
              </div>
            </div>
            <p className="text-sm text-olu-muted mt-3">{section.summary}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
