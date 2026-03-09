import { getCreators, getUserById } from './data'

export async function getProfileById(userId: string) {
  return await getUserById(userId)
}

export async function getPublicCreators() {
  return await getCreators()
}
