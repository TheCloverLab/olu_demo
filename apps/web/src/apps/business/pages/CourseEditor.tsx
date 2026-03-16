import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronDown, ChevronUp, GraduationCap, Grip, Layers, Play, Plus, Save, Trash2, Video, FileText, HelpCircle, ClipboardList, X, Eye,
} from 'lucide-react'
import clsx from 'clsx'

type LessonType = 'video' | 'article' | 'quiz' | 'assignment'

interface EditorLesson {
  id: string
  title: string
  type: LessonType
  duration: string
  preview: boolean
  summary: string
}

interface EditorModule {
  id: string
  title: string
  description: string
  lessons: EditorLesson[]
  collapsed: boolean
}

interface EditorCourse {
  title: string
  description: string
  price: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  hero: string
  modules: EditorModule[]
}

const HERO_GRADIENTS = [
  'from-rose-600 via-fuchsia-600 to-orange-500',
  'from-sky-600 via-cyan-500 to-emerald-400',
  'from-violet-600 via-purple-600 to-indigo-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-600 via-teal-500 to-cyan-400',
  'from-pink-600 via-fuchsia-500 to-purple-500',
]

const LESSON_TYPE_ICONS: Record<LessonType, typeof Video> = {
  video: Video,
  article: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
}

let nextId = 1
function genId() { return `new-${nextId++}` }

const DEFAULT_COURSE: EditorCourse = {
  title: '',
  description: '',
  price: 49,
  level: 'Beginner',
  hero: HERO_GRADIENTS[0],
  modules: [
    {
      id: genId(),
      title: 'Getting Started',
      description: 'Introduction and setup',
      collapsed: false,
      lessons: [
        { id: genId(), title: 'Welcome & Overview', type: 'video', duration: '10 min', preview: true, summary: 'Course overview and what you will learn.' },
        { id: genId(), title: 'Setting Up Your Environment', type: 'article', duration: '15 min', preview: false, summary: 'Install tools and configure your workspace.' },
      ],
    },
    {
      id: genId(),
      title: 'Core Concepts',
      description: 'Fundamentals and theory',
      collapsed: false,
      lessons: [
        { id: genId(), title: 'Key Principles', type: 'video', duration: '20 min', preview: false, summary: 'The foundational principles you need to understand.' },
        { id: genId(), title: 'Knowledge Check', type: 'quiz', duration: '5 min', preview: false, summary: 'Test your understanding of core concepts.' },
      ],
    },
    {
      id: genId(),
      title: 'Hands-On Project',
      description: 'Apply what you learned',
      collapsed: false,
      lessons: [
        { id: genId(), title: 'Project Brief', type: 'article', duration: '5 min', preview: false, summary: 'Your project assignment and requirements.' },
        { id: genId(), title: 'Build & Submit', type: 'assignment', duration: '60 min', preview: false, summary: 'Complete the project and submit for review.' },
      ],
    },
  ],
}

export default function CourseEditor() {
  const { t } = useTranslation()
  const [course, setCourse] = useState<EditorCourse>(DEFAULT_COURSE)
  const [previewOpen, setPreviewOpen] = useState(false)

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (parseInt(l.duration) || 0), 0),
    0,
  )

  function updateModule(moduleId: string, updates: Partial<EditorModule>) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => m.id === moduleId ? { ...m, ...updates } : m),
    }))
  }

  function addModule() {
    setCourse((prev) => ({
      ...prev,
      modules: [...prev.modules, {
        id: genId(),
        title: `Module ${prev.modules.length + 1}`,
        description: '',
        collapsed: false,
        lessons: [],
      }],
    }))
  }

  function removeModule(moduleId: string) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== moduleId),
    }))
  }

  function moveModule(moduleId: string, direction: -1 | 1) {
    setCourse((prev) => {
      const idx = prev.modules.findIndex((m) => m.id === moduleId)
      if (idx < 0) return prev
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= prev.modules.length) return prev
      const modules = [...prev.modules]
      ;[modules[idx], modules[newIdx]] = [modules[newIdx], modules[idx]]
      return { ...prev, modules }
    })
  }

  function addLesson(moduleId: string) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, { id: genId(), title: 'New Lesson', type: 'video' as LessonType, duration: '10 min', preview: false, summary: '' }] }
          : m
      ),
    }))
  }

  function updateLesson(moduleId: string, lessonId: string, updates: Partial<EditorLesson>) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...updates } : l) }
          : m
      ),
    }))
  }

  function removeLesson(moduleId: string, lessonId: string) {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      ),
    }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
          <GraduationCap size={18} />
        </div>
        <div className="flex-1">
          <h1 className="font-black text-2xl">{t('consumer.createCourse')}</h1>
          <p className="text-olu-muted text-sm">{totalLessons} {t('consumer.lessons')} &middot; {totalDuration} min</p>
        </div>
        <button
          onClick={() => setPreviewOpen(true)}
          className="px-4 py-2 rounded-xl border border-olu-border text-sm font-medium text-olu-muted hover:text-olu-text transition-colors flex items-center gap-1.5"
        >
          <Eye size={14} />
          {t('creatorStudio.preview')}
        </button>
        <button className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Save size={14} />
          {t('consumer.saveCourse')}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr,0.4fr] gap-4">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Course info */}
          <div className="rounded-2xl border border-olu-border bg-olu-surface p-5">
            <h2 className="font-bold text-sm mb-4">{t('consumer.editCourse')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-olu-muted mb-1.5">{t('consumer.courseTitle')}</label>
                <input
                  value={course.title}
                  onChange={(e) => setCourse((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('business.courseEditorNamePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-olu-border text-sm placeholder:text-olu-muted focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-olu-muted mb-1.5">{t('consumer.courseDescription')}</label>
                <textarea
                  value={course.description}
                  onChange={(e) => setCourse((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('business.courseEditorDescPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-olu-border text-sm placeholder:text-olu-muted focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-olu-muted mb-1.5">{t('consumer.price')}</label>
                  <input
                    type="number"
                    value={course.price}
                    onChange={(e) => setCourse((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-olu-border text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-olu-muted mb-1.5">{t('common.level')}</label>
                  <select
                    value={course.level}
                    onChange={(e) => setCourse((prev) => ({ ...prev, level: e.target.value as EditorCourse['level'] }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--olu-card-bg)] border border-olu-border text-sm focus:outline-none appearance-none"
                  >
                    <option value="Beginner">{t('common.beginner')}</option>
                    <option value="Intermediate">{t('common.intermediate')}</option>
                    <option value="Advanced">{t('common.advanced')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-olu-muted mb-1.5">{t('common.hero')}</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {HERO_GRADIENTS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setCourse((prev) => ({ ...prev, hero: g }))}
                        className={clsx(
                          'w-7 h-7 rounded-lg bg-gradient-to-br transition-all',
                          g,
                          course.hero === g ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--olu-bg)]' : 'opacity-60 hover:opacity-100',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          {course.modules.map((mod, modIdx) => (
            <div key={mod.id} className="rounded-2xl border border-olu-border bg-olu-surface overflow-hidden">
              {/* Module header */}
              <div className="p-4 flex items-center gap-3">
                <Grip size={14} className="text-olu-muted cursor-grab" />
                <Layers size={14} className="text-sky-400" />
                <div className="flex-1">
                  <input
                    value={mod.title}
                    onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                    className="bg-transparent font-semibold text-sm focus:outline-none w-full"
                  />
                  <input
                    value={mod.description}
                    onChange={(e) => updateModule(mod.id, { description: e.target.value })}
                    placeholder={t('business.moduleDescPlaceholder')}
                    className="bg-transparent text-xs text-olu-muted focus:outline-none w-full mt-0.5"
                  />
                </div>
                <span className="text-xs text-olu-muted">{mod.lessons.length} {t('consumer.lessons').toLowerCase()}</span>
                <button onClick={() => moveModule(mod.id, -1)} disabled={modIdx === 0} className="p-1 rounded hover:bg-[var(--olu-card-hover)] disabled:opacity-20">
                  <ChevronUp size={14} className="text-olu-muted" />
                </button>
                <button onClick={() => moveModule(mod.id, 1)} disabled={modIdx === course.modules.length - 1} className="p-1 rounded hover:bg-[var(--olu-card-hover)] disabled:opacity-20">
                  <ChevronDown size={14} className="text-olu-muted" />
                </button>
                <button
                  onClick={() => updateModule(mod.id, { collapsed: !mod.collapsed })}
                  className="p-1 rounded hover:bg-[var(--olu-card-hover)]"
                >
                  {mod.collapsed ? <ChevronDown size={14} className="text-olu-muted" /> : <ChevronUp size={14} className="text-olu-muted" />}
                </button>
                <button onClick={() => removeModule(mod.id)} className="p-1 rounded hover:bg-red-500/10">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>

              {/* Lessons */}
              <AnimatePresence>
                {!mod.collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-olu-border">
                      {mod.lessons.map((lesson) => {
                        const LessonIcon = LESSON_TYPE_ICONS[lesson.type]
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-b border-olu-border last:border-b-0 hover:bg-[var(--olu-card-hover)] transition-colors">
                            <LessonIcon size={14} className="text-olu-muted flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <input
                                value={lesson.title}
                                onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                                className="bg-transparent text-sm font-medium focus:outline-none w-full"
                              />
                              <input
                                value={lesson.summary}
                                onChange={(e) => updateLesson(mod.id, lesson.id, { summary: e.target.value })}
                                placeholder={t('business.lessonSummaryPlaceholder')}
                                className="bg-transparent text-xs text-olu-muted focus:outline-none w-full mt-0.5"
                              />
                            </div>
                            <select
                              value={lesson.type}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { type: e.target.value as LessonType })}
                              className="bg-[var(--olu-card-bg)] text-xs rounded-lg px-2 py-1 border border-olu-border focus:outline-none appearance-none"
                            >
                              <option value="video">{t('consumer.video')}</option>
                              <option value="article">{t('consumer.article')}</option>
                              <option value="quiz">{t('consumer.quiz')}</option>
                              <option value="assignment">{t('consumer.assignment')}</option>
                            </select>
                            <input
                              value={lesson.duration}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { duration: e.target.value })}
                              className="w-16 bg-[var(--olu-card-bg)] text-xs rounded-lg px-2 py-1 border border-olu-border focus:outline-none text-center"
                            />
                            <button
                              onClick={() => updateLesson(mod.id, lesson.id, { preview: !lesson.preview })}
                              className={clsx(
                                'text-xs px-2 py-1 rounded-lg transition-all',
                                lesson.preview ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--olu-card-bg)] text-olu-muted',
                              )}
                            >
                              {lesson.preview ? <Eye size={12} /> : <Play size={12} />}
                            </button>
                            <button onClick={() => removeLesson(mod.id, lesson.id)} className="p-1 rounded hover:bg-red-500/10">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        )
                      })}
                      <button
                        onClick={() => addLesson(mod.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-olu-muted hover:text-olu-text hover:bg-[var(--olu-card-hover)] transition-colors"
                      >
                        <Plus size={12} />
                        {t('consumer.addLesson')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <button
            onClick={addModule}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-400 dark:border-olu-border text-olu-muted hover:text-olu-text hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('consumer.addModule')}
          </button>
        </div>

        {/* Sidebar - Course card preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-olu-border bg-olu-surface overflow-hidden sticky top-4">
            <div className={`h-32 bg-gradient-to-br ${course.hero} p-4 flex items-end`}>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-black/60">{course.level}</p>
                <h3 className="font-black text-lg text-black mt-1">{course.title || 'Course Title'}</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-olu-muted line-clamp-2">{course.description || 'Course description goes here...'}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[var(--olu-card-bg)] p-2 text-center">
                  <p className="font-black text-lg">{totalLessons}</p>
                  <p className="text-[10px] text-olu-muted">{t('consumer.lessons')}</p>
                </div>
                <div className="rounded-xl bg-[var(--olu-card-bg)] p-2 text-center">
                  <p className="font-black text-lg">{course.modules.length}</p>
                  <p className="text-[10px] text-olu-muted">{t('consumer.modules')}</p>
                </div>
                <div className="rounded-xl bg-[var(--olu-card-bg)] p-2 text-center">
                  <p className="font-black text-lg">${course.price}</p>
                  <p className="text-[10px] text-olu-muted">{t('consumer.price')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold">{t('consumer.modules')}</p>
                {course.modules.map((mod, i) => (
                  <div key={mod.id} className="flex items-center gap-2 text-xs text-olu-muted">
                    <span className="w-5 h-5 rounded-md bg-[var(--olu-card-bg)] flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                    <span className="flex-1 truncate">{mod.title}</span>
                    <span>{mod.lessons.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border border-olu-border bg-olu-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-olu-border sticky top-0 bg-olu-surface z-10">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-sky-400" />
                  <span className="font-semibold text-sm">{t('creatorStudio.livePreview')}</span>
                </div>
                <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg hover:bg-[var(--olu-card-hover)]">
                  <X size={16} className="text-olu-muted" />
                </button>
              </div>

              {/* Preview content */}
              <div className={`h-48 bg-gradient-to-br ${course.hero} p-6 flex items-end`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-black/60">{course.level}</p>
                  <h1 className="font-black text-3xl text-black mt-2">{course.title || 'Course Title'}</h1>
                  <p className="text-sm text-black/70 mt-2">{course.description}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {course.modules.map((mod, modIdx) => (
                  <div key={mod.id} className="rounded-xl border border-olu-border">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-300 flex items-center justify-center text-sm font-bold">
                        {modIdx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{mod.title}</p>
                        <p className="text-xs text-olu-muted">{mod.lessons.length} {t('consumer.lessons').toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="border-t border-olu-border">
                      {mod.lessons.map((lesson) => {
                        const LessonIcon = LESSON_TYPE_ICONS[lesson.type]
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-b border-olu-border last:border-b-0">
                            <LessonIcon size={14} className="text-olu-muted" />
                            <span className="flex-1 text-sm">{lesson.title}</span>
                            <span className="text-xs text-olu-muted">{lesson.duration}</span>
                            {lesson.preview && (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">{t('consumer.preview')}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
