// src/entities/question-bank/excel/types.ts
import type {
  CorrectAnswerPayload,
  ImportTaskInput,
  MatchingPair,
  QuestionType,
} from '../types'

export type ImportValidationError = {
  rowNumber: number | null
  field: string
  message: string
}

export type ExcelParseResult = {
  isValid: boolean
  tasks: ImportTaskInput[]
  errors: ImportValidationError[]
  stats: {
    totalRows: number
    tasksCount: number
    variantsCount: number
    byType: Record<QuestionType, number>
  }
}

export type ParsedRow = {
  excelLine: number        // номер строки в Excel (для ошибок)
  rowNum: number | null    // № вопроса
  taskNum: number | null   // № задания
  points: number | null    // балл
  questionType: QuestionType | null
  questionText: string
  rawVariants: string[]    // 6 строк
  rawCorrect: string
}

export type ValidatorContext = {
  row: ParsedRow
  filledVariants: { index: number; text: string }[]
  errors: ImportValidationError[]
}

export type ValidatorResult = {
  options: string[] | MatchingPair[]
  correctAnswer: CorrectAnswerPayload
}

export type Validator = (ctx: ValidatorContext) => ValidatorResult | null