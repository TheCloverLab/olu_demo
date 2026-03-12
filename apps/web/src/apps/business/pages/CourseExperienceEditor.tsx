import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Loader2, BookOpen, ChevronRight,
  GripVertical, Pencil, Trash2, Play, FileText, Upload,
  ChevronDown, Save, X, ImagePlus,
} from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../../lib/supabase'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { getExperience, deleteExperience, updateExperience } from '../../../domain/experience/api'
import {
  listCourses, createCourse, updateCourse, deleteCourse,
  createChapter, updateChapter, deleteChapter,
  createLesson, updateLesson, deleteLesson,
  getCourseTree,
} from '../../../domain/experience/course-api'
import type { CourseTree } from '../../../domain/experience/course-api'
import type {
  WorkspaceExperience, ExperienceCourse,
  ExperienceCourseChapter, ExperienceCourseLesson,
} from '../../../lib/supabase'

// ── Course Card ─────────────────────────────────────────────────

function CourseCard({
  course: c,
  onSelect,
  onCoverUpdated,
}: {
  course: ExperienceCourse
  onSelect: () => void
  onCoverUpdated: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation()
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setPreview(URL.createObjectURL(file))
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `courses/${c.id}/cover-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      await updateCourse(c.id, { cover: coverUrl })
      onCoverUpdated()
    } catch (err) {
      console.error('Failed to upload course cover', err)
    } finally {
      setUploading(false)
    }
  }

  const coverSrc = preview || c.cover

  return (
    <div
      className="rounded-2xl border border-[var(--olu-card-border)] bg-[var(--olu-section-bg)] overflow-hidden text-left hover:border-cyan-300/30 transition-colors group"
    >
      <div className="relative h-28 cursor-pointer" onClick={onSelect}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <BookOpen size={32} className="text-[var(--olu-muted)]" />
          </div>
        )}
        <label
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <ImagePlus size={12} />
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </label>
        {uploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
      </div>
      <button onClick={onSelect} className="w-full p-4 space-y-1 text-left">
        <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{c.name}</h3>
        {c.description && (
          <p className="text-xs text-[var(--olu-text-secondary)] line-clamp-2">{c.description}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className={clsx(
            'text-[10px] px-2 py-0.5 rounded-full font-medium',
            c.status === 'published' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
          )}>
            {c.status}
          </span>
        </div>
      </button>
    </div>
  )
}

// ── Course List View ─────────────────────────────────────────────

function CourseListView({
  experience,
  courses,
  onSelect,
  onCreated,
  onDeleteExperience,
  onCoverUpdated,
}: {
  experience: WorkspaceExperience
  courses: ExperienceCourse[]
  onSelect: (id: string) => void
  onCreated: () => void
  onDeleteExperience: () => void
  onCoverUpdated: () => void
}) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [savingCover, setSavingCover] = useState(false)
  const coverSrc = coverFile ? URL.createObjectURL(coverFile) : experience.cover

  async function handleCoverUpload(file: File) {
    setCoverFile(file)
    setSavingCover(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `experiences/${experience.id}/cover-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      await updateExperience(experience.id, { cover: coverUrl })
      onCoverUpdated()
    } catch (err) {
      console.error('Failed to upload cover', err)
    } finally {
      setSavingCover(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createCourse(experience.id, newName.trim())
      setNewName('')
      onCreated()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/business/experiences')}
            className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[var(--olu-muted)] text-xs">Courses</p>
            <h1 className="font-bold text-lg">{experience.name}</h1>
          </div>
        </div>
        <button
          onClick={onDeleteExperience}
          className="p-2 rounded-xl hover:bg-red-500/10 transition-colors text-[var(--olu-muted)] hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">Cover Image</label>
        {coverSrc ? (
          <div className="relative rounded-xl overflow-hidden border border-[var(--olu-card-border)]">
            <img src={coverSrc} alt="Cover" className="w-full h-40 object-cover" />
            <label className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer">
              <ImagePlus size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} />
            </label>
            {savingCover && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] cursor-pointer hover:border-cyan-500/30 transition-colors">
            <ImagePlus size={24} className="text-[var(--olu-muted)] mb-2" />
            <span className="text-xs text-[var(--olu-muted)]">Click to upload cover image</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} />
          </label>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} onSelect={() => onSelect(c.id)} onCoverUpdated={onCoverUpdated} />
        ))}

        {/* Add course card */}
        <div className="rounded-2xl border border-dashed border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          {newName !== '' ? (
            <div className="space-y-3 w-full">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Course name"
                autoFocus
                className="w-full bg-[var(--olu-section-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="flex-1 px-3 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setNewName('')}
                  className="px-3 py-2 rounded-xl bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNewName(' ')}
              className="flex flex-col items-center gap-2 text-[var(--olu-muted)] hover:text-[var(--olu-text)] transition-colors"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">Add course</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Course Detail Editor ─────────────────────────────────────────

function LessonRow({
  lesson,
  onUpdate,
  onDelete,
  selected,
  onSelect,
}: {
  lesson: ExperienceCourseLesson
  onUpdate: (updates: Partial<Pick<ExperienceCourseLesson, 'title' | 'content' | 'video_url'>>) => void
  onDelete: () => void
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm',
        selected
          ? 'bg-cyan-300/10 border border-cyan-300/30'
          : 'hover:bg-[var(--olu-card-hover)]'
      )}
    >
      <GripVertical size={12} className="text-[var(--olu-muted)] flex-shrink-0 cursor-grab" />
      <div className="w-6 h-6 rounded-md bg-[var(--olu-card-bg)] flex items-center justify-center flex-shrink-0">
        {lesson.video_url ? <Play size={10} /> : <FileText size={10} />}
      </div>
      <span className="truncate flex-1">{lesson.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={10} className="text-[var(--olu-muted)]" />
      </button>
    </button>
  )
}

function ChapterSection({
  chapter,
  lessons,
  selectedLessonId,
  onSelectLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddLesson,
  onUpdateChapter,
  onDeleteChapter,
}: {
  chapter: ExperienceCourseChapter
  lessons: ExperienceCourseLesson[]
  selectedLessonId: string | null
  onSelectLesson: (id: string) => void
  onUpdateLesson: (id: string, u: Partial<Pick<ExperienceCourseLesson, 'title' | 'content' | 'video_url'>>) => void
  onDeleteLesson: (id: string) => void
  onAddLesson: () => void
  onUpdateChapter: (u: Partial<Pick<ExperienceCourseChapter, 'title'>>) => void
  onDeleteChapter: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(chapter.title)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 group">
        <button onClick={() => setCollapsed(!collapsed)} className="p-1">
          <ChevronDown size={14} className={clsx('transition-transform text-[var(--olu-muted)]', collapsed && '-rotate-90')} />
        </button>
        <GripVertical size={12} className="text-[var(--olu-muted)] cursor-grab" />
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { onUpdateChapter({ title }); setEditing(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateChapter({ title }); setEditing(false) } }}
            autoFocus
            className="flex-1 bg-transparent border-b border-cyan-300/30 text-sm font-semibold focus:outline-none px-1"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold cursor-pointer hover:text-cyan-400"
            onClick={() => setEditing(true)}
          >
            {chapter.title}
          </span>
        )}
        <button onClick={onAddLesson} className="p-1 rounded hover:bg-[var(--olu-card-hover)] opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus size={12} />
        </button>
        <button onClick={onDeleteChapter} className="p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={12} className="text-[var(--olu-muted)]" />
        </button>
      </div>
      {!collapsed && (
        <div className="ml-6 space-y-0.5">
          {lessons.map((l) => (
            <LessonRow
              key={l.id}
              lesson={l}
              selected={selectedLessonId === l.id}
              onSelect={() => onSelectLesson(l.id)}
              onUpdate={(u) => onUpdateLesson(l.id, u)}
              onDelete={() => onDeleteLesson(l.id)}
            />
          ))}
          {lessons.length === 0 && (
            <p className="text-xs text-[var(--olu-muted)] pl-3 py-2">No lessons yet</p>
          )}
        </div>
      )}
    </div>
  )
}

function LessonDetailPanel({
  lesson,
  onUpdate,
}: {
  lesson: ExperienceCourseLesson
  onUpdate: (u: Partial<Pick<ExperienceCourseLesson, 'title' | 'content' | 'video_url'>>) => void
}) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content || '')
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setTitle(lesson.title)
    setContent(lesson.content || '')
    setVideoUrl(lesson.video_url || '')
    setDirty(false)
  }, [lesson.id])

  function handleSave() {
    onUpdate({ title, content: content || null, video_url: videoUrl || null })
    setDirty(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--olu-muted)]">Lesson</p>
          <h2 className="font-bold text-lg">{lesson.title}</h2>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-300 text-[#04111f] text-sm font-semibold hover:bg-cyan-200"
          >
            <Save size={14} /> Save
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
          className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
        />
      </div>

      {/* Video */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">Video URL</label>
        {videoUrl ? (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => { setVideoUrl(''); setDirty(true) }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove video
            </button>
          </div>
        ) : (
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => { setVideoUrl(e.target.value); setDirty(true) }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/30"
          />
        )}
      </div>

      {/* File Attachments (placeholder) */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">File attachments</label>
        <div className="rounded-xl border border-dashed border-[var(--olu-card-border)] p-4 flex items-center justify-center">
          <label className="flex items-center gap-2 text-sm text-[var(--olu-muted)] cursor-pointer hover:text-[var(--olu-text)]">
            <Upload size={14} /> Upload attachment
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-xs text-[var(--olu-text-secondary)]">Content</label>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setDirty(true) }}
          rows={12}
          placeholder="Write lesson content here..."
          className="w-full bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-cyan-500/30 resize-y"
        />
      </div>
    </div>
  )
}

function CourseDetailView({
  courseId,
  onBack,
}: {
  courseId: string
  onBack: () => void
}) {
  const [tree, setTree] = useState<CourseTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [courseName, setCourseName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  async function handleCourseCoverUpload(file: File) {
    setSavingCover(true)
    setCoverPreview(URL.createObjectURL(file))
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `courses/${courseId}/cover-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      await updateCourse(courseId, { cover: coverUrl })
      reload()
    } catch (err) {
      console.error('Failed to upload course cover', err)
    } finally {
      setSavingCover(false)
    }
  }

  function reload() {
    getCourseTree(courseId)
      .then((t) => {
        if (t) {
          setTree(t)
          setCourseName(t.name)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [courseId])

  const selectedLesson = tree?.chapters
    .flatMap((ch) => ch.lessons)
    .find((l) => l.id === selectedLessonId)

  async function handleAddChapter() {
    await createChapter(courseId, `Chapter ${(tree?.chapters.length ?? 0) + 1}`)
    reload()
  }

  async function handleDeleteChapter(chapterId: string) {
    await deleteChapter(chapterId)
    reload()
  }

  async function handleAddLesson(chapterId: string) {
    const ch = tree?.chapters.find((c) => c.id === chapterId)
    const lesson = await createLesson(chapterId, `Lesson ${(ch?.lessons.length ?? 0) + 1}`)
    reload()
    setSelectedLessonId(lesson.id)
  }

  async function handleUpdateLesson(lessonId: string, updates: Partial<Pick<ExperienceCourseLesson, 'title' | 'content' | 'video_url'>>) {
    await updateLesson(lessonId, updates)
    reload()
  }

  async function handleDeleteLesson(lessonId: string) {
    if (selectedLessonId === lessonId) setSelectedLessonId(null)
    await deleteLesson(lessonId)
    reload()
  }

  async function handleDeleteCourse() {
    await deleteCourse(courseId)
    onBack()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!tree) return null

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Cover */}
      {(() => {
        const src = coverPreview || tree.cover
        return src ? (
          <div className="relative h-36 border-b border-[var(--olu-card-border)]">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <label className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer">
              <ImagePlus size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCourseCoverUpload(f) }} />
            </label>
            {savingCover && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 h-20 border-b border-dashed border-[var(--olu-card-border)] bg-[var(--olu-card-bg)] cursor-pointer hover:border-cyan-500/30 transition-colors text-[var(--olu-muted)] text-xs">
            <ImagePlus size={16} />
            Add course cover
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCourseCoverUpload(f) }} />
          </label>
        )
      })()}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--olu-card-border)]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-[var(--olu-card-hover)]">
            <ArrowLeft size={18} />
          </button>
          {editingName ? (
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              onBlur={() => { updateCourse(courseId, { name: courseName }); setEditingName(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { updateCourse(courseId, { name: courseName }); setEditingName(false) } }}
              autoFocus
              className="bg-transparent border-b border-cyan-300/30 font-bold text-lg focus:outline-none"
            />
          ) : (
            <h1
              className="font-bold text-lg cursor-pointer hover:text-cyan-400"
              onClick={() => setEditingName(true)}
            >
              {tree.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tree.status}
            onChange={(e) => { updateCourse(courseId, { status: e.target.value as ExperienceCourse['status'] }); reload() }}
            className="bg-[var(--olu-card-bg)] border border-[var(--olu-card-border)] rounded-xl px-3 py-1.5 text-xs"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleDeleteCourse}
            className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--olu-muted)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Body — two column */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — chapter/lesson tree */}
        <div className="w-72 border-r border-[var(--olu-card-border)] overflow-y-auto p-4 space-y-3 flex-shrink-0">
          {tree.chapters.map((ch) => (
            <ChapterSection
              key={ch.id}
              chapter={ch}
              lessons={ch.lessons}
              selectedLessonId={selectedLessonId}
              onSelectLesson={setSelectedLessonId}
              onUpdateLesson={handleUpdateLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddLesson={() => handleAddLesson(ch.id)}
              onUpdateChapter={(u) => { updateChapter(ch.id, u); reload() }}
              onDeleteChapter={() => handleDeleteChapter(ch.id)}
            />
          ))}
          <button
            onClick={handleAddChapter}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--olu-muted)] hover:text-[var(--olu-text)] hover:bg-[var(--olu-card-hover)] transition-colors"
          >
            <Plus size={14} /> Add new chapter
          </button>
        </div>

        {/* Right panel — lesson detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedLesson ? (
            <LessonDetailPanel
              key={selectedLesson.id}
              lesson={selectedLesson}
              onUpdate={(u) => handleUpdateLesson(selectedLesson.id, u)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--olu-muted)] gap-3">
              <BookOpen size={32} />
              <p className="text-sm">Select a lesson to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function CourseExperienceEditor() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const experienceId = params.get('id')

  const [exp, setExp] = useState<WorkspaceExperience | null>(null)
  const [courses, setCourses] = useState<ExperienceCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  function reload() {
    if (!experienceId) return
    Promise.all([
      getExperience(experienceId),
      listCourses(experienceId),
    ]).then(([e, c]) => {
      setExp(e)
      setCourses(c)
    }).finally(() => setLoading(false))
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleDeleteExperience() {
    if (!exp) return
    try {
      await deleteExperience(exp.id)
      navigate('/business/experiences')
    } catch (err) {
      console.error('Failed to delete experience', err)
    }
  }

  useEffect(() => { reload() }, [experienceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--olu-text-secondary)]" size={24} />
      </div>
    )
  }

  if (!exp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-[var(--olu-muted)]">Experience not found.</p>
      </div>
    )
  }

  if (selectedCourseId) {
    return (
      <CourseDetailView
        courseId={selectedCourseId}
        onBack={() => { setSelectedCourseId(null); reload() }}
      />
    )
  }

  return (
    <>
      <CourseListView
        experience={exp}
        courses={courses}
        onSelect={setSelectedCourseId}
        onCreated={reload}
        onDeleteExperience={() => setShowDeleteConfirm(true)}
        onCoverUpdated={reload}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete experience"
        message={`Delete "${exp.name}"? This cannot be undone.`}
        onConfirm={() => { setShowDeleteConfirm(false); handleDeleteExperience() }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
