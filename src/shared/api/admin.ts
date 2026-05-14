import { supabase } from '@/shared/supabase'
import type { Profile } from '@/entities/profile'
import type {
  AchievementRow,
  NotificationRow,
  ProfileRow,
} from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

type AdminProfile = Profile & {
  achievementsCount: number
  eventsCount: number
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    middleName: row.middle_name ?? '',
    email: row.email ?? '',
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

export async function listProfiles(): Promise<ApiResult<AdminProfile[]>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return fail(error)

  const users = (data ?? []).map(toProfile)
  if (users.length === 0) return ok([])

  const ids = users.map((u) => u.id)
  const [achievementsRes, eventsRes] = await Promise.all([
    supabase.from('achievements').select('user_id').in('user_id', ids),
    supabase.from('user_events').select('user_id').in('user_id', ids),
  ])

  const counts = new Map<string, { ach: number; ev: number }>()
  for (const id of ids) counts.set(id, { ach: 0, ev: 0 })
  for (const row of (achievementsRes.data ?? []) as Pick<
    AchievementRow,
    'user_id'
  >[]) {
    const slot = counts.get(row.user_id)
    if (slot) slot.ach += 1
  }
  for (const row of (eventsRes.data ?? []) as { user_id: string }[]) {
    const slot = counts.get(row.user_id)
    if (slot) slot.ev += 1
  }

  return ok(
    users.map((u) => ({
      ...u,
      achievementsCount: counts.get(u.id)?.ach ?? 0,
      eventsCount: counts.get(u.id)?.ev ?? 0,
    })),
  )
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'admin',
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) return fail(error)
  return ok(true)
}

export async function awardAchievement(
  userId: string,
  payload: {
    title: string
    description?: string
    progressCurrent?: number
    progressTotal?: number
  },
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('achievements').insert({
    user_id: userId,
    title: payload.title,
    description: payload.description ?? null,
    progress_current: payload.progressCurrent ?? 1,
    progress_total: payload.progressTotal ?? 1,
  })
  if (error) return fail(error)
  return ok(true)
}

export async function deleteAchievement(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('achievements').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}

export async function addUserEvent(
  userId: string,
  payload: {
    title: string
    year: number
    dateLabel: string
    result?: string
    publicationUrl?: string | null
    diplomaUrl?: string | null
  },
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('user_events').insert({
    user_id: userId,
    title: payload.title,
    year: payload.year,
    date_label: payload.dateLabel,
    result: payload.result ?? null,
    publication_url: payload.publicationUrl ?? null,
    diploma_url: payload.diplomaUrl ?? null,
  })
  if (error) return fail(error)
  return ok(true)
}

export async function deleteUserEvent(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('user_events').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}

export async function broadcastNotification(payload: {
  title: string
  description?: string
  documentUrl?: string | null
}): Promise<ApiResult<{ inserted: number }>> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')

  if (profilesError) return fail(profilesError)
  const rows = (profiles ?? []).map((row) => ({
    user_id: row.id,
    title: payload.title,
    description: payload.description ?? null,
    document_url: payload.documentUrl ?? null,
  }))

  if (rows.length === 0) return ok({ inserted: 0 })

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) return fail(error)
  return ok({ inserted: rows.length })
}

export async function deleteNotification(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}

export type { AdminProfile }
export type AdminNotificationRow = NotificationRow
