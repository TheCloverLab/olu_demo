export type EmployeeKind = 'ai' | 'human'
export type EmploymentStatus = 'active' | 'paused' | 'offboarded'

export type Employee = {
  id: string
  workspace_id: string
  kind: EmployeeKind
  name: string
  position: string
  description: string | null
  avatar_img: string | null
  color: string | null
  status: 'online' | 'offline' | 'busy'
  employment_status: EmploymentStatus

  template_id: string | null
  agent_key: string | null
  model_tier: string | null

  user_id: string | null
  email: string | null

  hired_by_user_id: string | null
  hired_at: string | null
  skills: string[]
  salary_label: string | null

  last_message: string | null
  last_time: string | null
  created_at: string | null
  updated_at: string | null
}

export type TeamTaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type TeamTaskSummary = {
  id: string
  title: string
  status: TeamTaskStatus
  priority: 'low' | 'medium' | 'high'
  due?: string | null
  progress: number
}

export type EmployeeWithTasks = Employee & {
  tasks?: TeamTaskSummary[]
}

export type ApprovalRecord = {
  id: string
  workspace_id: string
  title: string
  status: ApprovalStatus
  requested_by?: string | null
  approver_id?: string | null
  created_at?: string
}
