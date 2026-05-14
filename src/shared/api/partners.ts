import { supabase } from '@/shared/supabase'
import type { Partner, PartnerInput, PartnerKind } from '@/entities/partner'
import type { PartnerRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapPartner(row: PartnerRow): Partner {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    kind: row.kind as PartnerKind,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listPartners(
  options: { kind?: PartnerKind; includeUnpublished?: boolean } = {},
): Promise<ApiResult<Partner[]>> {
  let query = supabase
    .from('partners')
    .select('*')
    .order('sort_order')
    .order('name')

  if (options.kind) {
    query = query.eq('kind', options.kind)
  }
  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapPartner))
}

export async function createPartner(
  input: PartnerInput,
): Promise<ApiResult<Partner>> {
  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: input.name,
      description: input.description ?? null,
      logo_url: input.logoUrl ?? null,
      website_url: input.websiteUrl ?? null,
      kind: input.kind ?? 'partner',
      sort_order: input.sortOrder ?? 0,
      is_published: input.isPublished ?? true,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapPartner(data))
}

export async function updatePartner(
  id: string,
  input: Partial<PartnerInput>,
): Promise<ApiResult<Partner>> {
  const payload: Partial<PartnerRow> = {}
  if (input.name !== undefined) payload.name = input.name
  if (input.description !== undefined) payload.description = input.description
  if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl
  if (input.websiteUrl !== undefined) payload.website_url = input.websiteUrl
  if (input.kind !== undefined) payload.kind = input.kind
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('partners')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapPartner(data))
}

export async function deletePartner(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
