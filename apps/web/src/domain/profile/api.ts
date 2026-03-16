import { supabase } from '../../lib/supabase'
import { getCreators, getUserById } from './data'

export async function getProfileById(userId: string) {
  return await getUserById(userId)
}

export async function getPublicCreators() {
  return await getCreators()
}

/**
 * Update a user's profile fields (name, handle, initials, avatar_img, bio, cover_img, etc.)
 */
export async function updateProfile(
  userId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
  if (error) throw error
}

/**
 * Mark onboarding as completed for the given user.
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('id', userId)
  if (error) throw error
}
