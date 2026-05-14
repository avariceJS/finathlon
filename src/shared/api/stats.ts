import { supabase } from '@/shared/supabase'
import type { StatItem, StatItemInput } from '@/entities/stat'
import type { StatRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapStat(row: StatRow): StatItem {
  return {
    id: row.id,
    metricKey: row.metric_key,
    value: row.value_text,
    label: row.label,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listStats(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<StatItem[]>> {
  let query = supabase.from('stats').select('*').order('sort_order')
  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }
  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapStat))
}

export async function upsertStat(
  input: StatItemInput,
): Promise<ApiResult<StatItem>> {
  const { data, error } = await supabase
    .from('stats')
    .upsert(
      {
        metric_key: input.metricKey,
        value_text: input.value,
        label: input.label,
        sort_order: input.sortOrder ?? 0,
        is_published: input.isPublished ?? true,
      },
      { onConflict: 'metric_key' },
    )
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapStat(data))
}

export async function deleteStat(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('stats').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
