import { supabase } from '../../lib/supabase'
import type { SpecialistTemplate, SpecialistInstall } from './types'

// ── Templates ────────────────────────────────────────────────

export async function listSpecialists(workspaceId: string): Promise<SpecialistTemplate[]> {
  const { data, error } = await supabase
    .from('specialist_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('install_count', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getSpecialist(templateId: string): Promise<SpecialistTemplate | null> {
  const { data } = await supabase
    .from('specialist_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle()
  return data
}

export async function createSpecialist(
  workspaceId: string,
  createdBy: string,
  template: {
    name: string
    description?: string
    icon?: string
    category?: string
    skills: string[]
    instructions?: string
    access_type?: 'free' | 'paid'
    price?: number
  }
): Promise<SpecialistTemplate> {
  const { data, error } = await supabase
    .from('specialist_templates')
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      name: template.name,
      description: template.description || null,
      icon: template.icon || '🤖',
      category: template.category || 'general',
      skills: template.skills,
      instructions: template.instructions || null,
      access_type: template.access_type || 'free',
      price: template.price || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSpecialist(
  templateId: string,
  updates: Partial<Pick<SpecialistTemplate, 'name' | 'description' | 'icon' | 'category' | 'skills' | 'instructions' | 'access_type' | 'price' | 'status'>>
): Promise<SpecialistTemplate> {
  const { data, error } = await supabase
    .from('specialist_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSpecialist(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('specialist_templates')
    .delete()
    .eq('id', templateId)
  if (error) throw error
}

// ── Installs ─────────────────────────────────────────────────

export async function installSpecialist(
  templateId: string,
  userId: string,
  workspaceId: string,
  projectId?: string
): Promise<SpecialistInstall> {
  const { data, error } = await supabase
    .from('specialist_installs')
    .upsert(
      {
        template_id: templateId,
        user_id: userId,
        workspace_id: workspaceId,
        project_id: projectId || null,
      },
      { onConflict: 'template_id,user_id' }
    )
    .select()
    .single()
  if (error) throw error

  // Increment install count
  await supabase.rpc('increment_specialist_installs', { tid: templateId }).catch(() => {})

  return data
}

export async function getUserInstalls(userId: string, workspaceId: string): Promise<SpecialistInstall[]> {
  const { data, error } = await supabase
    .from('specialist_installs')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function isInstalled(templateId: string, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('specialist_installs')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .eq('user_id', userId)
  return (count || 0) > 0
}
