import { sanitizeRichText } from '@/shared/lib/richText'
import { supabase } from '@/shared/supabase'
import type { Olympiad, OlympiadInput } from '@/entities/olympiad'
import type { OlympiadRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapOlympiad(row: OlympiadRow & { stage?: string }): Olympiad {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    profileTitle: row.profile_title,
    description: row.description,
    season: row.season,
    year: row.year,
    format: row.format ?? (row.stage === 'final' ? 'offline' : 'online'),
    registrationOpen: row.registration_open ?? null,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    maxParticipants: row.max_participants,
    isPublished: row.is_published,
    richContent: row.rich_content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// The website can be deployed before the additive database upgrade. Reads remain
// compatible with the legacy schema; admin writes stay disabled until it is ready.
export async function checkOlympiadSchema(): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('olympiads')
    .select('format,registration_open')
    .limit(0)
  if (error)
    return fail(
      'Раздел временно доступен только для просмотра. Требуется обновление базы данных администратором проекта.',
    )
  return ok(true)
}

export async function listOlympiads(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<Olympiad[]>> {
  let query = supabase
    .from('olympiads')
    .select('*')
    .order('year', { ascending: false })

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true).eq('status', 'published')
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapOlympiad))
}

export async function getOlympiad(
  id: string,
): Promise<ApiResult<Olympiad | null>> {
  const { data, error } = await supabase
    .from('olympiads')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapOlympiad(data) : null)
}

export async function getOlympiadBySlug(
  slug: string,
): Promise<ApiResult<Olympiad | null>> {
  const { data, error } = await supabase
    .from('olympiads')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapOlympiad(data) : null)
}

export async function createOlympiad(
  input: OlympiadInput,
): Promise<ApiResult<Olympiad>> {
  const payload = {
    slug: input.slug,
    title: input.title,
    profile_title: input.profileTitle ?? null,
    description: input.description ?? null,
    season: input.season ?? null,
    year: input.year,
    format: input.format ?? 'online',
    registration_open: input.registrationOpen ?? null,
    status: input.status ?? 'draft',
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    max_participants: input.maxParticipants ?? null,
    is_published: input.isPublished ?? false,
    rich_content: input.richContent
      ? sanitizeRichText(input.richContent)
      : null,
  }

  const { data, error } = await supabase
    .from('olympiads')
    .insert(payload)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapOlympiad(data))
}

export async function updateOlympiad(
  id: string,
  input: Partial<OlympiadInput>,
): Promise<ApiResult<Olympiad>> {
  const payload: Partial<OlympiadRow> = {}
  if (input.slug !== undefined) payload.slug = input.slug
  if (input.title !== undefined) payload.title = input.title
  if (input.profileTitle !== undefined)
    payload.profile_title = input.profileTitle
  if (input.description !== undefined) payload.description = input.description
  if (input.season !== undefined) payload.season = input.season
  if (input.year !== undefined) payload.year = input.year
  if (input.format !== undefined) payload.format = input.format
  if (input.registrationOpen !== undefined)
    payload.registration_open = input.registrationOpen
  if (input.status !== undefined) payload.status = input.status
  if (input.startDate !== undefined) payload.start_date = input.startDate
  if (input.endDate !== undefined) payload.end_date = input.endDate
  if (input.maxParticipants !== undefined)
    payload.max_participants = input.maxParticipants
  if (input.isPublished !== undefined) payload.is_published = input.isPublished
  if (input.richContent !== undefined)
    payload.rich_content = input.richContent
      ? sanitizeRichText(input.richContent)
      : null

  const { data, error } = await supabase
    .from('olympiads')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapOlympiad(data))
}

export async function deleteOlympiad(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('olympiads').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
