import { supabase } from '@/shared/supabase'
import type {
  Profile,
  ProfileFormValues,
  UserAchievement,
  UserEvent,
  UserNotification,
} from '@/entities/profile'
import type {
  AchievementRow,
  NotificationRow,
  ProfileRow,
  UserEventRow,
} from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    middleName: row.middle_name ?? '',
    email: row.email ?? '',
    username: row.username ?? '',
    phone: row.phone ?? '',
    birthDate: row.birth_date ?? '',
    country: row.country ?? '',
    city: row.city ?? '',
    school: row.school ?? '',
    classCourse: row.class_course ?? '',
    telegram: row.telegram ?? '',
    vk: row.vk ?? '',
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    isComplete: row.is_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getMyProfile(): Promise<ApiResult<Profile | null>> {
  const { data: userResponse, error: userError } = await supabase.auth.getUser()
  if (userError) return fail(userError)

  const user = userResponse.user
  if (!user) return ok(null)

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapProfile(data) : null)
}

export async function updateMyProfile(
  userId: string,
  values: ProfileFormValues,
): Promise<ApiResult<Profile>> {
  const payload = {
    first_name: values.firstName.trim() || null,
    last_name: values.lastName.trim() || null,
    middle_name: values.middleName.trim() || null,
    phone: values.phone.trim() || null,
    birth_date: values.birthDate || null,
    country: values.country.trim() || null,
    city: values.city.trim() || null,
    school: values.school.trim() || null,
    class_course: values.classCourse.trim() || null,
    telegram: values.telegram.trim() || null,
    vk: values.vk.trim() || null,
    bio: values.bio.trim() || null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapProfile(data))
}

export async function listUserEvents(
  userId: string,
): Promise<ApiResult<UserEvent[]>> {
  const { data, error } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return fail(error)
  return ok((data ?? []).map(mapUserEvent))
}

export async function listUserAchievements(
  userId: string,
): Promise<ApiResult<UserAchievement[]>> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')

  if (error) return fail(error)
  return ok((data ?? []).map(mapAchievement))
}

export async function listUserNotifications(
  userId: string,
): Promise<ApiResult<UserNotification[]>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return fail(error)
  return ok((data ?? []).map(mapNotification))
}

export async function markNotificationRead(
  id: string,
  isRead: boolean,
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: isRead })
    .eq('id', id)
  if (error) return fail(error)
  return ok(true)
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) return fail(error)
  return ok(true)
}

function mapUserEvent(row: UserEventRow): UserEvent {
  return {
    id: row.id,
    year: row.year,
    dateLabel: row.date_label,
    title: row.title,
    result: row.result ?? '',
    publicationUrl: row.publication_url,
    diplomaUrl: row.diploma_url,
    createdAt: row.created_at,
  }
}

function mapAchievement(row: AchievementRow): UserAchievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    progressCurrent: row.progress_current,
    progressTotal: row.progress_total,
    createdAt: row.created_at,
  }
}

function mapNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    documentUrl: row.document_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}
