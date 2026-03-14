import type { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']

export type UserWallet = Database['public']['Tables']['user_wallets']['Row']
