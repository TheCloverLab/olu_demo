// ---------- HR-model Employee types ----------

export type EmployeeKind = 'ai' | 'human'
export type EmploymentStatus = 'active' | 'paused' | 'offboarded'

export type Employee = {
  id: string
  workspace_id: string
  kind: EmployeeKind
  name: string
  position: string // HR: job title (agent role or human title)
  description: string | null
  avatar_img: string | null
  color: string | null
  status: 'online' | 'offline' | 'busy'
  employment_status: EmploymentStatus

  // AI-specific (null for humans)
  template_id: string | null
  agent_key: string | null
  model_tier: string | null // HR: qualifications (gpt-4, claude, etc.)

  // Human-specific (null for AI)
  user_id: string | null
  email: string | null

  // Common HR fields
  hired_by_user_id: string | null
  hired_at: string | null
  skills: string[] // HR: connected platforms, capabilities
  salary_label: string | null // HR: token cost / monthly cost

  last_message: string | null
  last_time: string | null
  created_at: string | null
  updated_at: string | null
}

export type EmployeeWithTasks = Employee & {
  tasks?: TeamTaskSummary[]
}

// ---------- Task & approval types ----------

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

export type ApprovalRecord = {
  id: string
  workspace_id: string
  title: string
  status: ApprovalStatus
  requested_by?: string | null
  approver_id?: string | null
  created_at?: string
}

// ---------- Helpers ----------

export function isAIEmployee(employee: Employee): boolean {
  return employee.kind === 'ai'
}

export function isHumanEmployee(employee: Employee): boolean {
  return employee.kind === 'human'
}
