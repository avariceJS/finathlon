import type { Validator } from '../types'

export const validateMultipleChoice: Validator = ({ row, filledVariants, errors }) => {
  if (filledVariants.length < 2) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Вар.1–Вар.6',
      message: 'Для типа «Несколько ответов» нужно минимум 2 варианта ответа',
    })
    return null
  }

  const parts = row.rawCorrect.split(';').map((s) => s.trim()).filter(Boolean)
  const nums = parts.map((p) => Number(p))
  const uniqueNums = new Set(nums)

  if (
    parts.length < 1 ||
    nums.some((n) => !Number.isInteger(n) || n < 1 || n > filledVariants.length) ||
    uniqueNums.size !== nums.length
  ) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Правильный ответ',
      message: 'Укажите уникальные номера правильных вариантов через «;» (например, 1;3)',
    })
    return null
  }

  return {
    options: filledVariants.map((v) => v.text),
    correctAnswer: nums.sort((a, b) => a - b),
  }
}