import type {
  RegistrationOlympiad,
  OlympiadRegistration,
} from '@/entities/olympiad'
import { getRegistrationState } from '@/entities/olympiad/registration'
import { questionnaireToRow, type ProfileFormValues } from '@/entities/profile'
import { supabase } from '@/shared/supabase'
import type { OlympiadRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

export const ALREADY_REGISTERED_MESSAGE =
  'Вы уже зарегистрированы на этот профиль. Войдите в личный кабинет, чтобы продолжить участие.'

function mapProfile(row: OlympiadRow): RegistrationOlympiad {
  return {
    id: row.id,
    olympiadTitle: row.title,
    profileTitle: row.profile_title ?? row.title,
    season: row.season ?? String(row.year),
    startsAt: row.start_date,
    endsAt: row.end_date,
    summary: row.description ?? '',
    status: row.status,
    availability: getRegistrationState({
      status: row.status,
      isPublished: row.is_published,
      registrationOpen: row.registration_open,
      startDate: row.start_date,
      endDate: row.end_date,
    }),
  }
}

/**
 * Профили из раздела «Олимпиады и профили», видимые участникам:
 * опубликованные. Доступность регистрации — в `availability`.
 */
export async function listVisibleProfiles(): Promise<
  ApiResult<RegistrationOlympiad[]>
> {
  const { data, error } = await supabase
    .from('olympiads')
    .select('*')
    .eq('status', 'published')
    .eq('is_published', true)
    .order('created_at')

  if (error) return fail(error)
  return ok((data ?? []).map(mapProfile))
}

function humanizeRegistrationError(message: string): string {
  if (message.includes('already_registered')) return ALREADY_REGISTERED_MESSAGE
  if (message.includes('profile_closed')) {
    return 'Регистрация по этому профилю сейчас закрыта.'
  }
  if (message.includes('profile_full')) {
    return 'Свободных мест на этом профиле больше нет.'
  }
  if (message.includes('not_authenticated')) {
    return 'Сессия истекла. Войдите в личный кабинет и отправьте анкету ещё раз.'
  }
  if (message.includes('form_incomplete')) {
    return 'Анкета заполнена не полностью. Проверьте обязательные поля.'
  }
  return message
}

/**
 * Сохраняет анкету в кабинете текущего пользователя и регистрирует его
 * на профиль. Возвращает ID созданной регистрации.
 */
export async function registerForProfile(
  profileId: string,
  values: ProfileFormValues,
): Promise<ApiResult<string>> {
  const { data, error } = await supabase.rpc('register_for_olympiad_profile', {
    p_profile_id: profileId,
    p_form: questionnaireToRow(values),
  })
  if (error) return fail(humanizeRegistrationError(error.message))
  return ok(data)
}

export async function listMyRegistrations(
  userId: string,
): Promise<ApiResult<OlympiadRegistration[]>> {
  const { data, error } = await supabase
    .from('olympiad_registrations')
    .select('id, profile_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return fail(error)
  const rows = data ?? []
  if (rows.length === 0) return ok([])

  const { data: profiles, error: profilesError } = await supabase
    .from('olympiads')
    .select('*')
    .in(
      'id',
      rows.map((row) => row.profile_id),
    )
  if (profilesError) return fail(profilesError)

  const byId = new Map((profiles ?? []).map((row) => [row.id, mapProfile(row)]))
  return ok(
    rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      createdAt: row.created_at,
      profile: byId.get(row.profile_id) ?? null,
    })),
  )
}
