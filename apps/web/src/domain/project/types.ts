// ── Project-Centric Types ─────────────────────────────────────

export type ProjectType = 'short_term' | 'ongoing'
export type ProjectStatus = 'active' | 'paused' | 'archived' | 'completed'
export type RuntimeType = 'langgraph' | 'openclaw'
export type ParticipantRole = 'owner' | 'participant'
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ProjectConfig {
  model?: string
  skills?: string[]
  instructions?: string
  budget?: { monthly_limit?: number }
}

export interface Project {
  id: string
  workspace_id: string
  owner_id: string
  name: string
  description: string | null
  type: ProjectType
  status: ProjectStatus
  runtime_type: RuntimeType
  config: ProjectConfig
  created_at: string
  updated_at: string
}

export interface ProjectParticipant {
  id: string
  project_id: string
  user_id: string
  role: ParticipantRole
  added_by: string | null
  created_at: string
  // Joined from users table
  user?: {
    id: string
    name: string
    avatar_img: string | null
  }
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  progress: number
  parent_task_id: string | null
  assigned_to: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  name: string
  file_path: string
  mime_type: string | null
  size_bytes: number | null
  created_by: string | null
  created_at: string
}

// Project with participant count for list views
export interface ProjectSummary extends Project {
  participant_count: number
  task_counts: {
    pending: number
    in_progress: number
    done: number
    blocked: number
  }
}
