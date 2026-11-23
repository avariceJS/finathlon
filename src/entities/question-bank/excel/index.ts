// src/entities/question-bank/excel/index.ts
import type {
  CorrectAnswerPayload,
  ImportTaskInput,
  QuestionType,
} from '../types'
import type {
  ExcelParseResult,
  ImportValidationError,
  ParsedRow,
} from './types'
import { readXlsxRows } from './xlsx-reader'
import { VALIDATORS } from './validators'

const EXPECTED_HEADERS = [
  '№',
  'Задание',
  'Балл',
  'Тип',
  'Вопрос',
  'Вар.1',
  'Вар.2',
  'Вар.3',
  'Вар.4',
  'Вар.5',
  'Вар.6',
  'Правильный ответ',
]

const TYPE_MAP: Record<string, QuestionType> = {
  'один ответ': 'single_choice',
  'несколько ответов': 'multiple_choice',
  соответствие: 'matching',
  'короткий ответ': 'short_answer',
  последовательность: 'sequence',
}

const EMPTY_STATS = {
  totalRows: 0,
  tasksCount: 0,
  variantsCount: 0,
  byType: {
    single_choice: 0,
    multiple_choice: 0,
    matching: 0,
    short_answer: 0,
    sequence: 0,
  } as Record<QuestionType, number>,
}

function makeErrorResult(message: string): ExcelParseResult {
  return {
    isValid: false,
    tasks: [],
    errors: [{ rowNumber: null, field: 'Файл', message }],
    stats: { ...EMPTY_STATS, byType: { ...EMPTY_STATS.byType } },
  }
}

function parseRow(
  cols: string[],
  excelLine: number,
  errors: ImportValidationError[],
): ParsedRow | null {
  const rawRowNum = (cols.at(0) ?? '').trim()
  const rawTaskNum = (cols.at(1) ?? '').trim()
  const rawPoints = (cols.at(2) ?? '').trim().replace(',', '.')
  const rawType = (cols.at(3) ?? '').trim()
  const questionText = (cols.at(4) ?? '').trim()
  const rawVariants = [5, 6, 7, 8, 9, 10].map((i) => (cols.at(i) ?? '').trim())
  const rawCorrect = (cols.at(11) ?? '').trim()

  // Валидация базовых полей
  const rowNum = Number(rawRowNum)
  if (
    !rawRowNum ||
    !Number.isInteger(rowNum) ||
    rowNum <= 0 ||
    rowNum > 2147483647
  ) {
    errors.push({
      rowNumber: excelLine,
      field: '№',
      message: 'Номер вопроса должен быть положительным целым числом',
    })
  }

  const taskNum = Number(rawTaskNum)
  if (
    !rawTaskNum ||
    !Number.isInteger(taskNum) ||
    taskNum <= 0 ||
    taskNum > 2147483647
  ) {
    errors.push({
      rowNumber: excelLine,
      field: 'Задание',
      message: 'Номер задания должен быть положительным целым числом',
    })
  }

  const points = Number(rawPoints)
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(rawPoints) ||
    points < 0.01 ||
    points > 9999.99
  ) {
    errors.push({
      rowNumber: excelLine,
      field: 'Балл',
      message:
        'Балл должен быть от 0,01 до 9999,99, до двух знаков после запятой',
    })
  }

  const typeKey = rawType.toLowerCase()
  const mappedType = Object.hasOwn(TYPE_MAP, typeKey)
    ? TYPE_MAP[typeKey]
    : undefined
  if (!mappedType) {
    errors.push({
      rowNumber: excelLine,
      field: 'Тип',
      message: `Неизвестный тип вопроса «${rawType || 'пусто'}»`,
    })
  }

  if (!questionText) {
    errors.push({
      rowNumber: excelLine,
      field: 'Вопрос',
      message: 'Текст вопроса не может быть пустым',
    })
  }

  return {
    excelLine,
    rowNum: Number.isInteger(rowNum) && rowNum > 0 ? rowNum : null,
    taskNum: Number.isInteger(taskNum) && taskNum > 0 ? taskNum : null,
    points: !Number.isNaN(points) && points > 0 ? points : null,
    questionType: mappedType ?? null,
    questionText,
    rawVariants,
    rawCorrect,
  }
}

function extractFilledVariants(
  rawVariants: string[],
  excelLine: number,
  errors: ImportValidationError[],
): { index: number; text: string }[] {
  const filled: { index: number; text: string }[] = []
  let hasGap = false

  rawVariants.forEach((val, idx) => {
    if (val !== '') {
      if (hasGap) {
        errors.push({
          rowNumber: excelLine,
          field: `Вар.${idx + 1}`,
          message: 'Варианты ответов должны идти подряд без пустых пропусков',
        })
      }
      filled.push({ index: idx + 1, text: val })
    } else {
      hasGap = true
    }
  })

  return filled
}

export async function parseAndValidateExcelFile(
  file: File,
): Promise<ExcelParseResult> {
  const errors: ImportValidationError[] = []
  const stats = { ...EMPTY_STATS, byType: { ...EMPTY_STATS.byType } }

  // 1. Читаем файл
  let rows: string[][]
  try {
    rows = await readXlsxRows(file)
  } catch (err) {
    return makeErrorResult(
      err instanceof Error ? err.message : 'Не удалось прочитать файл',
    )
  }

  if (rows.length < 2) {
    return makeErrorResult('Файл не содержит строк с вопросами')
  }

  // 2. Проверяем заголовки
  const headerRow = rows.at(0) ?? []
  EXPECTED_HEADERS.forEach((expected, idx) => {
    const actual = (headerRow.at(idx) ?? '').trim()
    if (actual.toLowerCase() !== expected.toLowerCase()) {
      errors.push({
        rowNumber: 1,
        field: `Колонка ${idx + 1}`,
        message: `Ожидался заголовок «${expected}», получено «${actual || 'пусто'}»`,
      })
    }
  })

  // 3. Парсим строки данных
  const dataRows = rows.slice(1)
  stats.totalRows = dataRows.filter((row) => row.some(Boolean)).length
  if (stats.totalRows === 0)
    return makeErrorResult('Файл не содержит строк с вопросами')

  const seenRowNumbers = new Set<number>()
  const taskGroups = new Map<number, ImportTaskInput>()

  dataRows.forEach((cols, index) => {
    if (!cols.some(Boolean)) return
    const excelLine = index + 2
    const row = parseRow(cols, excelLine, errors)
    if (!row) return

    // Проверка уникальности №
    if (row.rowNum !== null) {
      if (seenRowNumbers.has(row.rowNum)) {
        errors.push({
          rowNumber: excelLine,
          field: '№',
          message: `Дублирующийся номер вопроса №${row.rowNum}`,
        })
      } else {
        seenRowNumbers.add(row.rowNum)
      }
    }

    if (!row.questionType) return

    // 4. Извлекаем заполненные варианты
    const filledVariants = extractFilledVariants(
      row.rawVariants,
      excelLine,
      errors,
    )

    // 5. Вызываем нужный валидатор
    const validator = VALIDATORS[row.questionType]
    const result = validator({ row, filledVariants, errors })
    if (!result) return

    // 6. Группируем по заданиям
    if (row.taskNum === null) return

    const variant = {
      rowNumber: row.rowNum ?? excelLine,
      questionText: row.questionText,
      options: result.options,
      correctAnswer: result.correctAnswer as CorrectAnswerPayload,
      points: row.points ?? 1,
    }

    const existing = taskGroups.get(row.taskNum)
    if (existing) {
      if (existing.questionType !== row.questionType) {
        errors.push({
          rowNumber: excelLine,
          field: 'Тип',
          message: `Все варианты задания №${row.taskNum} должны иметь одинаковый тип`,
        })
      }
      existing.variants.push(variant)
    } else {
      taskGroups.set(row.taskNum, {
        taskNumber: row.taskNum,
        questionType: row.questionType,
        variants: [variant],
      })
    }

    stats.byType[row.questionType] += 1
  })

  // 7. Финальная статистика
  const tasks = Array.from(taskGroups.values()).sort(
    (a, b) => a.taskNumber - b.taskNumber,
  )
  stats.tasksCount = tasks.length
  stats.variantsCount = tasks.reduce((sum, t) => sum + t.variants.length, 0)

  return {
    isValid: errors.length === 0 && tasks.length > 0,
    tasks,
    errors,
    stats,
  }
}
