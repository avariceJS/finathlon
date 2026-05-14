import { supabase } from '@/shared/supabase'
import type { Program, ProgramInput } from '@/entities/program'
import type { ProgramRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    description: row.description ?? '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    ctaLabel: row.cta_label ?? 'Участвовать',
    ctaHref: row.cta_href,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listPrograms(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<Program[]>> {
  let query = supabase.from('programs').select('*').order('sort_order')
  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapProgram))
}

export async function getProgramBySlug(
  slug: string,
): Promise<ApiResult<Program | null>> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapProgram(data) : null)
}

export async function createProgram(
  input: ProgramInput,
): Promise<ApiResult<Program>> {
  const payload = {
    slug: input.slug,
    title: input.title,
    summary: input.summary ?? null,
    description: input.description ?? null,
    highlights: input.highlights ?? [],
    cta_label: input.ctaLabel ?? null,
    cta_href: input.ctaHref ?? null,
    sort_order: input.sortOrder ?? 0,
    is_published: input.isPublished ?? true,
  }

  const { data, error } = await supabase
    .from('programs')
    .insert(payload)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapProgram(data))
}

export async function updateProgram(
  id: string,
  input: Partial<ProgramInput>,
): Promise<ApiResult<Program>> {
  const payload: Partial<ProgramRow> = {}
  if (input.slug !== undefined) payload.slug = input.slug
  if (input.title !== undefined) payload.title = input.title
  if (input.summary !== undefined) payload.summary = input.summary
  if (input.description !== undefined) payload.description = input.description
  if (input.highlights !== undefined) payload.highlights = input.highlights
  if (input.ctaLabel !== undefined) payload.cta_label = input.ctaLabel
  if (input.ctaHref !== undefined) payload.cta_href = input.ctaHref
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('programs')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapProgram(data))
}

export async function deleteProgram(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('programs').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
