export type User = {
  id: string
  auth_id?: string
  username: string
  handle: string
  email: string
  name: string
  bio?: string
  avatar_img?: string
  cover_img?: string
  avatar_color?: string
  initials?: string
  followers: number
  following: number
  posts: number
  verified: boolean
  onboarding_completed?: boolean
  social_links?: Record<string, string>
  created_at?: string
  updated_at?: string
}
