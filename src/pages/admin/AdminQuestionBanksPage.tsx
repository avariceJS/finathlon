import { useEffect, useState } from 'react'

import type { Olympiad } from '@/entities/olympiad'
import {
  BankAlreadyExistsError,
  deleteQuestionBank,
  findExistingQuestionBank,
  getQuestionBankById,
  getVariantHistory,
  listQuestionBanks,
  saveOrReplaceQuestionBank,
  updateQuestionVariant,
  type CorrectAnswerPayload,
  type MatchingPair,
  type QuestionBankDetail,
  type QuestionBankGradeCategory,
  type QuestionBankSummary,
  type QuestionType,
  type QuestionVariant,
  type QuestionVariantHistoryEntry,
} from '@/entities/question-bank'
import {
  parseAndValidateExcelFile,
  type ExcelParseResult,
} from '@/features/question-bank-import/excelParser'
import { olympiadsApi } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'

import styles from './AdminQuestionBanksPage.module.css'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Один ответ',
  multiple_choice: 'Несколько ответов',
  matching: 'Соответствие',
  short_answer: 'Короткий ответ',
  sequence: 'Последовательность',
}

const GRADE_OPTIONS: Array<{ value: QuestionBankGradeCategory; label: string }> =
  [
    { value: '6-7', label: '6–7 классы' },
    { value: '8-9', label: '8–9 классы' },
    { value: '10-11', label: '10–11 классы' },
  ]

type PageView =
  | { kind: 'list' }
  | { kind: 'detail'; bank: QuestionBankDetail }

type ImportModalState =
  | { kind: 'closed' }
  | { kind: 'create' }

  | { kind: 'replace'; bank: QuestionBankSummary | QuestionBankDetail }

type VariantEditState = {
  variant: QuestionVariant
  questionType: QuestionType
  questionText: string
  points: string
  textOptions: string[]
  matchingOptions: MatchingPair[]
  correctAnswerRaw: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function buildOlympiadOptionLabel(o: Olympiad): string {
  const base = o.profileTitle?.trim() || o.title
  const season = o.season?.trim() ? `, ${o.season}` : `, ${o.year}`
  return `${base}${season}`
}

function variantToEditState(
  variant: QuestionVariant,
  questionType: QuestionType,
): VariantEditState {
  const isMatching = questionType === 'matching'
  const textOptions = isMatching
    ? []
    : (variant.options as string[]).slice()
  const matchingOptions = isMatching
    ? (variant.options as MatchingPair[]).map((p) => ({
        left: p.left,
        right: p.right,
      }))
    : []

  let correctAnswerRaw = ''
  if (questionType === 'single_choice' && typeof variant.correctAnswer === 'number') {
    correctAnswerRaw = String(variant.correctAnswer)
  } else if (
    questionType === 'multiple_choice' &&
    Array.isArray(variant.correctAnswer)
  ) {
    correctAnswerRaw = (variant.correctAnswer as number[]).join(';')
  } else if (
    questionType === 'short_answer' &&
    Array.isArray(variant.correctAnswer)
  ) {
    correctAnswerRaw = (variant.correctAnswer as string[]).join(';')
  }

  return {
    variant,
    questionType,
    questionText: variant.questionText,
    points: String(variant.points),
    textOptions,
    matchingOptions,
    correctAnswerRaw,
  }
}
export function AdminQuestionBanksPage() {
  const [view, setView] = useState<PageView>({ kind: 'list' })
  const [banks, setBanks] = useState<QuestionBankSummary[]>([])
  const [olympiads, setOlympiads] = useState<Olympiad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [importModal, setImportModal] = useState<ImportModalState>({
    kind: 'closed',
  })
  const [selectedOlympiadId, setSelectedOlympiadId] = useState('')
  const [selectedGrade, setSelectedGrade] =
    useState<QuestionBankGradeCategory>('8-9')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [duplicateBankId, setDuplicateBankId] = useState<string | null>(null)
  const [confirmReplaceChecked, setConfirmReplaceChecked] = useState(false)

  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  )
  const [editState, setEditState] = useState<VariantEditState | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingVariant, setIsSavingVariant] = useState(false)

  const [historyModal, setHistoryModal] = useState<{
    variantRow: number
    entries: QuestionVariantHistoryEntry[]
  } | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const loadListAndOlympiads = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [banksData, olympiadsRes] = await Promise.all([
        listQuestionBanks(),
        olympiadsApi.listOlympiads({ includeUnpublished: true }),
      ])
      if (olympiadsRes.error) {
        throw new Error(olympiadsRes.error)
      }
      setBanks(banksData)
      const list = olympiadsRes.data ?? []
      setOlympiads(list)
      const firstOlympiad = list.at(0)
      if (!selectedOlympiadId && firstOlympiad) {
        setSelectedOlympiadId(firstOlympiad.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadListAndOlympiads()
  }, [])

  const openBankDetail = async (bankId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const detail = await getQuestionBankById(bankId)
      setExpandedTaskIds(new Set(detail.tasks.slice(0, 2).map((t) => t.id)))
      setView({ kind: 'detail', bank: detail })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateModal = () => {
    setSelectedFile(null)
    setParseResult(null)
    setImportError(null)
    setDuplicateBankId(null)
    setConfirmReplaceChecked(false)
    setImportModal({ kind: 'create' })
  }

  const openReplaceModal = (
    bank: QuestionBankSummary | QuestionBankDetail,
  ) => {
    setSelectedOlympiadId(bank.olympiadId)
    setSelectedGrade(bank.gradeCategory)
    setSelectedFile(null)
    setParseResult(null)
    setImportError(null)
    setDuplicateBankId(null)
    setConfirmReplaceChecked(false)
    setImportModal({ kind: 'replace', bank })
  }

  const closeImportModal = () => {
    if (!isParsing && !isSavingBank) {
      setImportModal({ kind: 'closed' })
    }
  }

  const handlePreviewExcel = async () => {
    setImportError(null)
    setDuplicateBankId(null)

    if (importModal.kind === 'create') {
      if (!selectedOlympiadId) {
        setImportError('Выберите профиль олимпиады')
        return
      }
      try {
        const existing = await findExistingQuestionBank(
          selectedOlympiadId,
          selectedGrade,
        )
        if (existing) {
          setDuplicateBankId(existing.id)
          setImportError(
            'Для выбранного профиля, сезона и категории классов набор вопросов уже создан.',
          )
          return
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : String(err))
        return
      }
    }

    if (!selectedFile) {
      setImportError('Выберите Excel-файл (.xlsx) для проверки')
      return
    }

    setIsParsing(true)
    try {
      const result = await parseAndValidateExcelFile(selectedFile)
      setParseResult(result)
    } finally {
      setIsParsing(false)
    }
  }

  const handleSaveImportedBank = async () => {
    if (!parseResult || !parseResult.isValid || isSavingBank) return
    const isReplace = importModal.kind === 'replace'
    if (isReplace && !confirmReplaceChecked) {
      setImportError('Подтвердите замену существующего набора вопросов')
      return
    }

    setIsSavingBank(true)
    setImportError(null)
    try {
      const targetOlympiadId = isReplace
        ? importModal.bank.olympiadId
        : selectedOlympiadId
      const targetGrade = isReplace
        ? importModal.bank.gradeCategory
        : selectedGrade

      const { bankId } = await saveOrReplaceQuestionBank({
        olympiadId: targetOlympiadId,
        gradeCategory: targetGrade,
        tasks: parseResult.tasks,
        replaceExisting: isReplace,
      })

      setImportModal({ kind: 'closed' })
      setSuccessMessage(
        isReplace
          ? 'Набор вопросов успешно обновлён из Excel.'
          : 'Новый набор вопросов успешно создан.',
      )
      await loadListAndOlympiads()
      await openBankDetail(bankId)
    } catch (err) {
      if (err instanceof BankAlreadyExistsError) {
        setDuplicateBankId(err.existingBankId)
        setImportError(err.message)
      } else {
        setImportError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setIsSavingBank(false)
    }
  }

  const handleDeleteBank = async (bank: QuestionBankSummary) => {
    if (
      !confirm(
        `Удалить набор вопросов «${bank.displayTitle}» (${bank.tasksCount} заданий, ${bank.variantsCount} вопросов)? Это действие необратимо.`,
      )
    ) {
      return
    }

    setError(null)
    try {
      await deleteQuestionBank(bank.id)
      setSuccessMessage(`Набор «${bank.displayTitle}» удалён.`)
      if (view.kind === 'detail' && view.bank.id === bank.id) {
        setView({ kind: 'list' })
      }
      await loadListAndOlympiads()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleSaveVariantEdit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    if (!editState || isSavingVariant || view.kind !== 'detail') return

    const trimmedText = editState.questionText.trim()
    if (!trimmedText) {
      setEditError('Текст вопроса не может быть пустым')
      return
    }

    const parsedPoints = Number(editState.points.replace(',', '.'))
    if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
      setEditError('Балл должен быть положительным числом')
      return
    }

    let options: string[] | MatchingPair[] = []
    let correctAnswer: CorrectAnswerPayload = null

    if (editState.questionType === 'matching') {
      const cleaned = editState.matchingOptions
        .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
        .filter((p) => p.left || p.right)
      if (cleaned.length < 2 || cleaned.some((p) => !p.left || !p.right)) {
        setEditError('Для соответствия нужно минимум 2 полностью заполненные пары')
        return
      }
      options = cleaned
      correctAnswer = null
    } else if (editState.questionType === 'short_answer') {
      const accepted = editState.correctAnswerRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      if (accepted.length === 0) {
        setEditError('Укажите хотя бы один правильный ответ')
        return
      }
      options = []
      correctAnswer = accepted
    } else {
      const cleaned = editState.textOptions.map((s) => s.trim()).filter(Boolean)
      if (cleaned.length < 2) {
        setEditError('Укажите минимум 2 варианта ответа')
        return
      }
      options = cleaned

      if (editState.questionType === 'single_choice') {
        const ans = Number(editState.correctAnswerRaw.trim())
        if (!Number.isInteger(ans) || ans < 1 || ans > cleaned.length) {
          setEditError(`Правильный ответ должен быть числом от 1 до ${cleaned.length}`)
          return
        }
        correctAnswer = ans
      } else if (editState.questionType === 'multiple_choice') {
        const parts = editState.correctAnswerRaw
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
        const nums = parts.map((p) => Number(p))
        if (
          parts.length === 0 ||
          nums.some((n) => !Number.isInteger(n) || n < 1 || n > cleaned.length) ||
          new Set(nums).size !== nums.length
        ) {
          setEditError(
            `Укажите уникальные номера правильных вариантов от 1 до ${cleaned.length} через «;»`,
          )
          return
        }
        correctAnswer = nums.sort((a, b) => a - b)
      } else {
        correctAnswer = null
      }
    }

    setIsSavingVariant(true)
    setEditError(null)
    try {
      await updateQuestionVariant(editState.variant.id, {
        questionText: trimmedText,
        options,
        correctAnswer,
        points: parsedPoints,
      })
      const currentBankId = view.bank.id
      setEditState(null)
      setSuccessMessage('Изменения вопроса сохранены (версия обновлена).')
      await openBankDetail(currentBankId)
      await loadListAndOlympiads()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSavingVariant(false)
    }
  }

  const handleOpenHistory = async (variant: QuestionVariant) => {
    setIsLoadingHistory(true)
    setHistoryModal({ variantRow: variant.rowNumber, entries: [] })
    try {
      const entries = await getVariantHistory(variant.id)
      setHistoryModal({ variantRow: variant.rowNumber, entries })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setHistoryModal(null)
    } finally {
      setIsLoadingHistory(false)
    }
  }
  const renderVariantPreview = (
    variant: QuestionVariant,
    qType: QuestionType,
  ) => {
    if (qType === 'short_answer') {
      const answers = Array.isArray(variant.correctAnswer)
        ? (variant.correctAnswer as string[]).join('; ')
        : ''
      return (
        <div className={styles.muted}>
          Правильный ответ: <strong className={styles.optionCorrect}>{answers}</strong>
        </div>
      )
    }

    if (qType === 'matching') {
      const pairs = variant.options as MatchingPair[]
      return (
        <ul className={styles.optionsList}>
          {pairs.map((pair, idx) => (
            <li key={idx}>
              <strong>{pair.left}</strong> → {pair.right}
            </li>
          ))}
        </ul>
      )
    }

    const opts = variant.options as string[]
    return (
      <ol className={styles.optionsList}>
        {opts.map((opt, idx) => {
          const num = idx + 1
          const isCorrect =
            (qType === 'single_choice' && variant.correctAnswer === num) ||
            (qType === 'multiple_choice' &&
              Array.isArray(variant.correctAnswer) &&
              (variant.correctAnswer as number[]).includes(num))
          return (
            <li
              key={idx}
              className={isCorrect ? styles.optionCorrect : undefined}
            >
              {opt} {isCorrect ? '✓' : ''}
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <AdminLayout
      title={
        view.kind === 'detail'
          ? view.bank.displayTitle
          : 'Набор вопросов'
      }
      description={
        view.kind === 'detail'
          ? `Заданий: ${view.bank.tasksCount} · Всего вопросов: ${view.bank.variantsCount}`
          : 'Управление банками олимпиадных вопросов по профилям, сезонам и классам.'
      }
      actions={
        view.kind === 'detail' ? (
          <div className={styles.rowActions}>
            <Button
              variant="secondary"
              onClick={() => setView({ kind: 'list' })}
            >
              ← К списку наборов
            </Button>
            <Button onClick={() => openReplaceModal(view.bank)}>
              Загрузить новый Excel
            </Button>
          </div>
        ) : (
          <Button onClick={openCreateModal}>+ Создать набор</Button>
        )
      }
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success" title="Выполнено">
          {successMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем данные..." />
      ) : view.kind === 'list' ? (
        <AdminTable
          data={banks}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'displayTitle',
              header: 'Набор вопросов',
              render: (item) => (
                <div>
                  <strong>{item.displayTitle}</strong>
                  <div className={styles.muted}>
                    Обновлён: {formatDate(item.updatedAt)}
                  </div>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: 'Дата создания',
              render: (item) => formatDate(item.createdAt),
            },
            {
              key: 'counts',
              header: 'Состав',
              render: (item) => (
                <span>
                  {item.tasksCount} заданий / {item.variantsCount} вопросов
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Действия',
              render: (item) => (
                <div className={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void openBankDetail(item.id)}
                  >
                    Открыть
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openReplaceModal(item)}
                  >
                    Повторный импорт
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDeleteBank(item)}
                  >
                    Удалить
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <div className={styles.taskList}>
          {view.bank.tasks.map((task) => {
            const isOpen = expandedTaskIds.has(task.id)
            return (
              <div key={task.id} className={styles.taskCard}>
                <button
                  type="button"
                  className={styles.taskHeader}
                  onClick={() => toggleTaskExpand(task.id)}
                >
                  <div className={styles.taskTitleGroup}>
                    <strong>Задание №{task.taskNumber}</strong>
                    <span className={styles.badge}>
                      {QUESTION_TYPE_LABELS[task.questionType]}
                    </span>
                    <span className={styles.muted}>
                      ({task.variants.length} вариантов)
                    </span>
                  </div>
                  <span>{isOpen ? '▲ Свернуть' : '▼ Раскрыть'}</span>
                </button>

                {isOpen ? (
                  <div className={styles.variantsBody}>
                    {task.variants.map((variant) => (
                      <div key={variant.id} className={styles.variantBox}>
                        <div className={styles.variantTop}>
                          <div>
                            <span className={styles.muted}>
                              Вопрос №{variant.rowNumber} · Балл: {variant.points} · Версия: v{variant.currentVersion}
                            </span>
                            <div className={styles.variantText}>
                              {variant.questionText}
                            </div>
                          </div>
                          <div className={styles.rowActions}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setEditState(
                                  variantToEditState(variant, task.questionType),
                                )
                              }
                            >
                              Редактировать
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => void handleOpenHistory(variant)}
                            >
                              История
                            </Button>
                          </div>
                        </div>

                        {renderVariantPreview(variant, task.questionType)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      <Modal
        open={importModal.kind !== 'closed'}
        onClose={closeImportModal}
        title={
          importModal.kind === 'replace'
            ? `Повторная загрузка Excel: ${importModal.bank.displayTitle}`
            : 'Создание набора вопросов из Excel'
        }
      >
        <div className={styles.formSection}>
          {importError ? (
            <Alert variant="error" title="Проверка не пройдена">
              {importError}
              {duplicateBankId ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const id = duplicateBankId
                      setImportModal({ kind: 'closed' })
                      void openBankDetail(id)
                    }}
                  >
                    Открыть существующий набор
                  </Button>
                </div>
              ) : null}
            </Alert>
          ) : null}

          {importModal.kind === 'create' ? (
            <div className={styles.formGrid}>
              <Select
                label="Профиль и сезон олимпиады"
                value={selectedOlympiadId}
                onChange={(e) => {
                  setSelectedOlympiadId(e.target.value)
                  setParseResult(null)
                  setDuplicateBankId(null)
                  setImportError(null)
                }}
                options={olympiads.map((o) => ({
                  value: o.id,
                  label: buildOlympiadOptionLabel(o),
                }))}
              />

              <Select
                label="Категория классов"
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value as QuestionBankGradeCategory)
                  setParseResult(null)
                  setDuplicateBankId(null)
                  setImportError(null)
                }}
                options={GRADE_OPTIONS}
              />
            </div>
          ) : null}

          <div className={styles.fileDrop}>
            <label htmlFor="excel-upload-input">
              <strong>Файл Excel (.xlsx)</strong>
            </label>
            <input
              id="excel-upload-input"
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files?.item(0) ?? null
                setSelectedFile(file)
                setParseResult(null)
                setImportError(null)
              }}
            />
            <span className={styles.muted}>
              Ожидаемые колонки: №, Задание, Балл, Тип, Вопрос, Вар.1–Вар.6, Правильный ответ
            </span>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => void handlePreviewExcel()}
              disabled={isParsing || isSavingBank}
            >
              {isParsing
                ? 'Проверяем файл...'
                : 'Проверить и открыть предпросмотр'}
            </Button>
          </div>

          {parseResult ? (
            <div>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Строк в файле</span>
                  <span className={styles.statValue}>
                    {parseResult.stats.totalRows}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Заданий</span>
                  <span className={styles.statValue}>
                    {parseResult.stats.tasksCount}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Вопросов</span>
                  <span className={styles.statValue}>
                    {parseResult.stats.variantsCount}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Ошибок</span>
                  <span className={styles.statValue}>
                    {parseResult.errors.length}
                  </span>
                </div>
              </div>

              {parseResult.errors.length > 0 ? (
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
                      {parseResult.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td>{err.rowNumber ?? '—'}</td>
                          <td>{err.field}</td>
                          <td>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert variant="success" title="Проверка успешно пройдена">
                  Ошибок не обнаружено. Набор готов к сохранению в базу данных.
                </Alert>
              )}

              {parseResult.isValid && importModal.kind === 'replace' ? (
                <label
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginTop: '0.75rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={confirmReplaceChecked}
                    onChange={(e) => setConfirmReplaceChecked(e.target.checked)}
                  />
                  <span>
                    Подтверждаю полную замену текущих вопросов в этом наборе на вопросы из нового файла
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}

          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              onClick={closeImportModal}
              disabled={isSavingBank}
            >
              Отмена
            </Button>
            <Button
              onClick={() => void handleSaveImportedBank()}
              disabled={!parseResult?.isValid || isSavingBank}
            >
              {isSavingBank
                ? 'Сохраняем...'
                : importModal.kind === 'replace'
                  ? 'Заменить набор вопросов'
                  : 'Сохранить набор вопросов'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={editState !== null}
        onClose={() => {
          if (!isSavingVariant) setEditState(null)
        }}
        title={
          editState
            ? `Редактирование вопроса №${editState.variant.rowNumber} (${QUESTION_TYPE_LABELS[editState.questionType]})`
            : ''
        }
      >
        {editState ? (
          <form
            className={styles.formSection}
            onSubmit={(e) => void handleSaveVariantEdit(e)}
          >
            {editError ? (
              <Alert variant="error" title="Ошибка проверки">
                {editError}
              </Alert>
            ) : null}

            <div>
              <label htmlFor="edit-question-text">
                <strong>Текст вопроса</strong>
              </label>
              <textarea
                id="edit-question-text"
                className={styles.textarea}
                value={editState.questionText}
                onChange={(e) =>
                  setEditState({ ...editState, questionText: e.target.value })
                }
              />
            </div>

            <TextField
              label="Балл за вопрос"
              value={editState.points}
              onChange={(e) =>
                setEditState({ ...editState, points: e.target.value })
              }
            />

            {editState.questionType === 'matching' ? (
              <div className={styles.formSection}>
                <strong>Пары соответствия (Понятие → Определение)</strong>
                {editState.matchingOptions.map((pair, idx) => (
                  <div key={idx} className={styles.optionEditRow}>
                    <TextField
                      label={`Понятие ${idx + 1}`}
                      value={pair.left}
                      onChange={(e) => {
                        const copy = editState.matchingOptions.slice()
                        copy[idx] = { ...pair, left: e.target.value }
                        setEditState({ ...editState, matchingOptions: copy })
                      }}
                    />
                    <TextField
                      label={`Определение ${idx + 1}`}
                      value={pair.right}
                      onChange={(e) => {
                        const copy = editState.matchingOptions.slice()
                        copy[idx] = { ...pair, right: e.target.value }
                        setEditState({ ...editState, matchingOptions: copy })
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : editState.questionType !== 'short_answer' ? (
              <div className={styles.formSection}>
                <strong>Варианты ответа</strong>
                {editState.textOptions.map((opt, idx) => (
                  <TextField
                    key={idx}
                    label={`Вариант ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = editState.textOptions.slice()
                      copy[idx] = e.target.value
                      setEditState({ ...editState, textOptions: copy })
                    }}
                  />
                ))}
              </div>
            ) : null}

            {editState.questionType === 'single_choice' ||
            editState.questionType === 'multiple_choice' ||
            editState.questionType === 'short_answer' ? (
              <TextField
                label={
                  editState.questionType === 'single_choice'
                    ? 'Номер правильного варианта (1–6)'
                    : editState.questionType === 'multiple_choice'
                      ? 'Номера правильных вариантов через «;» (например, 1;3)'
                      : 'Правильный ответ (несколько вариантов через «;»)'
                }
                value={editState.correctAnswerRaw}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    correctAnswerRaw: e.target.value,
                  })
                }
              />
            ) : null}

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditState(null)}
                disabled={isSavingVariant}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSavingVariant}>
                {isSavingVariant ? 'Сохраняем...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={historyModal !== null}
        onClose={() => setHistoryModal(null)}
        title={
          historyModal
            ? `История изменений вопроса №${historyModal.variantRow}`
            : ''
        }
      >
        {isLoadingHistory ? (
          <Spinner label="Загружаем историю..." />
        ) : historyModal && historyModal.entries.length === 0 ? (
          <p className={styles.muted}>
            Этот вопрос ещё не редактировался после импорта.
          </p>
        ) : (
          <div className={styles.formSection}>
            {historyModal?.entries.map((entry) => (
              <div key={entry.id} className={styles.historyItem}>
                <div>
                  <strong>
                    Версия v{entry.versionFrom} → v{entry.versionTo}
                  </strong>{' '}
                  · <span className={styles.muted}>{formatDate(entry.createdAt)}</span>
                </div>
                <div className={styles.muted}>
                  Изменил: {entry.changedBy ?? 'Администратор'}
                </div>
                <div>
                  Изменённые поля:{' '}
                  <strong>{Object.keys(entry.changes).join(', ')}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
