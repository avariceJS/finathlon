import { supabase } from '@/shared/supabase'
import type { CouncilMember, CouncilMemberInput } from '@/entities/council'
import type { CouncilMemberRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapCouncil(row: CouncilMemberRow): CouncilMember {
  return {
    id: row.id,
    fullName: row.full_name,
    title: row.title ?? '',
    bio: row.bio ?? '',
    photoUrl: row.photo_url,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listCouncil(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<CouncilMember[]>> {
  let query = supabase
    .from('council_members')
    .select('*')
    .order('sort_order')
    .order('full_name')

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapCouncil))
}

export async function createCouncilMember(
  input: CouncilMemberInput,
): Promise<ApiResult<CouncilMember>> {
  const { data, error } = await supabase
    .from('council_members')
    .insert({
      full_name: input.fullName,
      title: input.title ?? null,
      bio: input.bio ?? null,
      photo_url: input.photoUrl ?? null,
      sort_order: input.sortOrder ?? 0,
      is_published: input.isPublished ?? true,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapCouncil(data))
}

export async function updateCouncilMember(
  id: string,
  input: Partial<CouncilMemberInput>,
): Promise<ApiResult<CouncilMember>> {
  const payload: Partial<CouncilMemberRow> = {}
  if (input.fullName !== undefined) payload.full_name = input.fullName
  if (input.title !== undefined) payload.title = input.title
  if (input.bio !== undefined) payload.bio = input.bio
  if (input.photoUrl !== undefined) payload.photo_url = input.photoUrl
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('council_members')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapCouncil(data))
}

export async function deleteCouncilMember(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('council_members').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
