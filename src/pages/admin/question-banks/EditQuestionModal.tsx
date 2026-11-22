// src/pages/admin/question-banks/EditQuestionModal.tsx
import { useEffect, useState, type MouseEvent } from 'react'

import type {
  QuestionVariant,
  UpdateQuestionVariantInput,
} from '@/entities/question-bank'

import styles from './EditQuestionModal.module.css'

type Props = {
  variant: QuestionVariant
  onSave: (input: UpdateQuestionVariantInput) => Promise<void>
  onClose: () => void
}

function serializeAnswer(value: QuestionVariant['correctAnswer']): string {
  if (value === null) return 'null'
  return JSON.stringify(value, null, 2)
}

export function EditQuestionModal({ variant, onSave, onClose }: Props) {
  const [questionText, setQuestionText] = useState(variant.questionText)
  const [points, setPoints] = useState(String(variant.points))
  const [correctAnswerRaw, setCorrectAnswerRaw] = useState(
    serializeAnswer(variant.correctAnswer),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)


  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isSaving, onClose])

  function handleOverlayMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !isSaving) onClose()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveError(null)
    const trimmedText = questionText.trim()
    if (!trimmedText) {
      setSaveError('Текст вопроса не может быть пустым')
      return
    }
    const parsedPoints = Number(points.replace(',', '.'))
    if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
      setSaveError('Балл должен быть положительным числом')
      return
    }
    let parsedAnswer: UpdateQuestionVariantInput['correctAnswer']
    try {
      parsedAnswer = JSON.parse(correctAnswerRaw) as UpdateQuestionVariantInput['correctAnswer']
    } catch {
      setSaveError('Правильный ответ содержит невалидный JSON. Примеры: 1, [1,3], ["текст"], null')
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        questionText: trimmedText,
        options: variant.options,
        correctAnswer: parsedAnswer,
        points: parsedPoints,
      })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
      setIsSaving(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className={styles.content}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={isSaving}
          aria-label="Закрыть"
        >
          ×
        </button>

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
          <h2 id="edit-modal-title" className={styles.title}>
            Редактирование вопроса №{variant.rowNumber}
          </h2>
          <p className={styles.meta}>
            Версия: v{variant.currentVersion} · ID: {variant.id.slice(0, 8)}…
          </p>

          {saveError ? (
            <div className={styles.errorBanner} role="alert">
              {saveError}
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="edit-question-text" className={styles.label}>
              Текст вопроса
            </label>
            <textarea
              id="edit-question-text"
              className={styles.textarea}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              disabled={isSaving}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-points" className={styles.label}>
              Балл за вопрос
            </label>
            <input
              id="edit-points"
              type="number"
              className={styles.input}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min={0.5}
              step={0.5}
              disabled={isSaving}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-correct-answer" className={styles.label}>
              Правильный ответ (JSON)
            </label>
            <textarea
              id="edit-correct-answer"
              className={`${styles.textarea} ${styles.textareaCode}`}
              value={correctAnswerRaw}
              onChange={(e) => setCorrectAnswerRaw(e.target.value)}
              rows={3}
              disabled={isSaving}
              spellCheck={false}
            />
            <span className={styles.hint}>
              Один ответ: <code>1</code> · Несколько: <code>[1,3]</code> · Текст: <code>["ответ1","ответ2"]</code> · Соответствие/последовательность: <code>null</code>
            </span>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={isSaving}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={
                isSaving
                  ? `${styles.btnPrimary} ${styles.btnLoading}`
                  : styles.btnPrimary
              }
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

