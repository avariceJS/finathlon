import type { Sheet } from 'read-excel-file/browser'
import type { SheetData } from 'write-excel-file/browser'

import {
  DEMO_GRADES,
  DEMO_KINDS,
  DEMO_PROFILES,
  DEMO_SIZE,
  demoDateFormat,
  demoSolutions,
  validateDemoQuestion,
  type DemoAttempt,
  type DemoCategory,
  type DemoImportIssue,
  type DemoImportPreview,
  type DemoKind,
  type DemoQuestion,
} from './model'

const cellText = (value: unknown) => (value == null ? '' : String(value).trim())
const normalized = (value: string) =>
  value.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()

function sheetCategory(name: string): DemoCategory | null {
  const match =
    /^(фин(?:ансовый|ансовая грамотность)?|инф(?:орматика)?)[_ ](6-7|8-9|10-11)$/.exec(
      normalized(name),
    )
  if (!match) return null
  return {
    profile: match[1].startsWith('фин') ? 'finance' : 'informatics',
    grades: match[2] as DemoCategory['grades'],
  }
}

function defaultKind(number: number): DemoKind {
  if (number <= 15) return 'single'
  if (number <= 20) return 'multiple'
  if (number <= 24) return 'matching'
  if (number <= 27) return 'short'
  return 'sequence'
}

export async function previewDemoWorkbook(
  file: File,
): Promise<DemoImportPreview> {
  if (
    !/\.xlsx$/i.test(file.name) ||
    !file.size ||
    file.size > 5 * 1024 * 1024
  ) {
    throw new Error('Выберите непустой файл .xlsx размером до 5 МБ.')
  }
  const { default: readWorkbook } = await import('read-excel-file/browser')
  let sheets: Sheet[]
  try {
    sheets = await readWorkbook(file)
  } catch {
    throw new Error(
      'Не удалось открыть книгу Excel. Проверьте формат файла .xlsx.',
    )
  }
  const questions: DemoQuestion[] = []
  const reports: DemoImportPreview['reports'] = []
  const fileIssues: DemoImportIssue[] = []
  const seen = new Set<string>()

  for (const { sheet, data } of sheets) {
    if (normalized(sheet) === 'инструкция') continue
    const category = sheetCategory(sheet)
    if (!category) {
      fileIssues.push({
        sheet,
        row: null,
        messages: [
          'Имя листа должно соответствовать шаблону, например «Фин_6-7» или «Инф_10-11».',
        ],
      })
      continue
    }
    const key = `${category.profile}/${category.grades}`
    if (seen.has(key)) {
      throw new Error(
        `Для одной категории указано несколько листов. Проверьте лист «${sheet}».`,
      )
    }
    seen.add(key)
    const headers = [
      '№',
      'тип',
      'вопрос',
      ...Array.from({ length: 6 }, (_, index) => `вар.${index + 1}`),
      'правильный ответ',
    ]
    const pointsHeader =
      data[1]?.map((value) => normalized(cellText(value))) ?? []
    const validHeader =
      headers.every((label, index) => {
        const value = pointsHeader[index]
        return value === label || (label === 'тип' && value === 'тип (авто)')
      }) && pointsHeader[12] === 'пояснение'
    const pointsColumn = pointsHeader.findIndex((value) =>
      ['балл', 'баллы'].includes(value),
    )
    const issues: DemoImportIssue[] = []
    const rows: { row: number; cells: string[]; points: string }[] = []
    data.slice(2).forEach((row, index) => {
      const cells = Array.from({ length: 13 }, (_, column) =>
        cellText(row[column]),
      )
      const points = cellText(row[pointsColumn])
      if ([...cells.slice(0, 10), cells[12], points].some(Boolean))
        rows.push({ row: index + 3, cells, points })
    })

    if (!validHeader) {
      const messages = [
        'Строка заголовков не соответствует шаблону. Проверьте столбцы №, Тип, Вопрос, Вар.1–Вар.6, Правильный ответ и Пояснение.',
      ]
      issues.push({ sheet, row: 2, messages })
      reports.push({ ...category, found: rows.length, uploaded: 0, issues })
      continue
    }

    const occurrences = new Map<number, number>()
    for (const { cells } of rows) {
      const number = Number(cells[0])
      occurrences.set(number, (occurrences.get(number) ?? 0) + 1)
    }
    let uploaded = 0
    for (const { row, cells, points } of rows) {
      const [rawNumber, rawKind, prompt] = cells
      const number = Number(rawNumber)
      const messages: string[] = []
      const kind = rawKind
        ? (Object.keys(DEMO_KINDS) as DemoKind[]).find(
            (value) => normalized(DEMO_KINDS[value]) === normalized(rawKind),
          )
        : defaultKind(number)
      if (!Number.isInteger(number) || number < 1 || number > DEMO_SIZE)
        messages.push('В поле «№» нужен номер от 1 до 30.')
      else if ((occurrences.get(number) ?? 0) > 1)
        messages.push(`Номер задания ${number} повторяется на листе.`)
      if (!kind) messages.push(`Неизвестный тип задания «${rawKind}».`)

      if (kind) {
        const filled = cells
          .slice(3, 9)
          .flatMap((value, index) =>
            value ? [{ value, id: String(index + 1) }] : [],
          )
        const pairs =
          kind === 'matching'
            ? filled.map(({ value }) =>
                value.split('|').map((side) => side.trim()),
              )
            : []
        if (pairs.some((pair) => pair.length !== 2))
          messages.push(
            'Запишите каждую пару в формате «понятие | определение».',
          )
        if (kind === 'short' && filled.length)
          messages.push(
            'Для короткого ответа оставьте столбцы вариантов пустыми.',
          )
        const solutions = ['matching', 'sequence'].includes(kind)
          ? []
          : demoSolutions(kind, cells[9])
        const body = {
          kind,
          prompt,
          options:
            kind === 'matching'
              ? pairs.map((pair) => pair[0])
              : kind === 'short'
                ? []
                : filled.map((option) => option.value),
          counterparts: pairs.map((pair) => pair[1] ?? ''),
          solutions:
            kind === 'single' || kind === 'multiple'
              ? solutions.map((id) =>
                  String(filled.findIndex((option) => option.id === id) + 1),
                )
              : solutions,
          points: points ? Number(points) : 1,
          explanation: cells[12],
        }
        messages.push(...validateDemoQuestion(body))
        if (!messages.length) {
          questions.push({ ...category, number, body })
          uploaded += 1
        }
      }
      if (messages.length) {
        const knownNumber =
          Number.isInteger(number) && number >= 1 && number <= DEMO_SIZE
        issues.push({
          sheet,
          row,
          messages,
          ...(knownNumber ? { number } : {}),
        })
      }
    }
    if (!rows.length)
      issues.push({ sheet, row: null, messages: ['На листе нет вопросов.'] })
    reports.push({ ...category, found: rows.length, uploaded, issues })
  }

  if (!reports.length && !fileIssues.length) {
    fileIssues.push({
      sheet: file.name,
      row: null,
      messages: ['В книге нет листов с вопросами.'],
    })
  }
  return { questions, reports, fileIssues }
}

export async function exportDemoAttempts(attempts: DemoAttempt[]) {
  const { default: writeWorkbook } = await import('write-excel-file/browser')
  const header = [
    'Дата и время (МСК)',
    'Профиль',
    'Классы',
    'Регион',
    'Город',
    'Правильных ответов',
    'Всего вопросов',
    'Набрано баллов',
    'Максимум баллов',
    'Номера вопросов с ошибками',
  ]
  const rows: SheetData = [
    header.map((value) => ({ value, fontWeight: 'bold' })),
    ...attempts.map((attempt) => [
      demoDateFormat.format(new Date(attempt.completed_at)),
      DEMO_PROFILES[attempt.profile],
      DEMO_GRADES[attempt.grades],
      attempt.region,
      attempt.city,
      attempt.correct_count,
      attempt.question_count,
      attempt.score,
      attempt.max_score,
      attempt.incorrect_numbers.join(', '),
    ]),
  ]
  const columns = [23, 29, 17, 28, 25, 24, 18, 19, 19, 36].map((width) => ({
    width,
  }))
  await writeWorkbook(rows, {
    sheet: 'Результаты',
    columns,
    stickyRowsCount: 1,
  }).toFile('demo-test-results.xlsx')
}
