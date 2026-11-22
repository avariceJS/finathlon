export const DEMO_SIZE = 30

export const DEMO_PROFILES = {
  finance: 'Финансовая грамотность',
  informatics: 'Информатика',
} as const

export const DEMO_GRADES = {
  '6-7': '6–7 классы',
  '8-9': '8–9 классы',
  '10-11': '10–11 классы',
} as const

export const DEMO_KINDS = {
  single: 'Один ответ',
  multiple: 'Несколько ответов',
  matching: 'Соответствие',
  short: 'Короткий ответ',
  sequence: 'Последовательность',
} as const

export type DemoProfile = keyof typeof DEMO_PROFILES
export type DemoGrades = keyof typeof DEMO_GRADES
export type DemoKind = keyof typeof DEMO_KINDS

export type DemoCategory = { profile: DemoProfile; grades: DemoGrades }
export type DemoQuestionBody = {
  kind: DemoKind
  prompt: string
  options: string[]
  counterparts: string[]
  solutions: string[]
  points: number
  explanation: string
}
export type DemoQuestion = DemoCategory & {
  number: number
  body: DemoQuestionBody
}
export type DemoPublicQuestion = Omit<
  DemoQuestionBody,
  'solutions' | 'explanation'
> & {
  number: number
}
export type DemoSession = { id: string; questions: DemoPublicQuestion[] }
export type DemoMistake = DemoQuestionBody & {
  number: number
  answer: string[]
}
export type DemoResult = {
  correctCount: number
  questionCount: number
  score: number
  maxScore: number
  mistakes: DemoMistake[]
}

export type DemoImportIssue = {
  sheet: string
  row: number | null
  number?: number
  messages: string[]
}
export type DemoImportReport = DemoCategory & {
  found: number
  uploaded: number
  issues: DemoImportIssue[]
}
export type DemoImportPreview = {
  questions: DemoQuestion[]
  reports: DemoImportReport[]
  fileIssues: DemoImportIssue[]
}

export type DemoAttempt = DemoCategory & {
  id: string
  completed_at: string
  region: string
  city: string
  correct_count: number
  question_count: number
  score: number
  max_score: number
  incorrect_numbers: number[]
}

export type DemoFilters = {
  profile: DemoProfile | ''
  grades: DemoGrades | ''
  from: string
  to: string
  region: string
}

export const demoDateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Moscow',
})

export function demoOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

export function demoCategoryMatches(a: DemoCategory, b: DemoCategory) {
  return a.profile === b.profile && a.grades === b.grades
}

export function validateDemoQuestion(q: DemoQuestionBody): string[] {
  const errors: string[] = []
  if (!q.prompt || q.prompt.length > 10000)
    errors.push('Вопрос должен содержать от 1 до 10 000 символов.')
  if (!q.explanation || q.explanation.length > 10000)
    errors.push('Пояснение должно содержать от 1 до 10 000 символов.')
  if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100)
    errors.push('Баллы должны быть целым числом от 1 до 100.')

  if (q.kind === 'short') {
    if (
      !q.solutions.length ||
      q.solutions.length > 12 ||
      q.solutions.some((value) => !value || value.length > 2000)
    ) {
      errors.push(
        'В поле «Правильный ответ» укажите от 1 до 12 допустимых ответов через точку с запятой.',
      )
    }
    return errors
  }

  if (
    q.options.length < 2 ||
    q.options.length > 6 ||
    q.options.some((value) => !value || value.length > 2000) ||
    new Set(q.options).size !== q.options.length
  ) {
    errors.push(
      'Нужно от 2 до 6 разных, заполненных вариантов до 2 000 символов каждый.',
    )
  }
  if (
    q.kind === 'matching' &&
    (q.counterparts.length !== q.options.length ||
      q.counterparts.some((value) => !value || value.length > 2000) ||
      new Set(q.counterparts).size !== q.counterparts.length)
  ) {
    errors.push(
      'Для каждого понятия укажите отдельную пару с уникальной правой частью.',
    )
  }
  if (q.kind === 'single' || q.kind === 'multiple') {
    const indices = q.options.map((_, index) => String(index + 1))
    if (
      q.solutions.length < (q.kind === 'single' ? 1 : 2) ||
      (q.kind === 'single' && q.solutions.length !== 1) ||
      new Set(q.solutions).size !== q.solutions.length ||
      q.solutions.some((value) => !indices.includes(value))
    ) {
      errors.push(
        q.kind === 'single'
          ? 'В поле «Правильный ответ» укажите номер одного из вариантов.'
          : 'В поле «Правильный ответ» укажите разные номера минимум двух вариантов через запятую.',
      )
    }
  }
  return errors
}

export function demoSolutions(kind: DemoKind, value: string) {
  const separator = kind === 'short' ? /;/ : /[,;]/
  return value.trim() ? value.split(separator).map((part) => part.trim()) : []
}
