import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import type { Profile } from '@/entities/profile'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  isAuthLoading: boolean
  isProfileLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
