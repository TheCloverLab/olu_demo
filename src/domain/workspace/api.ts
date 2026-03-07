import { supabase } from '../../lib/supabase'
import type { RoleApplication } from '../../lib/supabase'

export async function getMyRoleApplications() {
  const { data, error } = await supabase
    .from('role_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as RoleApplication[]
}

export async function submitRoleApplication(targetRole: 'creator' | 'advertiser' | 'supplier', reason?: string) {
  const { data, error } = await supabase.functions.invoke('upgrade-role', {
    body: {
      targetRole,
      reason,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.applicationId as string
}
