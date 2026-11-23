import { supabase } from '@/shared/supabase'

import type {
  DemoAttempt,
  DemoCategory,
  DemoFilters,
  DemoImportPreview,
  DemoQuestion,
} from './model'

function check(error: { code: string; message: string } | null) {
  if (!error) return
  if (['PGRST202', 'PGRST205', '42P01'].includes(error.code)) {
    throw new Error('Раздел демо-тестирования пока недоступен.')
  }
  throw new Error(error.message)
}

export async function startDemo(
  category: DemoCategory,
  region: string,
  city: string,
) {
  const { data, error } = await supabase.rpc('demo_start', {
    p_profile: category.profile,
    p_grades: category.grades,
    p_region: region,
    p_city: city,
  })
  check(error)
  if (!data) throw new Error('Не удалось получить вопросы теста.')
  return data
}

export async function finishDemo(id: string, answers: string[][]) {
  const { data, error } = await supabase.rpc('demo_finish', {
    p_attempt: id,
    p_answers: answers,
  })
  check(error)
  if (!data) throw new Error('Не удалось получить результат теста.')
  return data
}

export async function listDemoBank() {
  const [questions, reports] = await Promise.all([
    supabase.from('demo_questions').select('*').order('number'),
    supabase.from('demo_import_reports').select('*'),
  ])
  check(questions.error)
  check(reports.error)
  return { questions: questions.data ?? [], reports: reports.data ?? [] }
}

export async function importDemoBank({
  questions,
  reports,
}: DemoImportPreview) {
  const { error } = await supabase.rpc('demo_import', {
    p_questions: questions,
    p_reports: reports,
  })
  check(error)
}

export async function updateDemoQuestion({
  profile,
  grades,
  number,
  body,
}: DemoQuestion) {
  const { data, error } = await supabase
    .from('demo_questions')
    .update({ body })
    .eq('profile', profile)
    .eq('grades', grades)
    .eq('number', number)
    .select()
    .single()
  check(error)
  if (!data) throw new Error('Не удалось сохранить вопрос.')
  return data
}

const resultColumns =
  'id,profile,grades,region,city,completed_at,correct_count,question_count,score,max_score,incorrect_numbers'

export async function listDemoAttempts(
  filters: DemoFilters,
  size: number,
  paging: { offset: number } | { after?: DemoAttempt },
) {
  const paged = 'offset' in paging
  let query = supabase
    .from('demo_attempts')
    .select(resultColumns, paged ? { count: 'exact' } : {})
    .not('completed_at', 'is', null)
  if (filters.profile) query = query.eq('profile', filters.profile)
  if (filters.grades) query = query.eq('grades', filters.grades)
  if (filters.from)
    query = query.gte('completed_at', `${filters.from}T00:00:00+03:00`)
  if (filters.to)
    query = query.lte('completed_at', `${filters.to}T23:59:59.999999+03:00`)
  if (filters.region) {
    const pattern = filters.region.replace(
      /[\\%_*]/g,
      (character) => `\\${character}`,
    )
    query = query.ilike('region', `%${pattern}%`)
  }
  if ('after' in paging && paging.after) {
    const { completed_at: date, id } = paging.after
    query = query.or(
      `completed_at.lt.${date},and(completed_at.eq.${date},id.lt.${id})`,
    )
  }
  const offset = 'offset' in paging ? paging.offset : 0
  const { data, error, count } = await query
    .order('completed_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + size - 1)
  check(error)
  return { rows: data ?? [], count: count ?? 0 }
}
