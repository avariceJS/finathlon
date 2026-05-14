import { supabase } from '@/shared/supabase'
import type { FaqEntry, FaqEntryInput } from '@/entities/faq'
import type { FaqRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapFaq(row: FaqRow): FaqEntry {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listFaqs(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<FaqEntry[]>> {
  let query = supabase.from('faqs').select('*').order('sort_order')
  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }
  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapFaq))
}

export async function createFaq(
  input: FaqEntryInput,
): Promise<ApiResult<FaqEntry>> {
  const { data, error } = await supabase
    .from('faqs')
    .insert({
      question: input.question,
      answer: input.answer,
      sort_order: input.sortOrder ?? 0,
      is_published: input.isPublished ?? true,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapFaq(data))
}

export async function updateFaq(
  id: string,
  input: Partial<FaqEntryInput>,
): Promise<ApiResult<FaqEntry>> {
  const payload: Partial<FaqRow> = {}
  if (input.question !== undefined) payload.question = input.question
  if (input.answer !== undefined) payload.answer = input.answer
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('faqs')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapFaq(data))
}

export async function deleteFaq(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('faqs').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
