// src/pages/admin/question-banks/QuestionBankPreview.tsx
import type { ExcelParseResult, ImportValidationError, QuestionType } from '@/entities/question-bank'

import styles from './QuestionBankPreview.module.css'

type Props = {
  result: ExcelParseResult
  onConfirm: () => void
  onCancel: () => void
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Один ответ',
  multiple_choice: 'Несколько ответов',
  matching: 'Соответствие',
  short_answer: 'Короткий ответ',
  sequence: 'Последовательность',
}

export function QuestionBankPreview({ result, onConfirm, onCancel }: Props) {
  const { stats, errors, tasks, isValid } = result

  return (
    <div className={styles.root}>

      {/* ── Статистика ── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Строк в файле</span>
          <span className={styles.statValue}>{stats.totalRows}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Заданий</span>
          <span className={styles.statValue}>{stats.tasksCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Вопросов</span>
          <span className={styles.statValue}>{stats.variantsCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ошибок</span>
          <span
            className={
              errors.length > 0
                ? `${styles.statValue} ${styles.statValueError}`
                : styles.statValue
            }
          >
            {errors.length}
          </span>
        </div>
      </section>

      {/* ── Распределение по типам ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Распределение по типам вопросов</h3>
        <div className={styles.typeGrid}>
          {(Object.entries(stats.byType) as [QuestionType, number][])
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <div key={type} className={styles.typeChip}>
                <span className={styles.typeLabel}>{QUESTION_TYPE_LABELS[type]}</span>
                <span className={styles.typeCount}>{count}</span>
              </div>
            ))}
        </div>
      </section>

      {/* ── Ошибки валидации ── */}
      {errors.length > 0 && (
        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} ${styles.sectionTitleError}`}>
            Ошибки валидации ({errors.length})
          </h3>
          <div className={styles.errorTableWrap}>
            <table className={styles.errorTable}>
              <thead>
                <tr>
                  <th>Строка</th>
                  <th>Поле</th>
                  <th>Описание ошибки</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err: ImportValidationError, idx: number) => (
                  <tr key={idx}>
                    <td>{err.rowNumber ?? '—'}</td>
                    <td>{err.field}</td>
                    <td>{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Предпросмотр заданий ── */}
      {tasks.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Предпросмотр заданий ({tasks.length})
          </h3>
          <div className={styles.taskList}>
            {tasks.map((task) => (
              <details key={task.taskNumber} className={styles.taskCard}>
                <summary className={styles.taskSummary}>
                  <span className={styles.taskTitleGroup}>
                    <strong>Задание №{task.taskNumber}</strong>
                    <span className={styles.badge}>
                      {QUESTION_TYPE_LABELS[task.questionType]}
                    </span>
                    <span className={styles.muted}>
                      {task.variants.length} вариантов
                    </span>
                  </span>
                </summary>
                <div className={styles.variantsList}>
                  {task.variants.map((variant, vIdx) => (
                    <div key={vIdx} className={styles.variantBox}>
                      <div className={styles.variantMeta}>
                        Вопрос №{variant.rowNumber} · Балл: {variant.points}
                      </div>
                      <div className={styles.variantText}>{variant.questionText}</div>
                      {task.questionType === 'short_answer' ? (
                        <div className={styles.muted}>
                          Правильный ответ:{' '}
                          <strong className={styles.correct}>
                            {Array.isArray(variant.correctAnswer)
                              ? (variant.correctAnswer as string[]).join('; ')
                              : String(variant.correctAnswer ?? '')}
                          </strong>
                        </div>
                      ) : task.questionType === 'matching' ? (
                        <ul className={styles.optionsList}>
                          {(variant.options as Array<{ left: string; right: string }>).map(
                            (pair, pIdx) => (
                              <li key={pIdx}>
                                <strong>{pair.left}</strong> → {pair.right}
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <ol className={styles.optionsList}>
                          {(variant.options as string[]).map((opt, oIdx) => {
                            const num = oIdx + 1
                            const isCorrect =
                              (task.questionType === 'single_choice' &&
                                variant.correctAnswer === num) ||
                              ((task.questionType === 'multiple_choice' ||
                                task.questionType === 'sequence') &&
                                Array.isArray(variant.correctAnswer) &&
                                (variant.correctAnswer as number[]).includes(num))
                            return (
                              <li key={oIdx} className={isCorrect ? styles.correct : undefined}>
                                {opt} {isCorrect ? '✓' : ''}
                              </li>
                            )
                          })}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Итоговый статус ── */}
      {isValid ? (
        <div className={styles.statusSuccess}>
          ✓ Проверка пройдена — набор готов к сохранению
        </div>
      ) : (
        <div className={styles.statusError}>
          ✗ Файл содержит ошибки. Исправьте их и загрузите файл повторно.
        </div>
      )}

      {/* ── Кнопки действий ── */}
      <div className={styles.footer}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onConfirm}
          disabled={!isValid}
        >
          Сохранить набор вопросов
        </button>
      </div>
    </div>
  )
}
