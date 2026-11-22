// src/pages/admin/question-banks/ReuploadExcelModal.tsx
import { useState } from 'react'
import type { QuestionBankGradeCategory } from '@/entities/question-bank'
import { parseAndValidateExcelFile } from '@/entities/question-bank'
import styles from './ReuploadExcelModal.module.css'

type Props = {
  olympiadId: string
  gradeCategory: QuestionBankGradeCategory
  onClose: () => void
  onSuccess: () => void
}

export function ReuploadExcelModal({ olympiadId, gradeCategory, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewStats, setPreviewStats] = useState<{ tasks: number; variants: number } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setPreviewStats(null)
    setIsParsing(true)

    try {
      const result = await parseAndValidateExcelFile(selectedFile)
      if (!result.isValid) {
        setError(`Файл содержит ${result.errors.length} ошибок. Исправьте их в Excel и загрузите снова.`)
      } else {
        setPreviewStats({ tasks: result.stats.tasksCount, variants: result.stats.variantsCount })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка чтения файла')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirm = () => {
    onSuccess() 
  }

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Повторная загрузка Excel</h2>
        
        <div className={styles.warning}>
          Внимание! Текущее содержимое набора будет <strong>ПОЛНОСТЬЮ ЗАМЕНЕНО</strong>. 
          Предыдущие вопросы будут удалены.
        </div>

        <div className={styles.uploadArea}>
          <label className={styles.fileLabel}>
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={handleFileChange} 
              disabled={isParsing}
              className={styles.fileInput}
            />
            {isParsing ? 'Проверка файла...' : (file ? file.name : 'Выберите файл .xlsx')}
          </label>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {previewStats && (
          <div className={styles.successPreview}>
            Файл корректен: {previewStats.tasks} заданий, {previewStats.variants} вопросов.
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isParsing}>
            Отмена
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            className={styles.btnPrimary} 
            disabled={!file || isParsing || !!error}
          >
            {isParsing ? 'Загрузка...' : 'Подтвердить замену'}
          </button>
        </div>
      </div>
    </div>
  )
}