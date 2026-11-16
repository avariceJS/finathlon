import { supabase } from '@/shared/supabase'
import type { OlympiadProfile, OlympiadProfileInput } from '@/entities/olympiad'
import type { OlympiadProfileRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapOlympiadProfile(row: OlympiadProfileRow): OlympiadProfile {
  return {
    id: row.id,
    userId: row.user_id,
    olympiadId: row.olympiad_id,
    olympiadYear: row.olympiad_year,
    category: row.category,
    score: row.score,
    rank: row.rank,
    diplomaUrl: row.diploma_url,
    certificateUrl: row.certificate_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listOlympiadProfiles(
  options: { olympiadId?: string } = {},
): Promise<ApiResult<OlympiadProfile[]>> {
  let query = supabase.from('olympiad_profiles').select('*')

  if (options.olympiadId) {
    query = query.eq('olympiad_id', options.olympiadId)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapOlympiadProfile))
}

export async function getOlympiadProfile(
  id: string,
): Promise<ApiResult<OlympiadProfile | null>> {
  const { data, error } = await supabase
    .from('olympiad_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapOlympiadProfile(data) : null)
}

export async function createOlympiadProfile(
  input: OlympiadProfileInput,
): Promise<ApiResult<OlympiadProfile>> {
  const payload = {
    user_id: input.userId,
    olympiad_id: input.olympiadId,
    olympiad_year: input.olympiadYear,
    category: input.category ?? 'general',
    score: input.score ?? 0,
    rank: input.rank ?? 'participant',
    diploma_url: input.diplomaUrl ?? null,
    certificate_url: input.certificateUrl ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('olympiad_profiles')
    .insert(payload)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapOlympiadProfile(data))
}

export async function updateOlympiadProfile(
  id: string,
  input: Partial<OlympiadProfileInput>,
): Promise<ApiResult<OlympiadProfile>> {
  const payload: Partial<OlympiadProfileRow> = {}
  if (input.userId !== undefined) payload.user_id = input.userId
  if (input.olympiadId !== undefined) payload.olympiad_id = input.olympiadId
  if (input.olympiadYear !== undefined)
    payload.olympiad_year = input.olympiadYear
  if (input.category !== undefined) payload.category = input.category
  if (input.score !== undefined) payload.score = input.score
  if (input.rank !== undefined) payload.rank = input.rank
  if (input.diplomaUrl !== undefined) payload.diploma_url = input.diplomaUrl
  if (input.certificateUrl !== undefined)
    payload.certificate_url = input.certificateUrl
  if (input.notes !== undefined) payload.notes = input.notes

  const { data, error } = await supabase
    .from('olympiad_profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapOlympiadProfile(data))
}

export async function deleteOlympiadProfile(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('olympiad_profiles')
    .delete()
    .eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
