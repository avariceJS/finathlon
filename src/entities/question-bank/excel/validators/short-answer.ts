import type { Validator } from '../types'

export const validateShortAnswer: Validator = ({ row, filledVariants, errors }) => {
  if (filledVariants.length > 0) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Вар.1–Вар.6',
      message: 'Для типа «Короткий ответ» поля вариантов должны быть пустыми',
    })
    return null
  }

  const accepted = row.rawCorrect.split(';').map((s) => s.trim()).filter(Boolean)
  if (accepted.length === 0) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Правильный ответ',
      message: 'Укажите хотя бы один правильный ответ (несколько — через «;»)',
    })
    return null
  }

  return { options: [], correctAnswer: accepted }
}