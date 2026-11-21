import { supabase } from '@/shared/supabase'
import type {
  CorrectAnswerPayload,
  ImportTaskInput,
  MatchingPair,
  QuestionBankDetail,
  QuestionBankGradeCategory,
  QuestionBankSummary,
  QuestionTask,
  QuestionType,
  QuestionVariant,
  QuestionVariantHistoryEntry,
  UpdateQuestionVariantInput,
} from './types'

const GRADE_LABELS: Record<QuestionBankGradeCategory, string> = {
  '6-7': '6–7 классы',
  '8-9': '8–9 классы',
  '10-11': '10–11 классы',
}

type OlympiadJoinRow = {
  title: string
  profile_title: string | null
  season: string | null
  year: number
}

type BankListRow = {
  id: string
  olympiad_id: string
  grade_category: QuestionBankGradeCategory
  created_at: string
  updated_at: string
  olympiads: OlympiadJoinRow | OlympiadJoinRow[]
  question_bank_tasks: Array<{
    id: string
    question_bank_variants: Array<{ id: string }> | null
  }> | null
}

type VariantDbRow = {
  id: string
  task_id: string
  bank_id: string
  row_number: number
  question_text: string
  options: string[] | MatchingPair[]
  correct_answer: CorrectAnswerPayload
  points: number | string
  current_version: number
  created_at: string
  updated_at: string
}

type BankDetailRow = {
  id: string
  olympiad_id: string
  grade_category: QuestionBankGradeCategory
  created_at: string
  updated_at: string
  olympiads: OlympiadJoinRow | OlympiadJoinRow[]
  question_bank_tasks: Array<{
    id: string
    bank_id: string
    task_number: number
    question_type: QuestionType
    question_bank_variants: VariantDbRow[] | null
  }> | null
}

type VariantHistoryDbRow = {
  id: string
  variant_id: string
  bank_id: string
  version_from: number
  version_to: number
  changed_by: string | null
  changes: Record<string, { old: unknown; new: unknown }>
  created_at: string
}

export class BankAlreadyExistsError extends Error {
  readonly code = 'BANK_ALREADY_EXISTS'
  readonly existingBankId: string | null

  constructor(existingBankId: string | null) {
    super('Набор вопросов для этого профиля и категории классов уже существует')
    this.existingBankId = existingBankId
  }
}

type QueryResponse<T> = Promise<{
  data: T | null
  error: { message: string; details?: string } | null
}>

interface UntypedSupabaseClient {
  from(table: string): {
    select(columns?: string): {
      order(column: string, opts?: { ascending?: boolean }): QueryResponse<unknown[]>
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          maybeSingle(): QueryResponse<Record<string, unknown>>
        }
        single(): QueryResponse<Record<string, unknown>>
        order(column: string, opts?: { ascending?: boolean }): QueryResponse<unknown[]>
      }
    }
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): {
        select(): {
          single(): QueryResponse<Record<string, unknown>>
        }
      }
    }
    delete(): {
      eq(column: string, value: string): QueryResponse<unknown>
    }
  }
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): QueryResponse<unknown>
}

const db = supabase as unknown as UntypedSupabaseClient

function unwrapOlympiad(
  raw: OlympiadJoinRow | OlympiadJoinRow[],
): OlympiadJoinRow {
  return Array.isArray(raw) ? raw : raw
}

function buildDisplayTitle(
  olympiad: OlympiadJoinRow,
  gradeCategory: QuestionBankGradeCategory,
): string {
  const baseName = olympiad.profile_title?.trim() || olympiad.title
  const seasonPart = olympiad.season?.trim()
    ? `, ${olympiad.season}`
    : `, ${olympiad.year}`
  return `${baseName}${seasonPart} — ${GRADE_LABELS[gradeCategory]}`
}
export async function listQuestionBanks(): Promise<QuestionBankSummary[]> {
  const { data, error } = await db
    .from('question_banks')
    .select(`
      id,
      olympiad_id,
      grade_category,
      created_at,
      updated_at,
      olympiads!inner (
        title,
        profile_title,
        season,
        year
      ),
      question_bank_tasks (
        id,
        question_bank_variants ( id )
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as BankListRow[]

  return rows.map((row) => {
    const olympiad = unwrapOlympiad(row.olympiads)
    const tasks = row.question_bank_tasks ?? []
    const variantsCount = tasks.reduce(
      (sum, t) => sum + (t.question_bank_variants?.length ?? 0),
      0,
    )

    return {
      id: row.id,
      olympiadId: row.olympiad_id,
      olympiadTitle: olympiad.title,
      olympiadProfileTitle: olympiad.profile_title,
      olympiadSeason: olympiad.season,
      olympiadYear: olympiad.year,
      gradeCategory: row.grade_category,
      displayTitle: buildDisplayTitle(olympiad, row.grade_category),
      tasksCount: tasks.length,
      variantsCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

export async function findExistingQuestionBank(
  olympiadId: string,
  gradeCategory: QuestionBankGradeCategory,
): Promise<{ id: string } | null> {
  const { data, error } = await db
    .from('question_banks')
    .select('id')
    .eq('olympiad_id', olympiadId)
    .eq('grade_category', gradeCategory)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data && typeof data.id === 'string' ? { id: data.id } : null
}

export async function getQuestionBankById(
  bankId: string,
): Promise<QuestionBankDetail> {
  const { data, error } = await db
    .from('question_banks')
    .select(`
      id,
      olympiad_id,
      grade_category,
      created_at,
      updated_at,
      olympiads!inner (
        title,
        profile_title,
        season,
        year
      ),
      question_bank_tasks (
        id,
        bank_id,
        task_number,
        question_type,
        question_bank_variants (
          id,
          task_id,
          bank_id,
          row_number,
          question_text,
          options,
          correct_answer,
          points,
          current_version,
          created_at,
          updated_at
        )
      )
    `)
    .eq('id', bankId)
    .single()

  if (error) throw new Error(error.message)

  const row = data as unknown as BankDetailRow
  const olympiad = unwrapOlympiad(row.olympiads)

  const tasks: QuestionTask[] = (row.question_bank_tasks ?? [])
    .slice()
    .sort((a, b) => a.task_number - b.task_number)
    .map((t) => ({
      id: t.id,
      bankId: t.bank_id,
      taskNumber: t.task_number,
      questionType: t.question_type,
      variants: (t.question_bank_variants ?? [])
        .slice()
        .sort((a, b) => a.row_number - b.row_number)
        .map(
          (v): QuestionVariant => ({
            id: v.id,
            taskId: v.task_id,
            bankId: v.bank_id,
            rowNumber: v.row_number,
            questionText: v.question_text,
            options: v.options,
            correctAnswer: v.correct_answer,
            points: Number(v.points),
            currentVersion: v.current_version,
            createdAt: v.created_at,
            updatedAt: v.updated_at,
          }),
        ),
    }))

  const variantsCount = tasks.reduce((sum, t) => sum + t.variants.length, 0)

  return {
    id: row.id,
    olympiadId: row.olympiad_id,
    olympiadTitle: olympiad.title,
    olympiadProfileTitle: olympiad.profile_title,
    olympiadSeason: olympiad.season,
    olympiadYear: olympiad.year,
    gradeCategory: row.grade_category,
    displayTitle: buildDisplayTitle(olympiad, row.grade_category),
    tasksCount: tasks.length,
    variantsCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks,
  }
}

export async function saveOrReplaceQuestionBank(params: {
  olympiadId: string
  gradeCategory: QuestionBankGradeCategory
  tasks: ImportTaskInput[]
  replaceExisting?: boolean
}): Promise<{ bankId: string }> {
  const { data, error } = await db.rpc('upsert_question_bank', {
    p_olympiad_id: params.olympiadId,
    p_grade_category: params.gradeCategory,
    p_tasks: params.tasks,
    p_replace_existing: params.replaceExisting ?? false,
  })

  if (error) {
    if (error.message.includes('BANK_ALREADY_EXISTS')) {
      throw new BankAlreadyExistsError(error.details || null)
    }
    throw new Error(error.message)
  }

  return { bankId: String(data) }
}

export async function updateQuestionVariant(
  variantId: string,
  input: UpdateQuestionVariantInput,
): Promise<QuestionVariant> {
  const { data, error } = await db
    .from('question_bank_variants')
    .update({
      question_text: input.questionText,
      options: input.options,
      correct_answer: input.correctAnswer,
      points: input.points,
    })
    .eq('id', variantId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  const v = data as unknown as VariantDbRow

  return {
    id: v.id,
    taskId: v.task_id,
    bankId: v.bank_id,
    rowNumber: v.row_number,
    questionText: v.question_text,
    options: v.options,
    correctAnswer: v.correct_answer,
    points: Number(v.points),
    currentVersion: v.current_version,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }
}

export async function deleteQuestionBank(bankId: string): Promise<void> {
  const { error } = await db
    .from('question_banks')
    .delete()
    .eq('id', bankId)

  if (error) throw new Error(error.message)
}

export async function getVariantHistory(
  variantId: string,
): Promise<QuestionVariantHistoryEntry[]> {
  const { data, error } = await db
    .from('question_variant_history')
    .select('*')
    .eq('variant_id', variantId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as VariantHistoryDbRow[]

  return rows.map((row) => ({
    id: row.id,
    variantId: row.variant_id,
    bankId: row.bank_id,
    versionFrom: row.version_from,
    versionTo: row.version_to,
    changedBy: row.changed_by,
    changes: row.changes,
    createdAt: row.created_at,
  }))
}
