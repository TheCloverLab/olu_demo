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
