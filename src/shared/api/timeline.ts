import { supabase } from '@/shared/supabase'
import type {
  TimelineAccent,
  TimelineEvent,
  TimelineEventInput,
} from '@/entities/timeline'
import type { TimelineEventRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapTimeline(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    title: row.title,
    dateLabel: row.date_label,
    year: row.event_year,
    accent: row.accent as TimelineAccent,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  }
}

export async function listTimeline(
  options: { includeUnpublished?: boolean } = {},
): Promise<ApiResult<TimelineEvent[]>> {
  let query = supabase
    .from('timeline_events')
    .select('*')
    .order('event_year')
    .order('sort_order')

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapTimeline))
}

export async function createTimelineEvent(
  input: TimelineEventInput,
): Promise<ApiResult<TimelineEvent>> {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      title: input.title,
      date_label: input.dateLabel,
      event_year: input.year,
      accent: input.accent ?? 'red',
      sort_order: input.sortOrder ?? 0,
      is_published: input.isPublished ?? true,
    })
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapTimeline(data))
}

export async function updateTimelineEvent(
  id: string,
  input: Partial<TimelineEventInput>,
): Promise<ApiResult<TimelineEvent>> {
  const payload: Partial<TimelineEventRow> = {}
  if (input.title !== undefined) payload.title = input.title
  if (input.dateLabel !== undefined) payload.date_label = input.dateLabel
  if (input.year !== undefined) payload.event_year = input.year
  if (input.accent !== undefined) payload.accent = input.accent
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder
  if (input.isPublished !== undefined) payload.is_published = input.isPublished

  const { data, error } = await supabase
    .from('timeline_events')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapTimeline(data))
}

export async function deleteTimelineEvent(
  id: string,
): Promise<ApiResult<true>> {
  const { error } = await supabase.from('timeline_events').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
