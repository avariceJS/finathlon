import { useEffect, useState, type FormEvent } from 'react'

import { listDemoAttempts } from '@/entities/demo-test/api'
import {
  DEMO_GRADES,
  DEMO_PROFILES,
  demoDateFormat,
  demoOptions,
  type DemoAttempt,
  type DemoFilters,
} from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './AdminDemo.module.css'

const emptyFilters: DemoFilters = {
  profile: '',
  grades: '',
  from: '',
  to: '',
  region: '',
}
const pageSize = 25

export function DemoResults() {
  const [draft, setDraft] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(0)
  const [results, setResults] = useState<{
    rows: DemoAttempt[]
    count: number
  }>()
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    let active = true
    void listDemoAttempts(filters, pageSize, { offset: page * pageSize })
      .then((value) => {
        if (active) setResults(value)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Не удалось загрузить результаты.',
          )
      })
    return () => {
      active = false
    }
  }, [filters, page])

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResults(undefined)
    setError('')
    setExportError('')
    setFilters({ ...draft, region: draft.region.trim() })
    setPage(0)
  }

  function openPage(next: number) {
    setResults(undefined)
    setError('')
    setPage(next)
  }

  async function download() {
    if (exporting) return
    setExportError('')
    setExporting(true)
    try {
      const attempts: DemoAttempt[] = []
      const batchSize = 500
      let after: DemoAttempt | undefined
      do {
        const { rows } = await listDemoAttempts(filters, batchSize, { after })
        attempts.push(...rows)
        after = rows.length === batchSize ? rows.at(-1) : undefined
      } while (after)
      const { exportDemoAttempts } =
        await import('@/entities/demo-test/spreadsheet')
      await exportDemoAttempts(attempts)
    } catch (cause) {
      setExportError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось выгрузить результаты.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className={styles.stack} aria-labelledby="demo-results-title">
      <h2 id="demo-results-title">Результаты</h2>
      <form
        className={styles.panel}
        onSubmit={apply}
        aria-label="Фильтры результатов"
      >
        <div className={styles.filters}>
          <Select
            label="Профиль"
            value={draft.profile}
            options={[
              { value: '', label: 'Все профили' },
              ...demoOptions(DEMO_PROFILES),
            ]}
            onChange={(event) =>
              setDraft({
                ...draft,
                profile: event.target.value as DemoFilters['profile'],
              })
            }
          />
          <Select
            label="Классы"
            value={draft.grades}
            options={[
              { value: '', label: 'Все классы' },
              ...demoOptions(DEMO_GRADES),
            ]}
            onChange={(event) =>
              setDraft({
                ...draft,
                grades: event.target.value as DemoFilters['grades'],
              })
            }
          />
          <TextField
            label="Регион"
            value={draft.region}
            maxLength={120}
            onChange={(event) =>
              setDraft({ ...draft, region: event.target.value })
            }
          />
          <TextField
            label="С даты (МСК)"
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value })
            }
          />
          <TextField
            label="По дату (МСК)"
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <Button type="submit" disabled={exporting}>
            Применить фильтры
          </Button>
          <Button
            variant="secondary"
            disabled={exporting || !results?.count}
            onClick={() => void download()}
          >
            {exporting ? 'Готовим файл…' : 'Выгрузить в Excel'}
          </Button>
        </div>
        {exportError && <Alert variant="error">{exportError}</Alert>}
      </form>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !results ? (
        <Spinner label="Загружаем результаты…" />
      ) : (
        <>
          <p role="status">Найдено попыток: {results.count}</p>
          {!results.rows.length && (
            <p className={styles.muted}>
              По этим фильтрам нет завершённых попыток.
            </p>
          )}
          {results.rows.length > 0 && (
            <ol className={styles.attempts} aria-label="Завершённые попытки">
              {results.rows.map((attempt) => (
                <li key={attempt.id}>
                  <dl className={styles.attempt}>
                    <div>
                      <dt>Дата и время (МСК)</dt>
                      <dd>
                        <time dateTime={attempt.completed_at}>
                          {demoDateFormat.format(
                            new Date(attempt.completed_at),
                          )}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>Профиль и классы</dt>
                      <dd>
                        {DEMO_PROFILES[attempt.profile]}
                        <br />
                        {DEMO_GRADES[attempt.grades]}
                      </dd>
                    </div>
                    <div>
                      <dt>Регион и город</dt>
                      <dd>
                        {attempt.region}
                        <br />
                        {attempt.city}
                      </dd>
                    </div>
                    <div>
                      <dt>Верных ответов</dt>
                      <dd>
                        {attempt.correct_count} из {attempt.question_count}
                      </dd>
                      <dt>Баллы</dt>
                      <dd>
                        {attempt.score} из {attempt.max_score}
                      </dd>
                    </div>
                    <div>
                      <dt>Вопросы с ошибками</dt>
                      <dd>{attempt.incorrect_numbers.join(', ') || '—'}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          )}
          {results.count > pageSize && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => openPage(page - 1)}
              >
                Назад
              </Button>
              <span>
                Страница {page + 1} из {Math.ceil(results.count / pageSize)}
              </span>
              <Button
                variant="secondary"
                disabled={(page + 1) * pageSize >= results.count}
                onClick={() => openPage(page + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
