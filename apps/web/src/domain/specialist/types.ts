export type SpecialistCategory = 'marketing' | 'content' | 'support' | 'research' | 'operations' | 'general'

export interface SpecialistTemplate {
  id: string
  workspace_id: string
  name: string
  description: string | null
  icon: string
  category: SpecialistCategory
  skills: string[]
  instructions: string | null
  access_type: 'free' | 'paid'
  price: number
  currency: string
  install_count: number
  status: 'active' | 'archived'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SpecialistInstall {
  id: string
  template_id: string
  user_id: string
  workspace_id: string
  project_id: string | null
  created_at: string
}
