import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  Pause,
  Archive,
  Users,
  ListTodo,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { listProjects, createProject, listTasks } from '../../../domain/project/api'
import type { Project, ProjectTask, ProjectType } from '../../../domain/project/types'

const STATUS_ICON = {
  active: Clock,
  paused: Pause,
  archived: Archive,
  completed: CheckCircle2,
} as const

const STATUS_COLOR = {
  active: 'text-green-500 bg-green-50 dark:bg-green-950/30',
  paused: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  archived: 'text-gray-400 bg-gray-50 dark:bg-gray-800/50',
  completed: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
} as const

export default function ProjectList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspace, currentUser } = useApp()
  const [projects, setProjects] = useState<Project[]>([])
  const [taskCounts, setTaskCounts] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<ProjectType>('short_term')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!workspace) return
    loadProjects()
  }, [workspace])

  async function loadProjects() {
    if (!workspace) return
    setLoading(true)
    try {
      const data = await listProjects(workspace.id)
      setProjects(data)
      // Load task counts for each project
      const counts: Record<string, Record<string, number>> = {}
      await Promise.all(data.map(async (p) => {
        try {
          const tasks = await listTasks(p.id)
          counts[p.id] = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        } catch {
          counts[p.id] = {}
        }
      }))
      setTaskCounts(counts)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!workspace || !currentUser || !newName.trim()) return
    setCreating(true)
    try {
      const project = await createProject(workspace.id, currentUser.id, newName.trim(), {
        description: newDesc.trim() || undefined,
        type: newType,
      })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      navigate(`/business/projects/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setCreating(false)
    }
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const otherProjects = projects.filter((p) => p.status !== 'active')

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--olu-text)]">
            {t('projects.title', 'Projects')}
          </h1>
          <p className="text-sm text-[var(--olu-text-secondary)] mt-1">
            {t('projects.subtitle', 'Manage your AI-powered projects')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t('projects.newProject', 'New Project')}
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--olu-surface)] border border-[var(--olu-border)] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-[var(--olu-text)]">
              {t('projects.createTitle', 'Create Project')}
            </h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('projects.namePlaceholder', 'Project name...')}
              className="w-full px-4 py-2 bg-[var(--olu-bg)] border border-[var(--olu-border)] rounded-lg text-[var(--olu-text)] placeholder:text-[var(--olu-text-secondary)]"
              autoFocus
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t('projects.descPlaceholder', 'Describe what this project is about (optional)...')}
              rows={2}
              className="w-full px-4 py-2 bg-[var(--olu-bg)] border border-[var(--olu-border)] rounded-lg text-[var(--olu-text)] placeholder:text-[var(--olu-text-secondary)] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNewType('short_term')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  newType === 'short_term'
                    ? 'border-[var(--olu-primary)] bg-[var(--olu-primary)]/10 text-[var(--olu-primary)]'
                    : 'border-[var(--olu-border)] text-[var(--olu-text-secondary)]'
                }`}
              >
                {t('projects.shortTerm', 'Short-term')}
              </button>
              <button
                onClick={() => setNewType('ongoing')}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  newType === 'ongoing'
                    ? 'border-[var(--olu-primary)] bg-[var(--olu-primary)]/10 text-[var(--olu-primary)]'
                    : 'border-[var(--olu-border)] text-[var(--olu-text-secondary)]'
                }`}
              >
                {t('projects.ongoing', 'Ongoing')}
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}
                className="px-4 py-2 text-[var(--olu-text-secondary)] hover:text-[var(--olu-text)]"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-4 py-2 bg-[var(--olu-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--olu-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <FolderOpen className="w-16 h-16 mx-auto text-[var(--olu-text-secondary)] opacity-40" />
          <p className="text-[var(--olu-text-secondary)]">
            {t('projects.empty', 'No projects yet. Create one to get started!')}
          </p>
        </div>
      )}

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--olu-text-secondary)] uppercase tracking-wider">
            {t('projects.active', 'Active')} ({activeProjects.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCounts={taskCounts[project.id] || {}}
                onClick={() => navigate(`/business/projects/${project.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other projects */}
      {otherProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--olu-text-secondary)] uppercase tracking-wider">
            {t('projects.other', 'Other')} ({otherProjects.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {otherProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCounts={taskCounts[project.id] || {}}
                onClick={() => navigate(`/business/projects/${project.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  taskCounts,
  onClick,
}: {
  project: Project
  taskCounts: Record<string, number>
  onClick: () => void
}) {
  const { t } = useTranslation()
  const StatusIcon = STATUS_ICON[project.status]
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0)
  const doneTasks = taskCounts['done'] || 0

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="text-left w-full bg-[var(--olu-surface)] border border-[var(--olu-border)] rounded-xl p-4 hover:border-[var(--olu-primary)]/30 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--olu-text)] truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-[var(--olu-text-secondary)] mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--olu-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-1" />
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--olu-text-secondary)]">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_COLOR[project.status]}`}>
          <StatusIcon className="w-3 h-3" />
          {t(`projects.status.${project.status}`, project.status)}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--olu-bg)]">
          {project.type === 'ongoing' ? '∞' : '📅'} {t(`projects.type.${project.type}`, project.type)}
        </span>
        {totalTasks > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListTodo className="w-3 h-3" />
            {doneTasks}/{totalTasks}
          </span>
        )}
      </div>
    </motion.button>
  )
}
