import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/shared/supabase'
import { profileApi } from '@/shared/api'
import type { Profile } from '@/entities/profile'

import { AuthContext, type AuthContextValue } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  const loadProfile = useCallback(async () => {
    setIsProfileLoading(true)
    const result = await profileApi.getMyProfile()
    setProfile(result.error ? null : result.data)
    setIsProfileLoading(false)
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setIsAuthLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setIsAuthLoading(false)
      },
    )

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading) return
    if (!userId) {
      setProfile(null)
      return
    }
    void loadProfile()
  }, [userId, isAuthLoading, loadProfile])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
    } catch {
      await supabase.auth.signOut({ scope: 'local' })
    }
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAuthLoading,
      isProfileLoading,
      isAdmin: profile?.role === 'admin',
      signOut,
      refreshProfile: loadProfile,
    }),
    [
      session,
      profile,
      isAuthLoading,
      isProfileLoading,
      signOut,
      loadProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
