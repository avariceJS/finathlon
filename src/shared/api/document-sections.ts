import { supabase } from '@/shared/supabase'
import type { DocumentSectionRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

export type DocumentSection = {
  id: string
  parentId: string | null
  title: string
  slug: string
  sortOrder: number
  isPublished: boolean
}

function mapSection(row: DocumentSectionRow): DocumentSection {
  return {
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    slug: row.slug,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listDocumentSections(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<DocumentSection[]>> {
  let query = supabase
    .from('document_sections')
    .select('*')
    .order('sort_order')
    .order('title')

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapSection))
}

export async function createDocumentSection(
  input: Omit<DocumentSection, 'id'>,
): Promise<ApiResult<DocumentSection>> {
  const { data, error } = await supabase
    .from('document_sections')
    .insert({
      parent_id: input.parentId,
      title: input.title,
      slug: input.slug,
      sort_order: input.sortOrder,
      is_published: input.isPublished,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapSection(data))
}

export async function updateDocumentSection(
  id: string,
  input: Partial<Omit<DocumentSection, 'id'>>,
): Promise<ApiResult<DocumentSection>> {
  const payload: Partial<DocumentSectionRow> = {}
  if (input.parentId !== undefined) payload.parent_id = input.parentId
  if (input.title !== undefined) payload.title = input.title
  if (input.slug !== undefined) payload.slug = input.slug
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('document_sections')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapSection(data))
}

export async function deleteDocumentSection(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('document_sections')
    .delete()
    .eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
