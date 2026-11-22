import type {
  CorrectAnswerPayload,
  ImportTaskInput,
  MatchingPair,
  QuestionType,
} from '@/entities/question-bank'

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
  'соответствие': 'matching',
  'короткий ответ': 'short_answer',
  'последовательность': 'sequence',
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  const copy = new Uint8Array(compressed.byteLength)
  copy.set(compressed)
  void writer.write(copy)
  void writer.close()
  const buf = await new Response(ds.readable).arrayBuffer()
  return new Uint8Array(buf)
}

async function unzipXlsxEntries(
  buffer: ArrayBuffer,
): Promise<Map<string, string>> {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8')
  const entries = new Map<string, string>()

  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Файл не является корректным архивом .xlsx')
  }

  const cdCount = view.getUint16(eocdOffset + 10, true)
  let cdOffset = view.getUint32(eocdOffset + 16, true)

  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break
    const method = view.getUint16(cdOffset + 10, true)
    const compSize = view.getUint32(cdOffset + 20, true)
    const nameLen = view.getUint16(cdOffset + 28, true)
    const extraLen = view.getUint16(cdOffset + 30, true)
    const commentLen = view.getUint16(cdOffset + 32, true)
    const localHeaderOffset = view.getUint32(cdOffset + 42, true)

    const fileName = decoder.decode(
      bytes.slice(cdOffset + 46, cdOffset + 46 + nameLen),
    )
    cdOffset += 46 + nameLen + extraLen + commentLen

    if (!fileName.endsWith('.xml') && !fileName.endsWith('.rels')) continue

    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const rawData = bytes.slice(dataStart, dataStart + compSize)

    let contentBytes: Uint8Array
    if (method === 0) {
      contentBytes = rawData
    } else if (method === 8) {
      contentBytes = await inflateRaw(rawData)
    } else {
      continue
    }
    entries.set(fileName, decoder.decode(contentBytes))
  }

  return entries
}

function colRefToIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, '').toUpperCase()
  let idx = 0
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64)
  }
  return idx - 1
}

function extractRowsFromXml(entries: Map<string, string>): string[][] {
  const parser = new DOMParser()
  const sharedStrings: string[] = []

  const sstXml = entries.get('xl/sharedStrings.xml')
  if (sstXml) {
    const sstDoc = parser.parseFromString(sstXml, 'application/xml')
    const siNodes = Array.from(sstDoc.getElementsByTagName('si'))
    for (const si of siNodes) {
      const tNodes = Array.from(si.getElementsByTagName('t'))
      sharedStrings.push(tNodes.map((n) => n.textContent ?? '').join(''))
    }
  }

  const sheetKey =
    Array.from(entries.keys())
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
      .sort()[0] ?? ''

  const sheetXml = entries.get(sheetKey)
  if (!sheetXml) {
    throw new Error('В файле .xlsx не найден рабочий лист с вопросами')
  }

  const sheetDoc = parser.parseFromString(sheetXml, 'application/xml')
  const rowNodes = Array.from(sheetDoc.getElementsByTagName('row'))
  const rows: string[][] = []

  for (const rowNode of rowNodes) {
    const cells = Array.from(rowNode.getElementsByTagName('c'))
    const rowValues: string[] = []
    for (const cell of cells) {
      const ref = cell.getAttribute('r') ?? ''
      const colIdx = ref ? colRefToIndex(ref) : rowValues.length
      const type = cell.getAttribute('t')
      let value = ''

      if (type === 's') {
        const vText = cell.getElementsByTagName('v')[0]?.textContent ?? ''
        const ssIdx = Number(vText)
        value = Number.isInteger(ssIdx) ? (sharedStrings[ssIdx] ?? '') : ''
      } else if (type === 'inlineStr') {
        const tNodes = Array.from(cell.getElementsByTagName('t'))
        value = tNodes.map((n) => n.textContent ?? '').join('')
      } else {
        value = cell.getElementsByTagName('v')[0]?.textContent ?? ''
      }

      while (rowValues.length < colIdx) {
        rowValues.push('')
      }
      rowValues[colIdx] = value.trim()
    }
    if (rowValues.some((v) => v !== '')) {
      rows.push(rowValues)
    }
  }

  return rows
}
export async function parseAndValidateExcelFile(
  file: File,
): Promise<ExcelParseResult> {
  const emptyStats = {
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

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return {
      isValid: false,
      tasks: [],
      errors: [
        {
          rowNumber: null,
          field: 'Файл',
          message: 'Допускаются только файлы в формате .xlsx',
        },
      ],
      stats: emptyStats,
    }
  }

  let rows: string[][]
  try {
    const buffer = await file.arrayBuffer()
    const entries = await unzipXlsxEntries(buffer)
    rows = extractRowsFromXml(entries)
  } catch (err) {
    return {
      isValid: false,
      tasks: [],
      errors: [
        {
          rowNumber: null,
          field: 'Файл',
          message:
            err instanceof Error
              ? err.message
              : 'Не удалось прочитать структуру файла .xlsx',
        },
      ],
      stats: emptyStats,
    }
  }

  if (rows.length < 2) {
    return {
      isValid: false,
      tasks: [],
      errors: [
        {
          rowNumber: null,
          field: 'Таблица',
          message: 'Файл не содержит строк с вопросами',
        },
      ],
      stats: emptyStats,
    }
  }

  const errors: ImportValidationError[] = []
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

  const seenRowNumbers = new Set<number>()
  const taskGroups = new Map<
    number,
    {
      taskNumber: number
      questionType: QuestionType
      variants: ImportTaskInput['variants']
    }
  >()

  const dataRows = rows.slice(1)
  emptyStats.totalRows = dataRows.length

  dataRows.forEach((cols, index) => {
    const excelLine = index + 2
    const rawRowNum = (cols.at(0) ?? '').trim()
    const rawTaskNum = (cols.at(1) ?? '').trim()
    const rawPoints = (cols.at(2) ?? '').trim().replace(',', '.')
    const rawType = (cols.at(3) ?? '').trim()
    const questionText = (cols.at(4) ?? '').trim()
    const rawVariants = [
      cols.at(5) ?? '',
      cols.at(6) ?? '',
      cols.at(7) ?? '',
      cols.at(8) ?? '',
      cols.at(9) ?? '',
      cols.at(10) ?? '',
    ].map((v) => v.trim())
    const rawCorrect = (cols.at(11) ?? '').trim()

    const rowNum = Number(rawRowNum)
    if (!rawRowNum || !Number.isInteger(rowNum) || rowNum <= 0) {
      errors.push({
        rowNumber: excelLine,
        field: '№',
        message: 'Номер вопроса должен быть положительным целым числом',
      })
    } else if (seenRowNumbers.has(rowNum)) {
      errors.push({
        rowNumber: excelLine,
        field: '№',
        message: `Дублирующийся номер вопроса №${rowNum}`,
      })
    } else {
      seenRowNumbers.add(rowNum)
    }

    const taskNum = Number(rawTaskNum)
    if (!rawTaskNum || !Number.isInteger(taskNum) || taskNum <= 0) {
      errors.push({
        rowNumber: excelLine,
        field: 'Задание',
        message: 'Номер задания должен быть положительным целым числом',
      })
    }

    const points = Number(rawPoints)
    if (!rawPoints || Number.isNaN(points) || points <= 0) {
      errors.push({
        rowNumber: excelLine,
        field: 'Балл',
        message: 'Балл должен быть положительным числом',
      })
    }

    const mappedType = TYPE_MAP[rawType.toLowerCase()]
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

    if (!mappedType) return

    const filledVariants: { index: number; text: string }[] = []
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
        filledVariants.push({ index: idx + 1, text: val })
      } else {
        hasGap = true
      }
    })
    let options: string[] | MatchingPair[] = []
    let correctAnswer: CorrectAnswerPayload = null

    if (mappedType === 'single_choice') {
      if (filledVariants.length < 2) {
        errors.push({
          rowNumber: excelLine,
          field: 'Вар.1–Вар.6',
          message: 'Для типа «Один ответ» нужно минимум 2 варианта ответа',
        })
      }
      options = filledVariants.map((v) => v.text)
      const ansNum = Number(rawCorrect)
      if (
        !rawCorrect ||
        !Number.isInteger(ansNum) ||
        ansNum < 1 ||
        ansNum > filledVariants.length
      ) {
        errors.push({
          rowNumber: excelLine,
          field: 'Правильный ответ',
          message: `Укажите номер варианта от 1 до ${filledVariants.length || 6}`,
        })
      } else {
        correctAnswer = ansNum
      }
    } else if (mappedType === 'multiple_choice') {
      if (filledVariants.length < 2) {
        errors.push({
          rowNumber: excelLine,
          field: 'Вар.1–Вар.6',
          message: 'Для типа «Несколько ответов» нужно минимум 2 варианта ответа',
        })
      }
      options = filledVariants.map((v) => v.text)
      const parts = rawCorrect
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      const nums = parts.map((p) => Number(p))
      const uniqueNums = new Set(nums)
      if (
        parts.length < 1 ||
        nums.some(
          (n) => !Number.isInteger(n) || n < 1 || n > filledVariants.length,
        ) ||
        uniqueNums.size !== nums.length
      ) {
        errors.push({
          rowNumber: excelLine,
          field: 'Правильный ответ',
          message:
            'Укажите уникальные номера правильных вариантов через «;» (например, 1;3)',
        })
      } else {
        correctAnswer = nums.sort((a, b) => a - b)
      }
    } else if (mappedType === 'matching') {
      if (filledVariants.length < 2) {
        errors.push({
          rowNumber: excelLine,
          field: 'Вар.1–Вар.6',
          message: 'Для типа «Соответствие» нужно минимум 2 пары',
        })
      }
      const pairs: MatchingPair[] = []
      for (const item of filledVariants) {
        const splitIdx = item.text.indexOf('|')
        if (splitIdx === -1) {
          errors.push({
            rowNumber: excelLine,
            field: `Вар.${item.index}`,
            message: 'Пара должна содержать разделитель «|» (Понятие | Определение)',
          })
        } else {
          const left = item.text.slice(0, splitIdx).trim()
          const right = item.text.slice(splitIdx + 1).trim()
          if (!left || !right) {
            errors.push({
              rowNumber: excelLine,
              field: `Вар.${item.index}`,
              message: 'Обе части пары вокруг «|» должны быть заполнены',
            })
          }
          pairs.push({ left, right })
        }
      }
      options = pairs
      correctAnswer = null
      if (rawCorrect !== '') {
        errors.push({
          rowNumber: excelLine,
          field: 'Правильный ответ',
          message: 'Для типа «Соответствие» столбец «Правильный ответ» должен быть пустым',
        })
      }
    } else if (mappedType === 'short_answer') {
      if (filledVariants.length > 0) {
        errors.push({
          rowNumber: excelLine,
          field: 'Вар.1–Вар.6',
          message: 'Для типа «Короткий ответ» поля вариантов должны быть пустыми',
        })
      }
      const accepted = rawCorrect
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      if (accepted.length === 0) {
        errors.push({
          rowNumber: excelLine,
          field: 'Правильный ответ',
          message: 'Укажите хотя бы один правильный ответ (несколько — через «;»)',
        })
      }
      options = []
      correctAnswer = accepted
    } else if (mappedType === 'sequence') {
      if (filledVariants.length < 2) {
        errors.push({
          rowNumber: excelLine,
          field: 'Вар.1–Вар.6',
          message: 'Для типа «Последовательность» нужно минимум 2 шага',
        })
      }
      options = filledVariants.map((v) => v.text)
      correctAnswer = null
      if (rawCorrect !== '') {
        errors.push({
          rowNumber: excelLine,
          field: 'Правильный ответ',
          message: 'Для типа «Последовательность» столбец «Правильный ответ» должен быть пустым',
        })
      }
    }

    if (Number.isInteger(taskNum) && taskNum > 0) {
      const variantRowNum =
        Number.isInteger(rowNum) && rowNum > 0 ? rowNum : excelLine
      const existing = taskGroups.get(taskNum)
      if (existing) {
        if (existing.questionType !== mappedType) {
          errors.push({
            rowNumber: excelLine,
            field: 'Тип',
            message: `Все варианты задания №${taskNum} должны иметь одинаковый тип`,
          })
        }
        existing.variants.push({
          rowNumber: variantRowNum,
          questionText,
          options,
          correctAnswer,
          points: Number.isNaN(points) ? 1 : points,
        })
      } else {
        taskGroups.set(taskNum, {
          taskNumber: taskNum,
          questionType: mappedType,
          variants: [
            {
              rowNumber: variantRowNum,
              questionText,
              options,
              correctAnswer,
              points: Number.isNaN(points) ? 1 : points,
            },
          ],
        })
      }
      emptyStats.byType[mappedType] += 1
    }
  })

  const tasks = Array.from(taskGroups.values()).sort(
    (a, b) => a.taskNumber - b.taskNumber,
  )
  emptyStats.tasksCount = tasks.length
  emptyStats.variantsCount = tasks.reduce(
    (sum, t) => sum + t.variants.length,
    0,
  )

  return {
    isValid: errors.length === 0 && tasks.length > 0,
    tasks,
    errors,
    stats: emptyStats,
  }
}
