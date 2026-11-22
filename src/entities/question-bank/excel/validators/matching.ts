import type { MatchingPair } from '../../types'
import type { Validator } from '../types'

export const validateMatching: Validator = ({ row, filledVariants, errors }) => {
  if (filledVariants.length < 2) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Вар.1–Вар.6',
      message: 'Для типа «Соответствие» нужно минимум 2 пары',
    })
    return null
  }

  const pairs: MatchingPair[] = []
  let hasError = false

  for (const item of filledVariants) {
    const splitIdx = item.text.indexOf('|')
    if (splitIdx === -1) {
      errors.push({
        rowNumber: row.excelLine,
        field: `Вар.${item.index}`,
        message: 'Пара должна содержать разделитель «|» (Понятие | Определение)',
      })
      hasError = true
    } else {
      const left = item.text.slice(0, splitIdx).trim()
      const right = item.text.slice(splitIdx + 1).trim()
      if (!left || !right) {
        errors.push({
          rowNumber: row.excelLine,
          field: `Вар.${item.index}`,
          message: 'Обе части пары вокруг «|» должны быть заполнены',
        })
        hasError = true
      } else {
        pairs.push({ left, right })
      }
    }
  }

  if (row.rawCorrect !== '') {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Правильный ответ',
      message: 'Для типа «Соответствие» столбец «Правильный ответ» должен быть пустым',
    })
    hasError = true
  }

  if (hasError) return null
  return { options: pairs, correctAnswer: null }
}