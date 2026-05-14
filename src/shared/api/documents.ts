import { supabase } from '@/shared/supabase'
import type { DocumentItem, DocumentInput } from '@/entities/document'
import type { DocumentRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapDocument(row: DocumentRow): DocumentItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    fileUrl: row.file_url,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listDocuments(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<DocumentItem[]>> {
  let query = supabase
    .from('documents')
    .select('*')
    .order('category')
    .order('sort_order')

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapDocument))
}

export async function createDocument(
  input: DocumentInput,
): Promise<ApiResult<DocumentItem>> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? 'general',
      file_url: input.fileUrl ?? null,
      sort_order: input.sortOrder ?? 0,
      is_published: input.isPublished ?? true,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapDocument(data))
}

export async function updateDocument(
  id: string,
  input: Partial<DocumentInput>,
): Promise<ApiResult<DocumentItem>> {
  const payload: Partial<DocumentRow> = {}
  if (input.title !== undefined) payload.title = input.title
  if (input.description !== undefined) payload.description = input.description
  if (input.category !== undefined) payload.category = input.category
  if (input.fileUrl !== undefined) payload.file_url = input.fileUrl
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapDocument(data))
}

export async function deleteDocument(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
