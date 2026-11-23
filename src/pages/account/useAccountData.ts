import { useCallback, useEffect, useState } from 'react'

import type { OlympiadRegistration } from '@/entities/olympiad'
import type {
  UserAchievement,
  UserEvent,
  UserNotification,
} from '@/entities/profile'
import { olympiadApi, profileApi } from '@/shared/api'
import { useAuth } from '@/shared/auth'

export type AccountData = {
  events: UserEvent[]
  achievements: UserAchievement[]
  notifications: UserNotification[]
  registrations: OlympiadRegistration[]
}

const EMPTY: AccountData = {
  events: [],
  achievements: [],
  notifications: [],
  registrations: [],
}

export function useAccountData() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [data, setData] = useState<AccountData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setData(EMPTY)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const [eventsRes, achievementsRes, notificationsRes, registrationsRes] =
      await Promise.all([
        profileApi.listUserEvents(userId),
        profileApi.listUserAchievements(userId),
        profileApi.listUserNotifications(userId),
        olympiadApi.listMyRegistrations(userId),
      ])
    setData({
      events: eventsRes.data ?? [],
      achievements: achievementsRes.data ?? [],
      notifications: notificationsRes.data ?? [],
      registrations: registrationsRes.data ?? [],
    })
    setError(
      eventsRes.error ??
        achievementsRes.error ??
        notificationsRes.error ??
        registrationsRes.error,
    )
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
