// src/pages/admin/question-banks/QuestionBankImportForm.tsx
import { useState } from 'react'

import {
  parseAndValidateExcelFile,
  saveOrReplaceQuestionBank,
  type ExcelParseResult,
  type QuestionBankGradeCategory,
  type QuestionBankSummary,
} from '@/entities/question-bank'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'

import { QuestionBankPreview } from './QuestionBankPreview'
import styles from './QuestionBankImportForm.module.css'

// ── Типы 

type OlympiadOption = {
  value: string
  label: string
}

type Props = {
  /** Режим: создаём новый банк или заменяем существующий */
  mode: 'create' | 'replace'
  /** При replace — данные существующего банка */
  existingBank?: Pick<
    QuestionBankSummary,
    'id' | 'olympiadId' | 'gradeCategory' | 'displayTitle'
  >
  /** Список олимпиад для <Select> (только при mode='create') */
  olympiadOptions?: OlympiadOption[]
  /** Колбэк после успешного сохранения — возвращает bankId */
  onSuccess: (bankId: string) => void
  /** Колбэк отмены / закрытия */
  onCancel: () => void
}

// ── Константы 

const GRADE_OPTIONS: Array<{ value: QuestionBankGradeCategory; label: string }> = [
  { value: '6-7',   label: '6–7 классы'   },
  { value: '8-9',   label: '8–9 классы'   },
  { value: '10-11', label: '10–11 классы' },
]
