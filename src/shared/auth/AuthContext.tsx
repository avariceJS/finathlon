import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  const [profileOwner, setProfileOwner] = useState<string | null>(null)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const profileRequest = useRef(0)
  const userId = session?.user?.id ?? null
  const currentProfile = profile?.id === userId ? profile : null
  const isProfileLoading = Boolean(
    userId && (isFetchingProfile || profileOwner !== userId),
  )

  const loadProfile = useCallback(async () => {
    const request = ++profileRequest.current
    if (!userId) {
      setProfile(null)
      setProfileOwner(null)
      setIsFetchingProfile(false)
      return
    }
    setIsFetchingProfile(true)
    const result = await profileApi.getMyProfile()
    if (request !== profileRequest.current) return
    setProfile(result.error || result.data?.id !== userId ? null : result.data)
    setProfileOwner(userId)
    setIsFetchingProfile(false)
  }, [userId])

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
    setProfileOwner(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: currentProfile,
      isAuthLoading,
      isProfileLoading,
      isAdmin: currentProfile?.role === 'admin',
      signOut,
      refreshProfile: loadProfile,
    }),
    [
      session,
      currentProfile,
      isAuthLoading,
      isProfileLoading,
      signOut,
      loadProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
