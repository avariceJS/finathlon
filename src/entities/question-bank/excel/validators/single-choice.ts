import type { Validator } from '../types'

export const validateSingleChoice: Validator = ({ row, filledVariants, errors }) => {
  if (filledVariants.length < 2) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Вар.1–Вар.6',
      message: 'Для типа «Один ответ» нужно минимум 2 варианта ответа',
    })
    return null
  }

  const ansNum = Number(row.rawCorrect)
  if (
    !row.rawCorrect ||
    !Number.isInteger(ansNum) ||
    ansNum < 1 ||
    ansNum > filledVariants.length
  ) {
    errors.push({
      rowNumber: row.excelLine,
      field: 'Правильный ответ',
      message: `Укажите номер варианта от 1 до ${filledVariants.length || 6}`,
    })
    return null
  }

  return {
    options: filledVariants.map((v) => v.text),
    correctAnswer: ansNum,
  }
}