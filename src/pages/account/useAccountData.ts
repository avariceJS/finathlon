import { useCallback, useEffect, useState } from 'react'

import type {
  UserAchievement,
  UserEvent,
  UserNotification,
} from '@/entities/profile'
import { profileApi } from '@/shared/api'
import { useAuth } from '@/shared/auth'

export type AccountData = {
  events: UserEvent[]
  achievements: UserAchievement[]
  notifications: UserNotification[]
}

const EMPTY: AccountData = {
  events: [],
  achievements: [],
  notifications: [],
}

export function useAccountData() {
  const { user } = useAuth()
  const [data, setData] = useState<AccountData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setData(EMPTY)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const [eventsRes, achievementsRes, notificationsRes] = await Promise.all([
      profileApi.listUserEvents(user.id),
      profileApi.listUserAchievements(user.id),
      profileApi.listUserNotifications(user.id),
    ])
    setData({
      events: eventsRes.data ?? [],
      achievements: achievementsRes.data ?? [],
      notifications: notificationsRes.data ?? [],
    })
    setError(
      eventsRes.error ?? achievementsRes.error ?? notificationsRes.error,
    )
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
