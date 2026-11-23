import type { Validator } from '../types'

export const validateSequence: Validator = ({ row, filledVariants, errors }) => {
  if (filledVariants.length < 2) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Вар.1–Вар.6',
      message: 'Для типа «Последовательность» нужно минимум 2 шага',
    })
    return null
  }

  if (row.rawCorrect !== '') {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Правильный ответ',
      message: 'Для типа «Последовательность» столбец «Правильный ответ» должен быть пустым',
    })
    return null
  }

  return {
    options: filledVariants.map((v) => v.text),
    correctAnswer: null,
  }
}