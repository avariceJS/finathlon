import { supabase } from '@/shared/supabase'
import {
  booleanToYesNo,
  questionnaireToRow,
  type Profile,
  type ProfileFormValues,
  type UserAchievement,
  type UserEvent,
  type UserNotification,
} from '@/entities/profile'
import type {
  AchievementRow,
  NotificationRow,
  ProfileRow,
  UserEventRow,
} from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

export function mapProfile(row: ProfileRow): Profile {
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
    federalDistrict: row.federal_district ?? '',
    region: row.region ?? '',
    postalCode: row.postal_code ?? '',
    localityType: row.locality_type ?? '',
    address: row.address ?? '',
    isRural: booleanToYesNo(row.is_rural),
    schoolAddress: row.school_address ?? '',
    schoolPhone: row.school_phone ?? '',
    schoolEmail: row.school_email ?? '',
    isOrphan: booleanToYesNo(row.is_orphan),
    hasDisability: booleanToYesNo(row.has_disability),
    motivation: row.motivation ?? '',
    financeInterest: row.finance_interest ?? '',
    infoSource: row.info_source ?? '',
    parentFullName: row.parent_full_name ?? '',
    parentEmail: row.parent_email ?? '',
    parentPhone: row.parent_phone ?? '',
    organizations: row.organizations ?? '',
    teacherFullName: row.teacher_full_name ?? '',
    teacherPhone: row.teacher_phone ?? '',
    teacherEmail: row.teacher_email ?? '',
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
    ...questionnaireToRow(values),
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
