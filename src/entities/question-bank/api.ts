import { supabase } from '@/shared/supabase'
import type {
  ImportTaskInput,
  QuestionBankDetail,
  QuestionBankGradeCategory,
  QuestionBankSummary,
  QuestionTask,
  QuestionVariant,
  QuestionVariantHistoryEntry,
  UpdateQuestionVariantInput,
} from './types'

const GRADE_LABELS: Record<QuestionBankGradeCategory, string> = {
  '6-7': '6–7 классы',
  '8-9': '8–9 классы',
  '10-11': '10–11 классы',
}

function buildDisplayTitle(
  olympiad: {
    title: string
    profile_title: string | null
    season: string | null
    year: number
  },
  gradeCategory: QuestionBankGradeCategory,
): string {
  const baseName = olympiad.profile_title?.trim() || olympiad.title
  const seasonPart = olympiad.season?.trim()
    ? `, ${olympiad.season}`
    : `, ${olympiad.year}`
  return `${baseName}${seasonPart} — ${GRADE_LABELS[gradeCategory]}`
}

export async function listQuestionBanks(): Promise<QuestionBankSummary[]> {
  const { data, error } = await supabase
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

  return (data ?? []).map((row: any) => {
    const olympiad = Array.isArray(row.olympiads)
      ? row.olympiads
      : row.olympiads
    const tasks = row.question_bank_tasks ?? []
    const variantsCount = tasks.reduce(
      (sum: number, t: any) => sum + (t.question_bank_variants?.length ?? 0),
      0,
    )
    const gradeCategory = row.grade_category as QuestionBankGradeCategory

    return {
      id: row.id,
      olympiadId: row.olympiad_id,
      olympiadTitle: olympiad.title,
      olympiadProfileTitle: olympiad.profile_title,
      olympiadSeason: olympiad.season,
      olympiadYear: olympiad.year,
      gradeCategory,
      displayTitle: buildDisplayTitle(olympiad, gradeCategory),
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
  const { data, error } = await supabase
    .from('question_banks')
    .select('id')
    .eq('olympiad_id', olympiadId)
    .eq('grade_category', gradeCategory)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? { id: data.id } : null
}

export async function getQuestionBankById(
  bankId: string,
): Promise<QuestionBankDetail> {
  const { data, error } = await supabase
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

  const olympiad = Array.isArray(data.olympiads)
    ? data.olympiads
    : data.olympiads
  const gradeCategory = data.grade_category as QuestionBankGradeCategory

  const tasks: QuestionTask[] = (data.question_bank_tasks ?? [])
    .sort((a: any, b: any) => a.task_number - b.task_number)
    .map((t: any) => ({
      id: t.id,
      bankId: t.bank_id,
      taskNumber: t.task_number,
      questionType: t.question_type,
      variants: (t.question_bank_variants ?? [])
        .sort((a: any, b: any) => a.row_number - b.row_number)
        .map(
          (v: any): QuestionVariant => ({
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
    id: data.id,
    olympiadId: data.olympiad_id,
    olympiadTitle: olympiad.title,
    olympiadProfileTitle: olympiad.profile_title,
    olympiadSeason: olympiad.season,
    olympiadYear: olympiad.year,
    gradeCategory,
    displayTitle: buildDisplayTitle(olympiad, gradeCategory),
    tasksCount: tasks.length,
    variantsCount,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    tasks,
  }
}

export async function saveOrReplaceQuestionBank(params: {
  olympiadId: string
  gradeCategory: QuestionBankGradeCategory
  tasks: ImportTaskInput[]
  replaceExisting?: boolean
}): Promise<{ bankId: string }> {
  const { data, error } = await supabase.rpc('upsert_question_bank', {
    p_olympiad_id: params.olympiadId,
    p_grade_category: params.gradeCategory,
    p_tasks: params.tasks,
    p_replace_existing: params.replaceExisting ?? false,
  })

  if (error) {
    if (error.message.includes('BANK_ALREADY_EXISTS')) {
      const err = new Error(
        'Набор вопросов для этого профиля и категории классов уже существует',
      )
      ;(err as any).code = 'BANK_ALREADY_EXISTS'
      ;(err as any).existingBankId = error.details || null
      throw err
    }
    throw new Error(error.message)
  }

  return { bankId: data as string }
}

export async function updateQuestionVariant(
  variantId: string,
  input: UpdateQuestionVariantInput,
): Promise<QuestionVariant> {
  const { data, error } = await supabase
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

  return {
    id: data.id,
    taskId: data.task_id,
    bankId: data.bank_id,
    rowNumber: data.row_number,
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer,
    points: Number(data.points),
    currentVersion: data.current_version,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteQuestionBank(bankId: string): Promise<void> {
  const { error } = await supabase
    .from('question_banks')
    .delete()
    .eq('id', bankId)

  if (error) throw new Error(error.message)
}

export async function getVariantHistory(
  variantId: string,
): Promise<QuestionVariantHistoryEntry[]> {
  const { data, error } = await supabase
    .from('question_variant_history')
    .select('*')
    .eq('variant_id', variantId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
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
